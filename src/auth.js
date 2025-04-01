import jwt from '@tsndr/cloudflare-worker-jwt';

// JWT令牌过期时间 (24小时)
const TOKEN_EXPIRY = 24 * 60 * 60;

// 处理登录请求
export async function handleLogin(request, env) {
  try {
    // 解析请求体
    console.log('开始处理登录请求');
    const data = await request.json();
    const { username, password } = data;
    
    console.log(`尝试验证用户: ${username}`);
    
    // 验证用户名/密码
    const isValid = await validateCredentials(username, password, env);
    
    if (!isValid) {
      console.log('验证失败: 用户名或密码不正确');
      return new Response(JSON.stringify({
        success: false,
        error: '用户名或密码不正确'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('用户验证成功，准备生成JWT令牌');
    
    try {
      // 验证JWT_SECRET是否存在且有效
      if (!env.JWT_SECRET) {
        throw new Error('JWT_SECRET环境变量未设置');
      }
      
      console.log(`尝试使用JWT_SECRET生成令牌，密钥长度: ${env.JWT_SECRET.length}`);
      
      // 生成JWT令牌
      const payload = {
        username: username,
        exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY
      };
      
      const token = await jwt.sign(payload, env.JWT_SECRET);
      console.log('JWT令牌生成成功');
      
      // 验证KV命名空间是否绑定
      if (!env.SYNC_KV) {
        throw new Error('SYNC_KV命名空间未绑定');
      }
      
      console.log('尝试将会话保存到KV');
      // 保存会话到KV
      const sessionData = {
        username,
        created: Date.now(),
        expires: Date.now() + TOKEN_EXPIRY * 1000
      };
      
      await env.SYNC_KV.put(
        `session:${token}`, 
        JSON.stringify(sessionData), 
        { expirationTtl: TOKEN_EXPIRY }
      );
      
      console.log('会话成功保存到KV');
      
      return new Response(JSON.stringify({
        success: true,
        token: token,
        expiresIn: TOKEN_EXPIRY
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (tokenErr) {
      console.error('令牌生成或保存错误:', tokenErr.message);
      return new Response(JSON.stringify({
        success: false,
        error: '登录处理过程中发生错误: ' + tokenErr.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (err) {
    console.error('请求解析错误:', err.message);
    return new Response(JSON.stringify({
      success: false,
      error: '无效的请求格式: ' + err.message
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 验证用户凭据
async function validateCredentials(username, password, env) {
  console.log(`检查凭据 - 用户名: ${username}, 有效用户名: ${env.VALID_USERNAME}`);
  
  // 开发模式下使用硬编码账号
  if (username === env.VALID_USERNAME && password === env.VALID_PASSWORD) {
    console.log('使用环境变量验证通过');
    return true;
  }
  
  // 从KV获取用户信息
  console.log('尝试从KV获取用户信息');
  const userKey = `auth:${username}`;
  let userData;
  
  try {
    userData = await env.SYNC_KV.get(userKey, 'json');
    console.log('KV用户数据:', userData ? '已找到' : '未找到');
  } catch (kvErr) {
    console.error('KV获取错误:', kvErr.message);
    return false;
  }
  
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
    if (!token) {
      console.log('validateToken: 令牌为空');
      return null;
    }
    
    console.log(`尝试验证令牌，使用密钥长度: ${env.JWT_SECRET?.length || '未知'}`);
    
    // 验证JWT令牌
    const isValid = await jwt.verify(token, env.JWT_SECRET);
    if (!isValid) {
      console.log('JWT验证失败');
      return null;
    }
    
    console.log('JWT验证成功，解析令牌');
    // 解析令牌以获取用户信息
    const decoded = jwt.decode(token);
    console.log('解析后的令牌载荷:', decoded.payload);
    return decoded.payload.username;
  } catch (err) {
    console.error('令牌验证错误:', err.message);
    return null;
  }
}