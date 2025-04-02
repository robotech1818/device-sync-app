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

// 简单的日志工具
const logger = {
  debug: (msg) => console.log(`[DEBUG] ${msg}`),
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg, err) => {
    console.error(`[ERROR] ${msg}`);
    if (err) console.error(err);
  }
};

// Worker entry function
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Route configuration
    // Login page
    if (path === '/' || path === '/login') {
      return new Response(loginPageTemplate(), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }
    
    // Handle login request
    if (path === '/api/login' && request.method === 'POST') {
      return handleLogin(request, env);
    }
    
    // Handle logout request
    if (path === '/api/logout' && request.method === 'POST') {
      return handleLogout(request, env);
    }
    
    // Handle token refresh request
    if (path === '/api/refresh-token' && request.method === 'POST') {
      return handleRefreshToken(request, env);
    }
    
    // Handle force relogin (admin only)
    if (path === '/api/admin/force-relogin' && request.method === 'POST') {
      return handleForceRelogin(request, env);
    }
    
    // 所有下面的路径都需要身份验证
    const token = getAuthToken(request);
    if (!token) {
      // 优化: 不显示错误消息，而是重定向到登录页面
      return new Response('', {
        status: 302,
        headers: {
          'Location': '/login',
          'Set-Cookie': 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
      });
    }
    
    try {
      // 验证用户
      const username = await validateToken(token, env);
      if (!username) {
        // 优化: 如果令牌无效，也重定向到登录页面
        return new Response('', {
          status: 302,
          headers: {
            'Location': '/login',
            'Set-Cookie': 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          }
        });
      }
      
      // Route API requests
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
      
      // 删除文件路由
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
      
      // 删除消息路由
      if (path.startsWith('/api/messages/delete/') && request.method === 'DELETE') {
        const messageId = path.split('/').pop();
        return deleteMessage(messageId, username, env);
      }
      
      // 清除所有消息端点
      if (path === '/api/messages/clear' && request.method === 'POST') {
        return clearMessages(username, env);
      }
      
      // App main page
      if (path === '/app') {
        return new Response(appPageTemplate(username), {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' }
        });
      }
      
      // 404 - Path not found - 优化返回格式化的JSON
      return new Response(JSON.stringify({
        success: false,
        error: 'Not Found',
        path: path
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      // 优化: 任何身份验证错误也应重定向到登录页面
      logger.error('认证错误', err);
      return new Response('', {
        status: 302,
        headers: {
          'Location': '/login',
          'Set-Cookie': 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
      });
    }
  }
};

// 获取文件变更 - 修复版本
async function getFileChanges(since, username, env) {
  since = parseInt(since);
  
  try {
    console.log(`获取用户 ${username} 的文件变更，since: ${since}`);
    
    // 获取所有文件元数据
    const prefix = `file:${username}:`;
    const metaSuffix = ':meta';
    
    // 获取所有以此前缀开头的键
    const files = await env.SYNC_KV.list({ prefix });
    
    console.log(`KV查询返回的键数量: ${files.keys.length}`);
    
    // 筛选出元数据键（以:meta结尾）
    const metaKeys = files.keys.filter(key => key.name.endsWith(metaSuffix));
    console.log(`找到的元数据键数量: ${metaKeys.length}`);
    
    const changes = [];
    
    // 逐个处理元数据，不使用批量处理以避免错误
    for (const key of metaKeys) {
      try {
        const metadata = await env.SYNC_KV.get(key.name, 'json');
        if (metadata) {
          // 转换最后修改时间为时间戳，用于比较
          const modifiedTime = new Date(metadata.lastModified).getTime();
          if (modifiedTime > since) {
            changes.push(metadata);
          }
        }
      } catch (metaErr) {
        console.error(`获取元数据错误 ${key.name}:`, metaErr.message);
        // 继续处理下一个文件，不中断
      }
    }
    
    console.log(`找到 ${changes.length} 个变更的文件`);
    
    return new Response(JSON.stringify({
      success: true,
      changes: changes
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error(`获取文件变更错误: ${err.message}`);
    console.error(err.stack);
    return new Response(JSON.stringify({
      success: false,
      error: `Failed to get file changes: ${err.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}