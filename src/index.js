import jwt from '@tsndr/cloudflare-worker-jwt';
import { handleLogin, getAuthToken, validateToken } from './auth';
import { 
  listFiles, 
  handleFileUpload, 
  downloadFile, 
  syncFileStatus, 
  syncMessage, 
  getMessages,
  clearMessages // 新增导入这个函数
} from './files';
import { loginPageTemplate } from './templates/login';
import { appPageTemplate } from './templates/app';

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
    
    // All paths below require authentication
    const token = getAuthToken(request);
    if (!token) {
      return new Response('Unauthorized: Token missing', { status: 401 });
    }
    
    try {
      // Validate user
      const username = await validateToken(token, env);
      if (!username) {
        return new Response('Unauthorized: Invalid token', { status: 401 });
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
      
      if (path === '/api/files/sync' && request.method === 'POST') {
        return syncFileStatus(request, username, env);
      }
      
      if (path === '/api/files/changes') {
        const since = url.searchParams.get('since') || 0;
        return getFileChanges(since, username, env);
      }
      
      // New messaging endpoints
      if (path === '/api/messages' && request.method === 'GET') {
        return getMessages(username, env);
      }
      
      if (path === '/api/messages/sync' && request.method === 'POST') {
        return syncMessage(request, username, env);
      }
      
      // App main page
      if (path === '/app') {
        return new Response(appPageTemplate(username), {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' }
        });
      }
      
      // 新增清除消息端点
      if (path === '/api/messages/clear' && request.method === 'POST') {
        return clearMessages(username, env);
      }
      
      // 404 - Path not found
      return new Response('Not Found', { status: 404 });
    } catch (err) {
      return new Response(`Authentication error: ${err.message}`, { status: 401 });
    }
  }
};

// Get file changes (for polling sync)
async function getFileChanges(since, username, env) {
  since = parseInt(since);
  
  try {
    // Use list to get files with metadata
    const prefix = `file:${username}:`;
    const metaPrefix = `${prefix}.*:meta`;
    
    // Get all file metadata from KV
    const filesList = await env.SYNC_KV.list({ prefix: metaPrefix });
    
    const changes = [];
    const promises = filesList.keys.map(async (key) => {
      const metadata = await env.SYNC_KV.get(key.name, 'json');
      if (metadata) {
        // Convert lastModified to timestamp for comparison
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
      error: `Failed to get file changes: ${err.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}