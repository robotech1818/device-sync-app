import jwt from '@tsndr/cloudflare-worker-jwt';

// JWT令牌过期时间 (24小时)
const TOKEN_EXPIRY = 24 * 60 * 60;

// 处理登录请求
export async function handleLogin(request, env) {
  try {
    const { username, password } = await request.json();
    
    // 验证用户名/密码
    const isValid = await validateCredentials(username, password, env);
    
    if (!isValid) {
      return new Response(JSON.stringify({
        success: false,
        error: '用户名或密码不正确'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 生成JWT令牌
    const token = await jwt.sign({
      username: username,
      exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY
    }, env.JWT_SECRET);
    
    // 保存会话到KV
    await env.SYNC_KV.put(`session:${token}`, JSON.stringify({
      username,
      created: Date.now(),
      expires: Date.now() + TOKEN_EXPIRY * 1000
    }), {
      expirationTtl: TOKEN_EXPIRY
    });
    
    return new Response(JSON.stringify({
      success: true,
      token: token,
      expiresIn: TOKEN_EXPIRY
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: '无效的请求'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 验证用户凭据
async function validateCredentials(username, password, env) {
  // 开发模式下使用硬编码账号
  if (username === env.VALID_USERNAME && password === env.VALID_PASSWORD) {
    return true;
  }
  
  // 从KV获取用户信息
  const userKey = `auth:${username}`;
  const userData = await env.SYNC_KV.get(userKey, 'json');
  
  if (!userData) {
    return false;
  }
  
  // 实际应用中应比较哈希密码
  return userData.password === password;
}

// 从请求中获取授权令牌
export function getAuthToken(request) {
  // 从授权头中获取
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // 从cookie中获取
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'authToken') {
        return value;
      }
    }
  }
  
  // 从URL参数中获取
  const url = new URL(request.url);
  return url.searchParams.get('token');
}

// 验证令牌并返回用户名
export async function validateToken(token, env) {
  try {
    // 验证JWT令牌
    const isValid = await jwt.verify(token, env.JWT_SECRET);
    if (!isValid) {
      return null;
    }
    
    // 解析令牌以获取用户信息
    const decoded = jwt.decode(token);
    return decoded.payload.username;
  } catch (err) {
    return null;
  }
}
