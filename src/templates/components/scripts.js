export function scriptsComponent() {
  return `
  <script>
    // 令牌刷新机制
    function setupTokenRefresh() {
      // 令牌刷新周期 (每小时刷新一次，适用于4小时有效期的令牌)
      const refreshInterval = 60 * 60 * 1000; // 1小时，单位：毫秒
      
      // 设置定时刷新
      setInterval(async () => {
        try {
          console.log('尝试刷新认证令牌...');
          
          // 获取当前令牌
          const currentToken = getToken();
          if (!currentToken) {
            console.log('无令牌可刷新，跳过');
            return;
          }
          
          // 调用刷新令牌API
          const response = await authenticatedFetch('/api/refresh-token', {
            method: 'POST'
          });
          
          if (!response.ok) {
            console.error('令牌刷新失败:', response.status);
            
            // 如果刷新失败且状态码为401，则可能是令牌已失效，重定向到登录页
            if (response.status === 401) {
              console.log('令牌已失效，重定向到登录页');
              logout();
            }
            return;
          }
          
          const data = await response.json();
          if (data.success && data.token) {
            // 更新存储的令牌
            localStorage.setItem('authToken', data.token);
            document.cookie = \`authToken=\${data.token}; path=/; max-age=\${data.expiresIn}; SameSite=Strict\`;
            console.log('令牌已成功刷新');
          } else {
            console.error('令牌刷新返回无效数据');
          }
        } catch (err) {
          console.error('令牌刷新过程中发生错误:', err);
        }
      }, refreshInterval);
      
      console.log('令牌自动刷新已设置，间隔:', refreshInterval, 'ms');
    }

    // 统一的登出函数
    async function logout() {
      try {
        // 如果有令牌，尝试调用服务端注销
        const token = getToken();
        if (token) {
          try {
            await authenticatedFetch('/api/logout', {
              method: 'POST'
            });
            console.log('服务端注销成功');
          } catch (err) {
            console.error('服务端注销失败:', err);
          }
        }
      } catch (err) {
        console.error('注销过程中发生错误:', err);
      } finally {
        // 无论服务端注销是否成功，都清除本地存储
        localStorage.removeItem('authToken');
        document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        
        // 重定向到登录页
        window.location.href = '/login';
      }
    }
    
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
      try {
        // Get latest token for each request
        const currentToken = getToken();
        
        if (!currentToken) {
          console.error('Token not found during request, redirecting to login');
          logout();
          throw new Error('Unauthorized');
        }
        
        const headers = options.headers || {};
        headers['Authorization'] = "Bearer " + currentToken;
        
        const response = await fetch(url, { ...options, headers });
        
        // 检查是否因为认证问题而失败
        if (response.status === 401) {
          console.error('请求返回401未授权，可能是令牌已过期或无效');
          
          // 尝试刷新令牌一次
          try {
            const refreshResponse = await fetch('/api/refresh-token', {
              method: 'POST',
              headers: { 'Authorization': "Bearer " + currentToken }
            });
            
            if (refreshResponse.ok) {
              const data = await refreshResponse.json();
              if (data.success && data.token) {
                // 更新令牌
                localStorage.setItem('authToken', data.token);
                document.cookie = \`authToken=\${data.token}; path=/; max-age=\${data.expiresIn}; SameSite=Strict\`;
                console.log('令牌已刷新，重试请求');
                
                // 使用新令牌重试原始请求
                const newHeaders = { ...headers };
                newHeaders['Authorization'] = "Bearer " + data.token;
                return fetch(url, { ...options, headers: newHeaders });
              }
            }
            
            // 刷新失败，登出
            console.error('令牌刷新失败，将登出');
            logout();
            throw new Error('Unauthorized: Token refresh failed');
          } catch (refreshErr) {
            console.error('令牌刷新过程中发生错误:', refreshErr);
            logout();
            throw new Error('Unauthorized: Error during token refresh');
          }
        }
        
        return response;
      } catch (err) {
        console.error('authenticated fetch error:', err);
        throw err;
      }
    }
    
    // Get file list
    async function loadFiles() {
      try {
        console.log('Loading file list...');
        
        // 使用缓存破坏参数防止浏览器缓存
        const timestamp = new Date().getTime();
        const response = await authenticatedFetch("/api/files/list?_=" + timestamp);
        
        if (!response.ok) {
          console.error("File list request failed, status code: " + response.status);
          throw new Error("Server responded with " + response.status);
        }
        
        let data;
        try {
          const text = await response.text();
          console.log('API raw response:', text);
          data = JSON.parse(text);
        } catch (parseError) {
          console.error('JSON parsing failed:', parseError);
          throw parseError;
        }
        
        console.log('Parsed file list data:', data);
        
        const fileListEl = document.getElementById('fileList');
        if (!fileListEl) {
          console.error('fileList element not found');
          return;
        }
        
        // Clear existing list
        fileListEl.innerHTML = '';
        
        if (!data.success) {
          console.error('API returned error:', data.error);
          fileListEl.innerHTML = '<li className="file-item"><div className="file-info"><h3 className="file-name">Error: ' + (data.error || 'Unknown error') + '</h3></div></li>';
          return;
        }
        
        if (!data.files || !Array.isArray(data.files) || data.files.length === 0) {
          console.log('No files found');
          fileListEl.innerHTML = '<li className="file-item"><div className="file-info"><h3 className="file-name">No files found</h3></div></li>';
          return;
        }
        
        console.log('Found ' + data.files.length + ' files, starting render');
        
        // 文件已经按最近修改时间排序，直接显示
        const recentFiles = data.files;
        
        // Render each file
        recentFiles.forEach((file, index) => {
          console.log('Rendering file ' + (index+1) + '/' + recentFiles.length + ': ' + file.name);
          
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
          fileDetails.textContent = 'Type: ' + (file.type || 'unknown') + ' | Size: ' + formatFileSize(file.size || 0) + ' | Modified: ' + formatDate(file.lastModified || new Date());
          
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
        
        // Update last sync time
        localStorage.setItem('lastSyncTime', Date.now());
        console.log('File list loaded successfully');
      } catch (err) {
        console.error('Error loading file list:', err);
        const fileListEl = document.getElementById('fileList');
        if (fileListEl) {
          fileListEl.innerHTML = '<li className="file-item"><div className="file-info"><h3 className="file-name">Error loading files: ' + err.message + '</h3></div></li>';
        }
      }
    }
    
    // Show delete file confirmation dialog
    function showDeleteFileConfirm(fileId, fileName) {
      showConfirmDialog(
        'Delete File', 
        'Are you sure you want to delete "' + fileName + '"? This action cannot be undone.', 
        () => deleteFile(fileId)
      );
    }
    
    // Delete file
    async function deleteFile(fileId) {
      try {
        const response = await authenticatedFetch("/api/files/delete/" + fileId, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          console.error("File deletion failed, status code: " + response.status);
          showToast("Failed to delete file: " + response.status);
          return;
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Remove file item from DOM
          const fileItem = document.querySelector('li[data-file-id="' + fileId + '"]');
          if (fileItem) {
            fileItem.remove();
          }
          
          showToast('File deleted successfully');
          
          // Reload file list
          setTimeout(() => {
            loadFiles();
          }, 500);
        } else {
          console.error('File deletion failed:', data.error);
          showToast("Failed to delete file: " + (data.error || 'Unknown error'));
        }
      } catch (err) {
        console.error('Error deleting file:', err);
        showToast("Error deleting file: " + err.message);
      }
    }
    
    // Download file
    function downloadFile(fileId) {
      window.open("/api/files/download/" + fileId + "?token=" + token);
    }
    
    // Upload file
    async function uploadFile(file) {
      try {
        console.log('Starting file upload:', file.name, 'size:', file.size, 'type:', file.type);
        
        // Show uploading indicator
        const dropzone = document.getElementById('dropzone');
        const originalText = dropzone.innerHTML;
        dropzone.innerHTML = '<p>Uploading... Please wait</p>';
        
        const formData = new FormData();
        formData.append('file', file);
        
        // Use authenticatedFetch function
        const response = await authenticatedFetch('/api/files/upload', {
          method: 'POST',
          body: formData
        });
        
        // Restore original text
        dropzone.innerHTML = originalText;
        
        // Check response status
        if (!response.ok) {
          console.error("Upload failed, status code: " + response.status);
          alert("Upload failed with status: " + response.status);
          return;
        }
        
        let data;
        try {
          const text = await response.text();
          console.log('Upload API raw response:', text);
          data = JSON.parse(text);
        } catch (parseError) {
          console.error('JSON parsing failed:', parseError);
          alert('Error parsing server response');
          return;
        }
        
        console.log('Parsed upload response:', data);
        
        if (data.success) {
          console.log('File upload successful:', data.fileId);
          
          // Show success notification
          showToast('File uploaded successfully!');
          
          // Ensure we wait a bit before reloading the file list
          // This helps ensure the server has time to process the file
          console.log('Delaying 1 second before refreshing file list...');
          setTimeout(() => {
            console.log('Starting file list refresh');
            loadFiles().then(() => {
              console.log('File list refresh complete');
            }).catch(err => {
              console.error('Error refreshing file list:', err);
            });
          }, 1000);
        } else {
          console.error('Upload failed:', data.error);
          alert("Upload failed: " + (data.error || 'Unknown error'));
        }
      } catch (err) {
        console.error('Error uploading file:', err);
        alert("Error during upload: " + err.message);
        
        // Restore original text
        const dropzone = document.getElementById('dropzone');
        dropzone.innerHTML = '<p>Drag and drop files here or click to upload</p><input type="file" id="fileInput">';
        
        // Reinitialize file input
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
    
    // Reinitialize dropzone
    function reinitializeDropzone() {
      console.log('Reinitializing dropzone');
      const dropzone = document.getElementById('dropzone');
      const fileInput = document.getElementById('fileInput');
      
      if (!dropzone || !fileInput) {
        console.error('dropzone or fileInput element not found');
        return;
      }
      
      // Remove all existing event listeners
      const newDropzone = dropzone.cloneNode(true);
      dropzone.parentNode.replaceChild(newDropzone, dropzone);
      
      const newFileInput = document.createElement('input');
      newFileInput.type = 'file';
      newFileInput.id = 'fileInput';
      newFileInput.style.display = 'none';
      
      // Ensure dropzone content is correct
      newDropzone.innerHTML = '<p>Drag and drop files here or click to upload</p>';
      newDropzone.appendChild(newFileInput);
      
      // Click to upload
      newDropzone.addEventListener('click', () => {
        newFileInput.click();
      });
      
      newFileInput.addEventListener('change', () => {
        if (newFileInput.files.length > 0) {
          uploadFile(newFileInput.files[0]);
        }
      });
      
      // Drag and drop upload
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
      
      console.log('Dropzone reinitialization complete');
    }
    
    // Messages management
    const MAX_MESSAGES = 50; // Maximum number of messages to store
    
    // Initialize messaging functionality
    async function initMessaging() {
      const messageForm = document.getElementById('messageForm');
      const messageInput = document.getElementById('messageInput');
      const messageList = document.getElementById('messageList');
      const clearMessagesBtn = document.getElementById('clearMessagesBtn');
      
      // 首先加载本地消息
      const localMessages = JSON.parse(localStorage.getItem('syncMessages') || '[]');
      
      // 获取并合并服务器消息
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
            // 同时清除服务器消息
            await authenticatedFetch('/api/messages/clear', {
              method: 'POST'
            });
          } catch (err) {
            console.error('Error clearing server messages:', err);
          }
          renderMessages([]);
        }
      });
    }
    
    // 加载并合并服务器消息与本地消息
    async function loadAndMergeServerMessages(localMessages) {
      try {
        const response = await authenticatedFetch('/api/messages');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.messages) {
            // 合并本地和服务器消息，避免重复
            const serverMessages = data.messages;
            const allMessages = [...localMessages];
            
            // 添加在服务器上存在但本地不存在的消息
            serverMessages.forEach(serverMsg => {
              if (!allMessages.some(localMsg => localMsg.id === serverMsg.id)) {
                allMessages.push(serverMsg);
              }
            });
            
            // 按时间戳排序
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
        console.error('Error loading server messages:', err);
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
          console.error('Message sync failed:', await response.text());
        } else {
          console.log('Message successfully synced to server');
        }
      } catch (err) {
        console.error('Message sync error:', err);
      }
    }
    
    // 删除消息
    async function deleteMessage(messageId) {
      try {
        // 从本地存储中删除
        const messages = JSON.parse(localStorage.getItem('syncMessages') || '[]');
        const updatedMessages = messages.filter(msg => msg.id !== messageId);
        localStorage.setItem('syncMessages', JSON.stringify(updatedMessages));
        
        // 从服务器删除
        const response = await authenticatedFetch("/api/messages/delete/" + messageId, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          console.error("Message deletion failed, status code: " + response.status);
        }
        
        // 更新UI
        renderMessages(updatedMessages);
        showToast('Message deleted');
      } catch (err) {
        console.error('Error deleting message:', err);
        showToast("Error deleting message: " + err.message);
      }
    }
    
    // 渲染消息UI
    function renderMessages(messages) {
      const deviceId = getDeviceId();
      const messageList = document.getElementById('messageList');
      messageList.innerHTML = '';
      
      if (messages.length === 0) {
        // 使用 DOM API 创建空消息提示
        const emptyItem = document.createElement('li');
        emptyItem.className = 'message-item other';
        
        const messageHeader = document.createElement('div');
        messageHeader.className = 'message-header';
        
        const senderSpan = document.createElement('span');
        senderSpan.textContent = 'System';
        
        const timeSpan = document.createElement('span');
        timeSpan.textContent = formatDate(new Date().toISOString());
        
        messageHeader.appendChild(senderSpan);
        messageHeader.appendChild(timeSpan);
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = 'No messages yet. Start the conversation!';
        
        emptyItem.appendChild(messageHeader);
        emptyItem.appendChild(messageContent);
        
        messageList.appendChild(emptyItem);
        return;
      }
      
      messages.forEach(msg => {
        // 使用 DOM API 创建消息项
        const messageItem = document.createElement('li');
        const isSelf = msg.deviceId === deviceId;
        messageItem.className = 'message-item ' + (isSelf ? 'self' : 'other');
        messageItem.dataset.messageId = msg.id;
        
        // 创建消息头部
        const messageHeader = document.createElement('div');
        messageHeader.className = 'message-header';
        
        const senderSpan = document.createElement('span');
        senderSpan.textContent = isSelf ? 'You (This Device)' : 'Device ' + msg.deviceId.substring(0, 8);
        
        const timeSpan = document.createElement('span');
        timeSpan.textContent = formatDate(msg.timestamp);
        
        messageHeader.appendChild(senderSpan);
        messageHeader.appendChild(timeSpan);
        
        // 创建消息内容
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = escapeHTML(msg.text);
        
        // 创建消息操作
        const messageActions = document.createElement('div');
        messageActions.className = 'message-actions';
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'small-btn copy-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.addEventListener('click', function() {
          copyToClipboard(msg.text);
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'small-btn delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', function() {
          showDeleteMessageConfirm(msg.id);
        });
        
        messageActions.appendChild(copyBtn);
        messageActions.appendChild(deleteBtn);
        
        // 将所有元素组合在一起
        messageItem.appendChild(messageHeader);
        messageItem.appendChild(messageContent);
        messageItem.appendChild(messageActions);
        
        messageList.appendChild(messageItem);
      });
      
      // Scroll to bottom
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
      // 移除任何现有的确认对话框
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
      // 方法1: 使用剪贴板API(现代浏览器)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => {
            showToast('Copied to clipboard!');
          })
          .catch(err => {
            console.error('Clipboard API failed:', err);
            // 回退到替代方法
            fallbackCopyToClipboard(text);
          });
      } else {
        // 方法2: 回退到传统方法
        fallbackCopyToClipboard(text);
      }
    }

    // 传统复制方法
    function fallbackCopyToClipboard(text) {
      try {
        // 创建临时textarea元素
        const textArea = document.createElement('textarea');
        textArea.value = text;
        
        // 使其不可见
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        
        // 选择并复制
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
        console.error('Traditional copy method failed:', err);
        showToast('Failed to copy text');
      }
    }
    
    // 显示提示消息
    function showToast(message) {
      // 移除现有提示
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
      
      // 3秒后自动移除
      setTimeout(() => {
        toast.remove();
      }, 3000);
    }
    
    // 转义HTML以防止XSS
    function escapeHTML(text) {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    
    // 优化的轮询变更机制
    function pollForChanges() {
      // 减少轮询频率：从5秒改为30秒
      const POLL_INTERVAL = 30000; // 30秒
      // 为长时间不活跃的用户暂停轮询
      let inactiveCounter = 0;
      const MAX_INACTIVE = 10; // 约5分钟后减少轮询频率
      let pollInterval;
      
      // 开始轮询
      const startPolling = () => {
        if (pollInterval) clearInterval(pollInterval);
        
        pollInterval = setInterval(async () => {
          try {
            // 如果用户长时间不活跃，减少轮询频率
            if (inactiveCounter > MAX_INACTIVE) {
              console.log("用户不活跃，减少轮询频率");
              clearInterval(pollInterval);
              // 切换到更长的间隔（5分钟）
              pollInterval = setInterval(startPolling, 5 * 60 * 1000);
              return;
            }
            
            inactiveCounter++;
            
            // 获取上次同步时间
            const lastSync = localStorage.getItem('lastSyncTime') || 0;
            
            // 发送变更请求，添加缓存破坏参数
            const response = await authenticatedFetch('/api/files/changes?since=' + lastSync + '&_=' + Date.now());
            
            if (response.status === 401) {
              console.error('Token expired, redirecting to login');
              logout();
              return;
            }
            
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.changes && data.changes.length > 0) {
                console.log(`发现${data.changes.length}个文件变更，刷新列表`);
                // 重置非活跃计数器
                inactiveCounter = 0;
                // 更新文件列表
                loadFiles();
              }
            }
          } catch (error) {
            console.error('Sync error:', error);
          }
        }, POLL_INTERVAL);
      };

      // 监听用户交互，重置非活跃计数器
      const resetInactiveCounter = () => {
        inactiveCounter = 0;
        // 如果处于低频轮询状态，恢复正常轮询
        if (pollInterval && pollInterval._repeat > POLL_INTERVAL) {
          startPolling();
        }
      };

      // 添加用户交互事件监听
      document.addEventListener('click', resetInactiveCounter);
      document.addEventListener('keypress', resetInactiveCounter);
      document.addEventListener('scroll', resetInactiveCounter);
      document.addEventListener('mousemove', resetInactiveCounter);

      // 启动轮询
      startPolling();
    }
    
    // 获取设备ID
    function getDeviceId() {
      let deviceId = localStorage.getItem('deviceId');
      if (!deviceId) {
        deviceId = 'device-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem('deviceId', deviceId);
      }
      return deviceId;
    }
    
    // 使用新的统一登出函数
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // 页面加载时初始化
    window.addEventListener('load', () => {
      console.log('Page loaded, starting initialization...');
      
      // 初始化令牌自动刷新
      setupTokenRefresh();
      
      // 首先加载文件列表
      loadFiles().then(() => {
        console.log('Initial file list load complete');
      }).catch(err => {
        console.error('Initial file list load failed:', err);
      });
      
      // 初始化dropzone
      reinitializeDropzone();
      
      // 初始化消息功能
      initMessaging().then(() => {
        console.log('Messaging functionality initialized');
      }).catch(err => {
        console.error('Messaging functionality initialization failed:', err);
      });
      
      // 开始轮询变更
      pollForChanges();
      
      // 显示设备ID
      console.log('Current device ID:', getDeviceId());
    });
  </script>
  `;
}