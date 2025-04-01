import jwt from '@tsndr/cloudflare-worker-jwt';
import { handleLogin, getAuthToken, validateToken } from './auth';
import { listFiles, handleFileUpload, downloadFile, syncFileStatus } from './files';
import { loginPageTemplate } from './templates/login';
import { appPageTemplate } from './templates/app';

// Worker入口函数
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 路由配置
    // 登录页面
    if (path === '/' || path === '/login') {
      return new Response(loginPageTemplate(), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }
    
    // 处理登录请求
    if (path === '/api/login' && request.method === 'POST') {
      return handleLogin(request, env);
    }
    
    // 以下路径都需要认证
    const token = getAuthToken(request);
    if (!token) {
      return new Response('未授权: 缺少令牌', { status: 401 });
    }
    
    try {
      // 验证用户
      const username = await validateToken(token, env);
      if (!username) {
        return new Response('未授权: 无效令牌', { status: 401 });
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
      
      if (path === '/api/files/sync' && request.method === 'POST') {
        return syncFileStatus(request, username, env);
      }
      
      if (path === '/api/files/changes') {
        const since = url.searchParams.get('since') || 0;
        return getFileChanges(since, username, env);
      }
      
      // 应用主页
      if (path === '/app') {
        return new Response(appPageTemplate(username), {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' }
        });
      }
      
      // 404 - 未找到路径
      return new Response('未找到', { status: 404 });
    } catch (err) {
      return new Response(`认证错误: ${err.message}`, { status: 401 });
    }
  }
};

// 获取文件变更 (用于轮询同步)
async function getFileChanges(since, username, env) {
  since = parseInt(since);
  
  try {
    // 使用list获取含metadata的文件
    const prefix = `file:${username}:`;
    const metaPrefix = `${prefix}.*:meta`;
    
    // 从KV获取所有文件元数据
    const filesList = await env.SYNC_KV.list({ prefix: metaPrefix });
    
    const changes = [];
    const promises = filesList.keys.map(async (key) => {
      const metadata = await env.SYNC_KV.get(key.name, 'json');
      if (metadata) {
        // 转换lastModified为时间戳以便比较
        const modifiedTime = new Date(metadata.lastModified).getTime();
        if (modifiedTime > since) {
          changes.push(metadata);
        }
      }
    });
    
    await Promise.all(promises);
    
    return new Response(JSON.stringify({
      success: true,
      changes: changes
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: `获取文件变更失败: ${err.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
