import jwt from '@tsndr/cloudflare-worker-jwt';

// JWT令牌过期时间 (4小时，单位：秒)
const TOKEN_EXPIRY = 4 * 60 * 60;

// 全局版本号和吊销列表的KV键
const GLOBAL_VERSION_KEY = 'auth:global_version';

// 缓存设置
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5分钟缓存
let globalVersionCache = null;
let globalVersionTimestamp = 0;
let revokedTokenCache = new Map(); // 缓存已吊销的令牌

// 简单的哈希函数（仅用于演示，生产环境应使用更安全的方法）
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return hash.toString(16); // 转换为16进制字符串
}

// 创建简单的日志工具
const logger = {
  debug: (msg) => console.log(`[DEBUG] ${msg}`),
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg, err) => {
    console.error(`[ERROR] ${msg}`);
    if (err) console.error(err);
  }
};

// 获取当前全局版本号（使用缓存减少KV读取）
async function getGlobalAuthVersion(env) {
  const now = Date.now();
  
  // 如果缓存有效，使用缓存
  if (globalVersionCache !== null && (now - globalVersionTimestamp < CACHE_TIMEOUT)) {
    return globalVersionCache;
  }
  
  try {
    const version = await env.SYNC_KV.get(GLOBAL_VERSION_KEY) || '0';
    // 更新缓存
    globalVersionCache = version;
    globalVersionTimestamp = now;
    return version;
  } catch (err) {
    logger.error('获取全局认证版本号失败', err);
    return '0';
  }
}

// 更新全局版本号（在更改密码/用户名后调用）
export async function updateGlobalAuthVersion(env) {
  try {
    // 获取当前版本号
    let currentVersion = await env.SYNC_KV.get(GLOBAL_VERSION_KEY) || '0';
    currentVersion = parseInt(currentVersion);
    
    // 递增版本号
    const newVersion = (currentVersion + 1).toString();
    
    // 更新KV
    await env.SYNC_KV.put(GLOBAL_VERSION_KEY, newVersion);
    
    // 更新缓存
    globalVersionCache = newVersion;
    globalVersionTimestamp = Date.now();
    
    logger.info(`已更新全局认证版本号至 ${newVersion}`);
    return newVersion;
  } catch (err) {
    logger.error('更新全局认证版本号失败', err);
    return null;
  }
}

// 创建一个吊销列表
async function addToRevocationList(token, env) {
  try {
    // 使用KV存储吊销的令牌
    const revocationKey = `revoked:${token}`;
    // 存储令牌和吊销时间
    await env.SYNC_KV.put(revocationKey, Date.now().toString(), {
      // 设置过期时间，与令牌过期时间相同
      expirationTtl: TOKEN_EXPIRY
    });
    
    // 更新内存缓存
    revokedTokenCache.set(token, true);
    
    return true;
  } catch (err) {
    logger.error('添加吊销令牌失败', err);
    return false;
  }
}

// 检查令牌是否被吊销（使用缓存减少KV读取）
async function isTokenRevoked(token, env) {
  try {
    // 首先检查缓存
    if (revokedTokenCache.has(token)) {
      return true;
    }
    
    const revocationKey = `revoked:${token}`;
    const revokedTime = await env.SYNC_KV.get(revocationKey);
    
    // 更新缓存
    if (revokedTime) {
      revokedTokenCache.set(token, true);
      return true;
    }
    
    return false;
  } catch (err) {
    logger.error('检查令牌吊销状态错误', err);
    return false; // 出错时默认令牌未被吊销
  }
}

// 处理登录请求
export async function handleLogin(request, env) {
  try {
    // 解析请求体
    logger.info('开始处理登录请求');
    const data = await request.json();
    const { username, password } = data;
    
    logger.debug(`尝试验证用户: ${username}`);
    
    // 验证用户名/密码
    const isValid = await validateCredentials(username, password, env);
    
    if (!isValid) {
      logger.info('验证失败: 用户名或密码不正确');
      return new Response(JSON.stringify({
        success: false,
        error: '用户名或密码不正确'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    logger.info('用户验证成功，准备生成JWT令牌');
    
    try {
      // 验证JWT_SECRET是否存在且有效
      if (!env.JWT_SECRET) {
        throw new Error('JWT_SECRET环境变量未设置');
      }
      
      // 获取当前全局版本号
      const currentVersion = await getGlobalAuthVersion(env);
      
      // 计算密码哈希
      const passwordHash = simpleHash(password);
      
      // 生成JWT令牌
      const payload = {
        username: username,
        exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY,
        authVersion: currentVersion, // 添加认证版本号
        passwordHash: passwordHash   // 添加密码哈希
      };
      
      const token = await jwt.sign(payload, env.JWT_SECRET);
      logger.info('JWT令牌生成成功');
      
      // 验证KV命名空间是否绑定
      if (!env.SYNC_KV) {
        throw new Error('SYNC_KV命名空间未绑定');
      }
      
      logger.debug('尝试将会话保存到KV');
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
      
      logger.info('会话成功保存到KV');
      
      return new Response(JSON.stringify({
        success: true,
        token: token,
        expiresIn: TOKEN_EXPIRY
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (tokenErr) {
      logger.error('令牌生成或保存错误', tokenErr);
      return new Response(JSON.stringify({
        success: false,
        error: '登录处理过程中发生错误: ' + tokenErr.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (err) {
    logger.error('请求解析错误', err);
    return new Response(JSON.stringify({
      success: false,
      error: '无效的请求格式: ' + err.message
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 处理注销请求
export async function handleLogout(request, env) {
  try {
    // 从请求中获取令牌
    const token = getAuthToken(request);
    
    if (token) {
      // 将令牌添加到吊销列表并移除会话数据（并行处理）
      await Promise.all([
        addToRevocationList(token, env),
        env.SYNC_KV.delete(`session:${token}`)
      ]);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: '已成功注销'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    logger.error('注销过程中发生错误', err);
    return new Response(JSON.stringify({
      success: false,
      error: '注销过程中发生错误: ' + err.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 处理令牌刷新请求
export async function handleRefreshToken(request, env) {
  try {
    // 获取当前令牌
    const token = getAuthToken(request);
    
    if (!token) {
      return new Response(JSON.stringify({
        success: false,
        error: '无效的令牌'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 验证令牌
    const username = await validateToken(token, env);
    
    if (!username) {
      return new Response(JSON.stringify({
        success: false,
        error: '令牌已过期或无效'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 获取当前全局版本号
    const currentVersion = await getGlobalAuthVersion(env);
    
    // 计算当前有效密码的哈希
    const passwordHash = simpleHash(env.VALID_PASSWORD);
    
    // 生成新令牌
    const payload = {
      username: username,
      exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY,
      authVersion: currentVersion,
      passwordHash: passwordHash
    };
    
    const newToken = await jwt.sign(payload, env.JWT_SECRET);
    
    // 保存新的会话到KV并将旧令牌添加到吊销列表（并行处理）
    const sessionData = {
      username,
      created: Date.now(),
      expires: Date.now() + TOKEN_EXPIRY * 1000
    };
    
    await Promise.all([
      env.SYNC_KV.put(
        `session:${newToken}`, 
        JSON.stringify(sessionData), 
        { expirationTtl: TOKEN_EXPIRY }
      ),
      addToRevocationList(token, env)
    ]);
    
    return new Response(JSON.stringify({
      success: true,
      token: newToken,
      expiresIn: TOKEN_EXPIRY
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    logger.error('刷新令牌过程中发生错误', err);
    return new Response(JSON.stringify({
      success: false,
      error: '刷新令牌过程中发生错误: ' + err.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 管理员强制所有用户重新登录
export async function handleForceRelogin(request, env) {
  try {
    // 获取令牌并验证是否为管理员
    const token = getAuthToken(request);
    const username = await validateToken(token, env);
    
    // 只允许管理员执行此操作
    if (username !== env.VALID_USERNAME) {
      return new Response(JSON.stringify({
        success: false,
        error: '权限不足，仅管理员可执行此操作'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 更新全局版本号，使所有现有令牌失效
    const newVersion = await updateGlobalAuthVersion(env);
    
    return new Response(JSON.stringify({
      success: true,
      message: '已强制所有用户重新登录',
      newVersion
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    logger.error('强制重新登录过程中发生错误', err);
    return new Response(JSON.stringify({
      success: false,
      error: '强制重新登录过程中发生错误: ' + err.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 验证用户凭据
async function validateCredentials(username, password, env) {
  logger.debug(`检查凭据 - 用户名: ${username}, 有效用户名: ${env.VALID_USERNAME}`);
  
  // 开发模式下使用硬编码账号
  if (username === env.VALID_USERNAME && password === env.VALID_PASSWORD) {
    logger.info('使用环境变量验证通过');
    return true;
  }
  
  // 从KV获取用户信息
  logger.debug('尝试从KV获取用户信息');
  const userKey = `auth:${username}`;
  let userData;
  
  try {
    userData = await env.SYNC_KV.get(userKey, 'json');
    logger.debug('KV用户数据: ' + (userData ? '已找到' : '未找到'));
  } catch (kvErr) {
    logger.error('KV获取错误', kvErr);
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

// 验证令牌并返回用户名 - 优化JWT验证流程
export async function validateToken(token, env) {
  try {
    if (!token) {
      logger.debug('validateToken: 令牌为空');
      return null;
    }
    
    // 检查令牌是否被吊销（使用缓存）
    const revoked = await isTokenRevoked(token, env);
    if (revoked) {
      logger.debug('令牌已被吊销');
      return null;
    }
    
    logger.debug(`尝试验证令牌，使用密钥长度: ${env.JWT_SECRET?.length || '未知'}`);
    
    // 验证并解码JWT令牌（合并验证和解码操作）
    try {
      const decoded = await jwt.verify(token, env.JWT_SECRET, { complete: true });
      
      // 验证成功，解码的载荷已在decoded中
      logger.debug('JWT验证成功，载荷: ' + JSON.stringify(decoded.payload));
      
      // 检查令牌中的版本号与当前全局版本号
      const tokenVersion = decoded.payload.authVersion || '0';
      const globalVersion = await getGlobalAuthVersion(env);
      
      // 如果令牌版本低于全局版本，则拒绝访问
      if (parseInt(tokenVersion) < parseInt(globalVersion)) {
        logger.debug(`令牌版本 (${tokenVersion}) 低于全局版本 (${globalVersion}), 需要重新登录`);
        return null;
      }
      
      // 获取令牌中的密码hash值
      const tokenPasswordHash = decoded.payload.passwordHash;
      
      // 获取当前正确的密码hash
      const currentPasswordHash = simpleHash(env.VALID_PASSWORD);
      
      // 如果令牌中的密码hash与当前密码不匹配，则拒绝访问
      if (tokenPasswordHash !== currentPasswordHash) {
        logger.debug('密码已变更，需要重新登录');
        return null;
      }
      
      return decoded.payload.username;
    } catch (jwtErr) {
      logger.error('JWT验证失败', jwtErr);
      return null;
    }
  } catch (err) {
    logger.error('令牌验证错误', err);
    return null;
  }
}