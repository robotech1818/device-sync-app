export function appPageTemplate(username) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Device Sync App</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      :root {
        --primary-color: #0066ff;
        --secondary-color: #f0f2f5;
        --text-color: #333;
        --border-color: #ddd;
        --success-color: #4caf50;
        --danger-color: #f44336;
      }
      
      * {
        box-sizing: border-box;
      }
      
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        max-width: 1200px; 
        margin: 0 auto; 
        padding: 20px;
        color: var(--text-color);
        background-color: #fafafa;
      }
      
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        padding-bottom: 15px;
        border-bottom: 1px solid var(--border-color);
      }
      
      .header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
      }
      
      .user-info {
        display: flex;
        align-items: center;
        gap: 15px;
      }
      
      .container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }
      
      .panel { 
        background: white; 
        padding: 20px; 
        border-radius: 10px; 
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      }
      
      .panel-title {
        margin-top: 0;
        margin-bottom: 20px;
        font-size: 18px;
        font-weight: 600;
        color: #444;
        display: flex;
        align-items: center;
      }
      
      .panel-title svg {
        margin-right: 8px;
      }
      
      button { 
        padding: 8px 16px; 
        background: var(--primary-color); 
        color: white; 
        border: none; 
        border-radius: 6px; 
        cursor: pointer;
        font-weight: 500;
        transition: background 0.2s;
      }
      
      button:hover {
        background: #0052cc;
      }
      
      button.logout {
        background: var(--danger-color);
      }
      
      button.logout:hover {
        background: #d32f2f;
      }
      
      button.small-btn {
        padding: 4px 8px;
        font-size: 12px;
      }
      
      button.copy-btn {
        background: #6c757d;
      }
      
      button.copy-btn:hover {
        background: #5a6268;
      }
      
      button.delete-btn {
        background: var(--danger-color);
      }
      
      button.delete-btn:hover {
        background: #d32f2f;
      }
      
      .file-list {
        list-style: none;
        padding: 0;
        margin: 0;
        max-height: 400px;
        overflow-y: auto;
      }
      
      .file-item {
        background: var(--secondary-color);
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .file-info {
        flex: 1;
      }
      
      .file-name {
        margin: 0 0 5px 0;
        font-weight: 600;
        font-size: 16px;
      }
      
      .file-details {
        margin: 0;
        font-size: 14px;
        color: #666;
      }
      
      .file-actions {
        display: flex;
        gap: 10px;
      }
      
      .dropzone {
        border: 2px dashed var(--primary-color);
        border-radius: 8px;
        padding: 30px;
        text-align: center;
        margin-bottom: 20px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .dropzone:hover {
        background-color: rgba(0, 102, 255, 0.05);
      }
      
      .dropzone.highlight {
        border-color: var(--success-color);
        background-color: rgba(76, 175, 80, 0.05);
      }
      
      .dropzone p {
        margin: 0;
        color: #666;
      }
      
      input[type="file"] {
        display: none;
      }
      
      /* Messaging Panel Styles */
      .message-container {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      
      .message-list {
        list-style: none;
        padding: 0;
        margin: 0 0 15px 0;
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background: var(--secondary-color);
      }
      
      .message-item {
        padding: 10px 15px;
        margin: 8px;
        border-radius: 8px;
        max-width: 80%;
      }
      
      .message-item.self {
        background-color: #e3f2fd;
        align-self: flex-end;
        margin-left: auto;
      }
      
      .message-item.other {
        background-color: white;
        align-self: flex-start;
        margin-right: auto;
        border: 1px solid var(--border-color);
      }
      
      .message-header {
        font-size: 12px;
        color: #666;
        margin-bottom: 5px;
        display: flex;
        justify-content: space-between;
      }
      
      .message-content {
        word-break: break-word;
        margin-bottom: 5px;
      }
      
      .message-actions {
        display: flex;
        justify-content: flex-end;
        gap: 5px;
        margin-top: 5px;
      }
      
      .message-form {
        display: flex;
        gap: 10px;
      }
      
      .message-input {
        flex: 1;
        padding: 10px;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        font-size: 14px;
      }
      
      .message-input:focus {
        outline: none;
        border-color: var(--primary-color);
      }
      
      /* Toast Message */
      #toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 8px 16px;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        border-radius: 4px;
        z-index: 1001;
      }
      
      /* 确认对话框样式 */
      .confirm-dialog {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1002;
      }
      
      .confirm-dialog-content {
        background-color: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        width: 90%;
        max-width: 400px;
      }
      
      .confirm-dialog-title {
        margin-top: 0;
        margin-bottom: 15px;
        font-size: 18px;
        font-weight: 600;
      }
      
      .confirm-dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
      }
      
      /* Responsive */
      @media (max-width: 768px) {
        .container {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Device Sync App</h1>
      <div class="user-info">
        <span>Welcome, ${username}</span>
        <button class="logout" id="logoutBtn">Logout</button>
      </div>
    </div>
    
    <div class="container">
      <div class="panel">
        <h2 class="panel-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
          </svg>
          File Upload
        </h2>
        <div id="dropzone" class="dropzone">
          <p>Drag and drop files here or click to upload</p>
          <input type="file" id="fileInput">
        </div>
      </div>
      
      <div class="panel">
        <h2 class="panel-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          Messages
        </h2>
        <div class="message-container">
          <ul id="messageList" class="message-list">
            <li class="message-item self">
              <div class="message-header">
                <span>You (This Device)</span>
                <span>Just now</span>
              </div>
              <div class="message-content">Welcome to the messaging feature!</div>
            </li>
          </ul>
          <form id="messageForm" class="message-form">
            <input type="text" id="messageInput" class="message-input" placeholder="Type your message here...">
            <button type="submit">Send</button>
          </form>
          <div style="margin-top: 10px; text-align: right;">
            <button id="clearMessagesBtn" style="background: #999;">Clear Messages</button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="panel">
      <h2 class="panel-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        Your Files (Recent 10)
      </h2>
      <ul id="fileList" class="file-list">
        <li class="file-item">
          <div class="file-info">
            <h3 class="file-name">Loading...</h3>
          </div>
        </li>
      </ul>
    </div>
    
    <script>
      // Get token from multiple sources
      function getToken() {
        // 1. Try to get from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        let token = urlParams.get('token');
        
        // 2. If no token in URL, try localStorage
        if (!token) {
          token = localStorage.getItem('authToken');
        }
        
        // 3. If no token in localStorage, try cookies
        if (!token) {
          const cookies = document.cookie.split(';');
          for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'authToken') {
              token = value;
              break;
            }
          }
        }
        
        // If token found, ensure it's stored in all locations
        if (token) {
          localStorage.setItem('authToken', token);
          if (!document.cookie.includes('authToken=')) {
            document.cookie = "authToken=" + token + "; path=/; max-age=86400; SameSite=Strict";
          }
          
          // Remove token from URL (optional)
          if (urlParams.has('token') && history.pushState) {
            const newUrl = window.location.pathname;
            window.history.pushState({path: newUrl}, '', newUrl);
          }
        }
        
        return token;
      }
      
      // Get current token
      const token = getToken();
      console.log('Current token status:', !!token);
      
      if (!token) {
        console.error('Authentication token not found, redirecting to login');
        window.location.href = '/login';
      }
      
      // Authenticated fetch function
      async function authenticatedFetch(url, options = {}) {
        // Get latest token for each request
        const currentToken = getToken();
        
        if (!currentToken) {
          console.error('Token not found during request, redirecting to login');
          window.location.href = '/login';
          throw new Error('Unauthorized');
        }
        
        const headers = options.headers || {};
        headers['Authorization'] = \`Bearer \${currentToken}\`;
        
        return fetch(url, { ...options, headers });
      }
      
      // Get file list
      async function loadFiles() {
        try {
          console.log('正在获取文件列表...');
          
          // 清除缓存的时间戳以确保获取最新数据
          // 避免浏览器缓存导致的问题
          const timestamp = new Date().getTime();
          const response = await authenticatedFetch(\`/api/files/list?_=\${timestamp}\`);
          
          if (!response.ok) {
            console.error(\`文件列表请求失败，状态码: \${response.status}\`);
            throw new Error(\`Server responded with \${response.status}\`);
          }
          
          let data;
          try {
            const text = await response.text();
            console.log('API返回原始数据:', text);
            data = JSON.parse(text);
          } catch (parseError) {
            console.error('解析JSON响应失败:', parseError);
            throw parseError;
          }
          
          console.log('解析后的文件列表数据:', data);
          
          const fileListEl = document.getElementById('fileList');
          if (!fileListEl) {
            console.error('找不到fileList元素');
            return;
          }
          
          // 清空现有列表
          fileListEl.innerHTML = '';
          
          if (!data.success) {
            console.error('API返回失败:', data.error);
            fileListEl.innerHTML = \`<li class="file-item"><div class="file-info"><h3 class="file-name">Error: \${data.error || 'Unknown error'}</h3></div></li>\`;
            return;
          }
          
          if (!data.files || !Array.isArray(data.files) || data.files.length === 0) {
            console.log('没有找到文件');
            fileListEl.innerHTML = '<li class="file-item"><div class="file-info"><h3 class="file-name">No files found</h3></div></li>';
            return;
          }
          
          console.log(\`找到 \${data.files.length} 个文件，开始渲染\`);
          
          // 按最近修改时间排序
          data.files.sort((a, b) => {
            return new Date(b.lastModified) - new Date(a.lastModified);
          });
          
          // 只显示最近的10个文件
          const recentFiles = data.files.slice(0, 10);
          
          // 渲染每个文件
          recentFiles.forEach((file, index) => {
            console.log(\`渲染文件 \${index+1}/\${recentFiles.length}: \${file.name}\`);
            
            const li = document.createElement('li');
            li.className = 'file-item';
            li.dataset.fileId = file.id;
            
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            
            const fileName = document.createElement('h3');
            fileName.className = 'file-name';
            fileName.textContent = file.name || 'Unnamed File';
            
            const fileDetails = document.createElement('p');
            fileDetails.className = 'file-details';
            fileDetails.textContent = \`Type: \${file.type || 'unknown'} | Size: \${formatFileSize(file.size || 0)} | Modified: \${formatDate(file.lastModified || new Date())}\`;
            
            fileInfo.appendChild(fileName);
            fileInfo.appendChild(fileDetails);
            
            const fileActions = document.createElement('div');
            fileActions.className = 'file-actions';
            
            const downloadBtn = document.createElement('button');
            downloadBtn.textContent = 'Download';
            downloadBtn.addEventListener('click', () => downloadFile(file.id));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'delete-btn';
            deleteBtn.addEventListener('click', () => showDeleteFileConfirm(file.id, file.name));
            
            fileActions.appendChild(downloadBtn);
            fileActions.appendChild(deleteBtn);
            
            li.appendChild(fileInfo);
            li.appendChild(fileActions);
            
            fileListEl.appendChild(li);
          });
          
          // 更新上次同步时间
          localStorage.setItem('lastSyncTime', Date.now());
          console.log('文件列表加载完成');
        } catch (err) {
          console.error('加载文件列表错误:', err);
          const fileListEl = document.getElementById('fileList');
          if (fileListEl) {
            fileListEl.innerHTML = \`<li class="file-item"><div class="file-info"><h3 class="file-name">Error loading files: \${err.message}</h3></div></li>\`;
          }
        }
      }
      
      // 显示删除文件确认对话框
      function showDeleteFileConfirm(fileId, fileName) {
        showConfirmDialog(
          'Delete File', 
          \`Are you sure you want to delete "\${fileName}"? This action cannot be undone.\`, 
          () => deleteFile(fileId)
        );
      }
      
      // 删除文件
      async function deleteFile(fileId) {
        try {
          const response = await authenticatedFetch(\`/api/files/delete/\${fileId}\`, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            console.error(\`删除文件失败，状态码: \${response.status}\`);
            showToast(\`Failed to delete file: \${response.status}\`);
            return;
          }
          
          const data = await response.json();
          
          if (data.success) {
            // 从DOM中移除文件项
            const fileItem = document.querySelector(\`li[data-file-id="\${fileId}"]\`);
            if (fileItem) {
              fileItem.remove();
            }
            
            showToast('File deleted successfully');
            
            // 重新加载文件列表
            setTimeout(() => {
              loadFiles();
            }, 500);
          } else {
            console.error('删除文件失败:', data.error);
            showToast(\`Failed to delete file: \${data.error || 'Unknown error'}\`);
          }
        } catch (err) {
          console.error('删除文件错误:', err);
          showToast(\`Error deleting file: \${err.message}\`);
        }
      }
      
      // Download file
      function downloadFile(fileId) {
        window.open(\`/api/files/download/\${fileId}?token=\${token}\`);
      }
      
      // Upload file
      async function uploadFile(file) {
        try {
          console.log('开始上传文件:', file.name, '大小:', file.size, '类型:', file.type);
          
          // 显示上传中提示
          const dropzone = document.getElementById('dropzone');
          const originalText = dropzone.innerHTML;
          dropzone.innerHTML = '<p>Uploading... Please wait</p>';
          
          const formData = new FormData();
          formData.append('file', file);
          
          // 使用authenticatedFetch函数
          const response = await authenticatedFetch('/api/files/upload', {
            method: 'POST',
            body: formData
          });
          
          // 恢复原始提示
          dropzone.innerHTML = originalText;
          
          // 检查响应状态
          if (!response.ok) {
            console.error(\`上传失败，状态码: \${response.status}\`);
            alert(\`Upload failed with status: \${response.status}\`);
            return;
          }
          
          let data;
          try {
            const text = await response.text();
            console.log('上传API返回原始数据:', text);
            data = JSON.parse(text);
          } catch (parseError) {
            console.error('解析JSON响应失败:', parseError);
            alert('Error parsing server response');
            return;
          }
          
          console.log('解析后的上传响应:', data);
          
          if (data.success) {
            console.log('文件上传成功:', data.fileId);
            
            // 显示成功通知
            showToast('File uploaded successfully!');
            
            // 确保等待一小段时间后再重新加载文件列表
            // 这有助于确保服务器有足够时间处理文件
            console.log('延迟1秒后刷新文件列表...');
            setTimeout(() => {
              console.log('开始刷新文件列表');
              loadFiles().then(() => {
                console.log('文件列表刷新完成');
              }).catch(err => {
                console.error('刷新文件列表失败:', err);
              });
            }, 1000);
          } else {
            console.error('上传失败:', data.error);
            alert(\`Upload failed: \${data.error || 'Unknown error'}\`);
          }
        } catch (err) {
          console.error('上传文件错误:', err);
          alert(\`Error during upload: \${err.message}\`);
          
          // 恢复原始提示
          const dropzone = document.getElementById('dropzone');
          dropzone.innerHTML = '<p>Drag and drop files here or click to upload</p><input type="file" id="fileInput">';
          
          // 重新初始化文件输入框
          const fileInput = document.getElementById('fileInput');
          if (fileInput) {
            fileInput.addEventListener('change', () => {
              if (fileInput.files.length > 0) {
                uploadFile(fileInput.files[0]);
              }
            });
          }
        }
      }
      
      // Format file size
      function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
      }
      
      // Format date
      function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
      }
      
      // 重新初始化拖放区域
      function reinitializeDropzone() {
        console.log('重新初始化拖放区域');
        const dropzone = document.getElementById('dropzone');
        const fileInput = document.getElementById('fileInput');
        
        if (!dropzone || !fileInput) {
          console.error('找不到dropzone或fileInput元素');
          return;
        }
        
        // 移除所有现有事件监听器
        const newDropzone = dropzone.cloneNode(true);
        dropzone.parentNode.replaceChild(newDropzone, dropzone);
        
        const newFileInput = document.createElement('input');
        newFileInput.type = 'file';
        newFileInput.id = 'fileInput';
        newFileInput.style.display = 'none';
        
        // 确保dropzone内容正确
        newDropzone.innerHTML = '<p>Drag and drop files here or click to upload</p>';
        newDropzone.appendChild(newFileInput);
        
        // 点击上传
        newDropzone.addEventListener('click', () => {
          newFileInput.click();
        });
        
        newFileInput.addEventListener('change', () => {
          if (newFileInput.files.length > 0) {
            uploadFile(newFileInput.files[0]);
          }
        });
        
        // 拖放上传
        newDropzone.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.stopPropagation();
          newDropzone.classList.add('highlight');
        });
        
        newDropzone.addEventListener('dragleave', (e) => {
          e.preventDefault();
          e.stopPropagation();
          newDropzone.classList.remove('highlight');
        });
        
        newDropzone.addEventListener('drop', (e) => {
          e.preventDefault();
          e.stopPropagation();
          newDropzone.classList.remove('highlight');
          
          if (e.dataTransfer.files.length > 0) {
            uploadFile(e.dataTransfer.files[0]);
          }
        });
        
        console.log('拖放区域重新初始化完成');
      }
      
      // Messages management
      const MAX_MESSAGES = 50; // Maximum number of messages to store
      
      // 初始化消息功能
      async function initMessaging() {
        const messageForm = document.getElementById('messageForm');
        const messageInput = document.getElementById('messageInput');
        const messageList = document.getElementById('messageList');
        const clearMessagesBtn = document.getElementById('clearMessagesBtn');
        
        // 首先加载本地消息
        const localMessages = JSON.parse(localStorage.getItem('syncMessages') || '[]');
        
        // 从服务器获取消息并合并
        await loadAndMergeServerMessages(localMessages);
        
        // 发送消息事件处理
        messageForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const messageText = messageInput.value.trim();
          if (messageText) {
            sendMessage(messageText);
            messageInput.value = '';
          }
        });
        
        // 清除消息事件处理
        clearMessagesBtn.addEventListener('click', async () => {
          if (confirm('Are you sure you want to clear all messages?')) {
            localStorage.removeItem('syncMessages');
            try {
              // 也清除服务器上的消息
              await authenticatedFetch('/api/messages/clear', {
                method: 'POST'
              });
            } catch (err) {
              console.error('清除服务器消息失败:', err);
            }
            renderMessages([]);
          }
        });
      }
      
      // 从服务器加载消息并与本地消息合并
      async function loadAndMergeServerMessages(localMessages) {
        try {
          const response = await authenticatedFetch('/api/messages');
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.messages) {
              // 合并本地和服务器消息，避免重复
              const serverMessages = data.messages;
              const allMessages = [...localMessages];
              
              // 添加服务器上有但本地没有的消息
              serverMessages.forEach(serverMsg => {
                if (!allMessages.some(localMsg => localMsg.id === serverMsg.id)) {
                  allMessages.push(serverMsg);
                }
              });
              
              // 按时间排序
              allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
              
              // 保存合并后的消息
              localStorage.setItem('syncMessages', JSON.stringify(allMessages));
              renderMessages(allMessages);
            } else {
              renderMessages(localMessages);
            }
          } else {
            renderMessages(localMessages);
          }
        } catch (err) {
          console.error('加载服务器消息失败:', err);
          renderMessages(localMessages);
        }
      }
      
      // 发送新消息
      async function sendMessage(text) {
        const deviceId = getDeviceId();
        const message = {
          id: Date.now() + Math.random().toString(36).substring(2, 9),
          deviceId: deviceId,
          text: text,
          timestamp: new Date().toISOString()
        };
        
        // 添加到localStorage
        const messages = JSON.parse(localStorage.getItem('syncMessages') || '[]');
        messages.push(message);
        
        // 限制消息数量
        if (messages.length > MAX_MESSAGES) {
          messages.splice(0, messages.length - MAX_MESSAGES);
        }
        
        localStorage.setItem('syncMessages', JSON.stringify(messages));
        
        // 更新UI
        renderMessages(messages);
        
        // 同步到服务器
        await syncMessageToServer(message);
      }
      
      // 同步消息到服务器
      async function syncMessageToServer(message) {
        try {
          const response = await authenticatedFetch('/api/messages/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: message,
              deviceId: getDeviceId()
            })
          });
          
          if (!response.ok) {
            console.error('消息同步失败:', await response.text());
          } else {
            console.log('消息成功同步到服务器');
          }
        } catch (err) {
          console.error('消息同步错误:', err);
        }
      }
      
      // 在 app.js 文件中修改 deleteMessage 函数
      async function deleteMessage(messageId) {
        try {
          // 从本地存储中删除
          const messages = JSON.parse(localStorage.getItem('syncMessages') || '[]');
          const updatedMessages = messages.filter(msg => msg.id !== messageId);
          localStorage.setItem('syncMessages', JSON.stringify(updatedMessages));
          
          // 从服务器删除 - 修复正则表达式错误
          const response = await authenticatedFetch("/api/messages/delete/" + messageId, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            console.error(`Message deletion failed, status code: ${response.status}`);
          }
          
          // 更新UI
          renderMessages(updatedMessages);
          showToast('Message deleted');
        } catch (err) {
          console.error('删除消息错误:', err);
          showToast(`Error deleting message: ${err.message}`);
        }
      }
      
      // 渲染消息 UI
      function renderMessages(messages) {
        const deviceId = getDeviceId();
        const messageList = document.getElementById('messageList');
        messageList.innerHTML = '';
        
        if (messages.length === 0) {
          const emptyItem = document.createElement('li');
          emptyItem.className = 'message-item other';
          emptyItem.innerHTML = `
            <div class="message-header">
              <span>System</span>
              <span>${formatDate(new Date().toISOString())}</span>
            </div>
            <div class="message-content">No messages yet. Start the conversation!</div>
          `;
          messageList.appendChild(emptyItem);
          return;
        }
        
        messages.forEach(msg => {
          const messageItem = document.createElement('li');
          const isSelf = msg.deviceId === deviceId;
          
          messageItem.className = `message-item ${isSelf ? 'self' : 'other'}`;
          messageItem.dataset.messageId = msg.id; // 将消息ID存储在数据属性中
          
          messageItem.innerHTML = `
            <div class="message-header">
              <span>${isSelf ? 'You (This Device)' : 'Device ' + msg.deviceId.substring(0, 8)}</span>
              <span>${formatDate(msg.timestamp)}</span>
            </div>
            <div class="message-content">${escapeHTML(msg.text)}</div>
            <div class="message-actions">
              <button class="small-btn copy-btn">Copy</button>
              <button class="small-btn delete-btn">Delete</button>
            </div>
          `;
          
          // 添加复制按钮事件
          const copyBtn = messageItem.querySelector('.copy-btn');
          copyBtn.addEventListener('click', function() {
            copyToClipboard(msg.text);
          });
          
          // 添加删除按钮事件
          const deleteBtn = messageItem.querySelector('.delete-btn');
          deleteBtn.addEventListener('click', function() {
            showDeleteMessageConfirm(msg.id);
          });
          
          messageList.appendChild(messageItem);
        });
        
        // 滚动到底部
        messageList.scrollTop = messageList.scrollHeight;
      }
      
      // 显示删除消息确认对话框
      function showDeleteMessageConfirm(messageId) {
        showConfirmDialog(
          'Delete Message', 
          'Are you sure you want to delete this message? This action cannot be undone.', 
          () => deleteMessage(messageId)
        );
      }
      
      // 显示确认对话框
      function showConfirmDialog(title, message, confirmCallback) {
        // 删除任何现有的确认对话框
        const existingDialog = document.getElementById('confirm-dialog');
        if (existingDialog) {
          existingDialog.remove();
        }
        
        // 创建确认对话框
        const dialog = document.createElement('div');
        dialog.id = 'confirm-dialog';
        dialog.className = 'confirm-dialog';
        
        const dialogContent = document.createElement('div');
        dialogContent.className = 'confirm-dialog-content';
        
        const dialogTitle = document.createElement('h3');
        dialogTitle.className = 'confirm-dialog-title';
        dialogTitle.textContent = title;
        
        const dialogMessage = document.createElement('p');
        dialogMessage.textContent = message;
        
        const dialogActions = document.createElement('div');
        dialogActions.className = 'confirm-dialog-actions';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.background = '#999';
        cancelBtn.addEventListener('click', () => dialog.remove());
        
        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'Confirm';
        confirmBtn.className = 'delete-btn';
        confirmBtn.addEventListener('click', () => {
          confirmCallback();
          dialog.remove();
        });
        
        dialogActions.appendChild(cancelBtn);
        dialogActions.appendChild(confirmBtn);
        
        dialogContent.appendChild(dialogTitle);
        dialogContent.appendChild(dialogMessage);
        dialogContent.appendChild(dialogActions);
        
        dialog.appendChild(dialogContent);
        document.body.appendChild(dialog);
      }
      
      // 复制到剪贴板
      function copyToClipboard(text) {
        // 方法1：使用Clipboard API（现代浏览器）
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text)
            .then(() => {
              showToast('Copied to clipboard!');
            })
            .catch(err => {
              console.error('Clipboard API失败:', err);
              // 失败时尝试备用方法
              fallbackCopyToClipboard(text);
            });
        } else {
          // 方法2：回退到传统方法
          fallbackCopyToClipboard(text);
        }
      }

      // 传统的复制方法
      function fallbackCopyToClipboard(text) {
        try {
          // 创建一个临时textarea元素
          const textArea = document.createElement('textarea');
          textArea.value = text;
          
          // 设置样式使其不可见
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          
          // 选择文本并复制
          textArea.focus();
          textArea.select();
          
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          
          if (successful) {
            showToast('Copied to clipboard!');
          } else {
            showToast('Failed to copy text');
          }
        } catch (err) {
          console.error('传统复制方法失败:', err);
          showToast('Failed to copy text');
        }
      }
      
      // 显示提示信息
      function showToast(message) {
        // 删除现有的提示
        const existingToast = document.getElementById('toast');
        if (existingToast) {
          existingToast.remove();
        }
        
        // 创建新提示
        const toast = document.createElement('div');
        toast.id = 'toast';
        toast.textContent = message;
        
        // 添加到文档
        document.body.appendChild(toast);
        
        // 3秒后自动消失
        setTimeout(() => {
          toast.remove();
        }, 3000);
      }
      
      // Escape HTML to prevent XSS
      function escapeHTML(text) {
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }
      
      // Poll for file changes
      function pollForChanges() {
        // Check for changes every 5 seconds
        setInterval(async () => {
          try {
            // Get last sync time
            const lastSync = localStorage.getItem('lastSyncTime') || 0;
            
            // Request file changes
            const response = await authenticatedFetch('/api/files/changes?since=' + lastSync);
            
            if (response.status === 401) {
              console.error('Token expired, redirecting to login');
              localStorage.removeItem('authToken');
              window.location.href = '/login';
              return;
            }
            
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.changes && data.changes.length > 0) {
                // New changes, reload file list
                loadFiles();
              }
            }
          } catch (error) {
            console.error('Sync error:', error);
          }
        }, 5000);
      }
      
      // Get device ID
      function getDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
          deviceId = 'device-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10);
          localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
      }
      
      // Logout
      document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('authToken');
        document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        window.location.href = '/login';
      });
      
      // Initialize on page load
      window.addEventListener('load', () => {
        console.log('页面加载，开始初始化...');
        
        // 先加载文件列表
        loadFiles().then(() => {
          console.log('文件列表初始加载完成');
        }).catch(err => {
          console.error('初始文件列表加载失败:', err);
        });
        
        // 初始化拖放区域
        reinitializeDropzone();
        
        // 初始化消息功能
        initMessaging().then(() => {
          console.log('消息功能初始化完成');
        }).catch(err => {
          console.error('消息功能初始化失败:', err);
        });
        
        // 开始轮询变更
        pollForChanges();
        
        // 显示设备ID
        console.log('当前设备ID:', getDeviceId());
      });
    </script>
  </body>
  </html>
  `;
}