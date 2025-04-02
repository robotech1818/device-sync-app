import jwt from '@tsndr/cloudflare-worker-jwt';
import { 
  handleLogin, 
  getAuthToken, 
  validateToken, 
  handleLogout, 
  handleRefreshToken, 
  handleForceRelogin 
} from './auth';
import { 
  listFiles, 
  handleFileUpload, 
  downloadFile, 
  syncFileStatus, 
  syncMessage, 
  getMessages,
  clearMessages,
  deleteFile,
  deleteMessage
} from './files';
import { loginPageTemplate } from './templates/login';
import { appPageTemplate } from './templates/app';

// 静态页面缓存
const staticCache = {
  loginPage: null,
  loginPageTime: 0,
  appPages: new Map(), // 用户名 -> {content, timestamp}
};

// 缓存有效期(10分钟)
const CACHE_TTL = 10 * 60 * 1000;

// Worker入口函数
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 登录页面 - 使用缓存
    if (path === '/' || path === '/login') {
      const now = Date.now();
      
      // 如果缓存不存在或已过期，重新生成
      if (!staticCache.loginPage || (now - staticCache.loginPageTime > CACHE_TTL)) {
        staticCache.loginPage = new Response(loginPageTemplate(), {
          headers: { 
            'Content-Type': 'text/html;charset=UTF-8',
            'Cache-Control': 'private, max-age=600' // 浏览器端缓存10分钟
          }
        });
        staticCache.loginPageTime = now;
      }
      
      return staticCache.loginPage;
    }
    
    // 处理登录请求
    if (path === '/api/login' && request.method === 'POST') {
      return handleLogin(request, env);
    }
    
    // 处理注销请求
    if (path === '/api/logout' && request.method === 'POST') {
      return handleLogout(request, env);
    }
    
    // 处理令牌刷新请求
    if (path === '/api/refresh-token' && request.method === 'POST') {
      return handleRefreshToken(request, env);
    }
    
    // 处理强制重新登录 (仅管理员)
    if (path === '/api/admin/force-relogin' && request.method === 'POST') {
      return handleForceRelogin(request, env);
    }
    
    // 以下路径需要认证
    const token = getAuthToken(request);
    if (!token) {
      return new Response('Unauthorized: Token missing', { status: 401 });
    }
    
    try {
      // 验证用户
      const username = await validateToken(token, env);
      if (!username) {
        return new Response('Unauthorized: Invalid token', { status: 401 });
      }
      
      // 路由API请求
      if (path === '/api/files/list') {
        return listFiles(username, env);
      }
      
      if (path === '/api/files/upload' && request.method === 'POST') {
        return handleFileUpload(request, username, env);
      }
      
      if (path.startsWith('/api/files/download/')) {
        const fileId = path.split('/').pop();
        return downloadFile(fileId, username, env);
      }
      
      if (path.startsWith('/api/files/delete/') && request.method === 'DELETE') {
        const fileId = path.split('/').pop();
        return deleteFile(fileId, username, env);
      }
      
      if (path === '/api/files/sync' && request.method === 'POST') {
        return syncFileStatus(request, username, env);
      }
      
      if (path === '/api/files/changes') {
        const since = url.searchParams.get('since') || 0;
        return getFileChanges(since, username, env);
      }
      
      // 消息管理端点
      if (path === '/api/messages' && request.method === 'GET') {
        return getMessages(username, env);
      }
      
      if (path === '/api/messages/sync' && request.method === 'POST') {
        return syncMessage(request, username, env);
      }
      
      if (path.startsWith('/api/messages/delete/') && request.method === 'DELETE') {
        const messageId = path.split('/').pop();
        return deleteMessage(messageId, username, env);
      }
      
      if (path === '/api/messages/clear' && request.method === 'POST') {
        return clearMessages(username, env);
      }
      
      // 应用主页 - 使用缓存
      if (path === '/app') {
        const now = Date.now();
        
        const cachedPage = staticCache.appPages.get(username);
        
        // 如果缓存不存在或已过期，重新生成
        if (!cachedPage || (now - cachedPage.timestamp > CACHE_TTL)) {
          const pageContent = new Response(appPageTemplate(username), {
            headers: { 
              'Content-Type': 'text/html;charset=UTF-8',
              'Cache-Control': 'private, max-age=600' // 浏览器端缓存10分钟
            }
          });
          
          staticCache.appPages.set(username, {
            content: pageContent,
            timestamp: now
          });
          
          return pageContent;
        }
        
        return cachedPage.content;
      }
      
// 404 - 路径未找到
      return new Response('Not Found', { status: 404 });
    } catch (err) {
      return new Response(`Authentication error: ${err.message}`, { status: 401 });
    }
  }
};

// 获取文件变更（用于轮询同步） - 优化实现
async function getFileChanges(since, username, env) {
  since = parseInt(since);
  
  try {
    // 首先尝试从文件索引获取数据
    const indexKey = `fileindex:${username}`;
    const fileIndex = await env.SYNC_KV.get(indexKey, 'json') || [];
    
    // 在 JavaScript 中过滤出修改过的文件
    const changes = fileIndex.filter(file => {
      const modifiedTime = new Date(file.lastModified).getTime();
      return modifiedTime > since;
    });
    
    return new Response(JSON.stringify({
      success: true,
      changes: changes
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=60' // 缓存1分钟
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: `Failed to get file changes: ${err.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}