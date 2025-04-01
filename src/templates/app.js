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
        Your Files
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
            document.cookie = \`authToken=\${token}; path=/; max-age=86400; SameSite=Strict\`;
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
          const response = await authenticatedFetch('/api/files/list');
          
          // Check authentication status
          if (response.status === 401) {
            console.error('Authentication failed, redirecting to login');
            localStorage.removeItem('authToken');
            window.location.href = '/login';
            return;
          }
          
          const data = await response.json();
          
          const fileListEl = document.getElementById('fileList');
          
          if (!data.success || !data.files || data.files.length === 0) {
            fileListEl.innerHTML = '<li class="file-item"><div class="file-info"><h3 class="file-name">No files found</h3></div></li>';
            return;
          }
          
          fileListEl.innerHTML = '';
          
          // Sort by last modified date
          data.files.sort((a, b) => {
            return new Date(b.lastModified) - new Date(a.lastModified);
          });
          
          data.files.forEach(file => {
            const li = document.createElement('li');
            li.className = 'file-item';
            
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            
            const fileName = document.createElement('h3');
            fileName.className = 'file-name';
            fileName.textContent = file.name;
            
            const fileDetails = document.createElement('p');
            fileDetails.className = 'file-details';
            fileDetails.textContent = \`Type: \${file.type} | Size: \${formatFileSize(file.size)} | Modified: \${formatDate(file.lastModified)}\`;
            
            fileInfo.appendChild(fileName);
            fileInfo.appendChild(fileDetails);
            
            const fileActions = document.createElement('div');
            fileActions.className = 'file-actions';
            
            const downloadBtn = document.createElement('button');
            downloadBtn.textContent = 'Download';
            downloadBtn.addEventListener('click', () => downloadFile(file.id));
            
            fileActions.appendChild(downloadBtn);
            
            li.appendChild(fileInfo);
            li.appendChild(fileActions);
            
            fileListEl.appendChild(li);
          });
          
          // Update last sync time
          localStorage.setItem('lastSyncTime', Date.now());
        } catch (err) {
          console.error('Error loading files:', err);
        }
      }
      
      // Download file
      function downloadFile(fileId) {
        window.open(\`/api/files/download/\${fileId}?token=\${token}\`);
      }
      
      // Upload file
      async function uploadFile(file) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          
          // Get latest token
          const currentToken = getToken();
          
          const response = await fetch('/api/files/upload', {
            method: 'POST',
            headers: {
              'Authorization': \`Bearer \${currentToken}\`
            },
            body: formData
          });
          
          // Check authentication status
          if (response.status === 401) {
            console.error('Authentication failed during upload, redirecting to login');
            localStorage.removeItem('authToken');
            window.location.href = '/login';
            return;
          }
          
          const data = await response.json();
          
          if (data.success) {
            loadFiles(); // Reload file list
          } else {
            alert(\`Upload failed: \${data.error}\`);
          }
        } catch (err) {
          console.error('File upload error:', err);
          alert('An error occurred during upload');
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
      
      // Initialize drag and drop zone
      function initDropzone() {
        const dropzone = document.getElementById('dropzone');
        const fileInput = document.getElementById('fileInput');
        
        // Click to upload
        dropzone.addEventListener('click', () => {
          fileInput.click();
        });
        
        fileInput.addEventListener('change', () => {
          if (fileInput.files.length > 0) {
            uploadFile(fileInput.files[0]);
          }
        });
        
        // Drag and drop upload
        dropzone.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add('highlight');
        });
        
        dropzone.addEventListener('dragleave', (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove('highlight');
        });
        
        dropzone.addEventListener('drop', (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove('highlight');
          
          if (e.dataTransfer.files.length > 0) {
            uploadFile(e.dataTransfer.files[0]);
          }
        });
      }
      
      // Messages management
      const MAX_MESSAGES = 50; // Maximum number of messages to store
      
      function initMessaging() {
        const messageForm = document.getElementById('messageForm');
        const messageInput = document.getElementById('messageInput');
        const messageList = document.getElementById('messageList');
        const clearMessagesBtn = document.getElementById('clearMessagesBtn');
        
        // Load existing messages from localStorage
        loadMessages();
        
        // Send message
        messageForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const messageText = messageInput.value.trim();
          if (messageText) {
            sendMessage(messageText);
            messageInput.value = '';
          }
        });
        
        // Clear messages
        clearMessagesBtn.addEventListener('click', () => {
          if (confirm('Are you sure you want to clear all messages?')) {
            localStorage.removeItem('syncMessages');
            loadMessages();
          }
        });
        
        // Load messages from localStorage
        function loadMessages() {
          const messages = JSON.parse(localStorage.getItem('syncMessages') || '[]');
          renderMessages(messages);
        }
        
        // Send new message
        function sendMessage(text) {
          const deviceId = getDeviceId();
          const message = {
            id: Date.now() + Math.random().toString(36).substring(2, 9),
            deviceId: deviceId,
            text: text,
            timestamp: new Date().toISOString()
          };
          
          // Add to localStorage
          const messages = JSON.parse(localStorage.getItem('syncMessages') || '[]');
          messages.push(message);
          
          // Limit number of messages
          if (messages.length > MAX_MESSAGES) {
            messages.splice(0, messages.length - MAX_MESSAGES);
          }
          
          localStorage.setItem('syncMessages', JSON.stringify(messages));
          
          // Update UI
          renderMessages(messages);
          
          // Sync with server (optional feature, not implemented yet)
          syncMessageToServer(message);
        }
        
        // Render messages in UI
        function renderMessages(messages) {
          const deviceId = getDeviceId();
          messageList.innerHTML = '';
          
          if (messages.length === 0) {
            const emptyItem = document.createElement('li');
            emptyItem.className = 'message-item other';
            emptyItem.innerHTML = \`
              <div class="message-header">
                <span>System</span>
                <span>\${formatDate(new Date().toISOString())}</span>
              </div>
              <div class="message-content">No messages yet. Start the conversation!</div>
            \`;
            messageList.appendChild(emptyItem);
            return;
          }
          
          messages.forEach(msg => {
            const messageItem = document.createElement('li');
            const isSelf = msg.deviceId === deviceId;
            
            messageItem.className = \`message-item \${isSelf ? 'self' : 'other'}\`;
            
            messageItem.innerHTML = \`
              <div class="message-header">
                <span>\${isSelf ? 'You (This Device)' : 'Device ' + msg.deviceId.substring(0, 8)}</span>
                <span>\${formatDate(msg.timestamp)}</span>
              </div>
              <div class="message-content">\${escapeHTML(msg.text)}</div>
            \`;
            
            messageList.appendChild(messageItem);
          });
          
          // Scroll to bottom
          messageList.scrollTop = messageList.scrollHeight;
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
        
        // Sync message to server (placeholder function)
        async function syncMessageToServer(message) {
          try {
            // This is where you would implement server syncing
            // Not implemented in this version
            console.log('Message would be synced:', message);
          } catch (err) {
            console.error('Error syncing message:', err);
          }
        }
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
        loadFiles();
        initDropzone();
        initMessaging();
        pollForChanges();
        
        // Show device ID in console for testing
        console.log('Current device ID:', getDeviceId());
      });
    </script>
  </body>
  </html>
  `;
}