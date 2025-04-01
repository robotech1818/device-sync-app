export function appPageTemplate(username) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>设备同步应用</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { 
        font-family: Arial, sans-serif; 
        max-width: 900px; 
        margin: 0 auto; 
        padding: 20px; 
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      .info { 
        background: #f0f0f0; 
        padding: 15px; 
        border-radius: 5px; 
        margin-bottom: 20px; 
      }
      button { 
        padding: 10px 15px; 
        background: #0066ff; 
        color: white; 
        border: none; 
        border-radius: 5px; 
        cursor: pointer; 
      }
      button.logout {
        background: #f44336;
      }
      #result { 
        margin-top: 15px; 
        white-space: pre-wrap; 
        background: #f9f9f9; 
        padding: 10px; 
        border-radius: 5px; 
      }
      #fileList {
        list-style: none;
        padding: 0;
      }
      .file-item {
        background: #f9f9f9;
        border-radius: 5px;
        padding: 10px;
        margin-bottom: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .file-info {
        flex: 1;
      }
      .file-actions button {
        margin-left: 10px;
      }
      .dropzone {
        border: 2px dashed #0066ff;
        border-radius: 5px;
        padding: 25px;
        text-align: center;
        margin-bottom: 20px;
        cursor: pointer;
      }
      .dropzone.highlight {
        border-color: #00cc00;
        background-color: rgba(0, 204, 0, 0.05);
      }
      input[type="file"] {
        display: none;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>设备同步应用</h1>
      <div>
        <span>欢迎, ${username}</span>
        <button class="logout" id="logoutBtn">退出</button>
      </div>
    </div>
    
    <div class="info">
      <h2>上传文件</h2>
      <div id="dropzone" class="dropzone">
        <p>拖放文件到此处或点击上传</p>
        <input type="file" id="fileInput">
      </div>
    </div>
    
    <div class="info">
      <h2>您的文件</h2>
      <ul id="fileList">
        <li>加载中...</li>
      </ul>
    </div>
    
    <script>
      // 从URL参数和localStorage中获取令牌
      function getTokenFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('token');
      }
      
      // 获取令牌，优先从URL获取，然后从localStorage获取
      const urlToken = getTokenFromUrl();
      let token = urlToken;
      
      if (!token) {
        token = localStorage.getItem('authToken');
      } else {
        // 如果从URL获取到令牌，也存储到localStorage中
        localStorage.setItem('authToken', token);
        
        // 清除URL中的令牌参数（可选）
        if (history.pushState) {
          const newUrl = window.location.pathname;
          window.history.pushState({path: newUrl}, '', newUrl);
        }
      }
      
      console.log('当前令牌状态:', !!token);
      
      if (!token) {
        console.error('未找到认证令牌，重定向到登录页面');
        window.location.href = '/login';
      }
      
      // 通用的认证请求函数
      async function authenticatedFetch(url, options = {}) {
        const headers = options.headers || {};
        headers['Authorization'] = \`Bearer \${token}\`;
        return fetch(url, { ...options, headers });
      }
      
      // 获取文件列表
      async function loadFiles() {
        try {
          const response = await authenticatedFetch('/api/files/list');
          
          // 检查认证状态
          if (response.status === 401) {
            console.error('认证失败，重定向到登录页面');
            localStorage.removeItem('authToken');
            window.location.href = '/login';
            return;
          }
          
          const data = await response.json();
          
          const fileListEl = document.getElementById('fileList');
          
          if (!data.success || !data.files || data.files.length === 0) {
            fileListEl.innerHTML = '<li>没有文件</li>';
            return;
          }
          
          fileListEl.innerHTML = '';
          
          // 按最近修改时间排序
          data.files.sort((a, b) => {
            return new Date(b.lastModified) - new Date(a.lastModified);
          });
          
          data.files.forEach(file => {
            const li = document.createElement('li');
            li.className = 'file-item';
            
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            
            const fileName = document.createElement('h3');
            fileName.textContent = file.name;
            
            const fileDetails = document.createElement('p');
            fileDetails.textContent = \`类型: \${file.type} | 大小: \${formatFileSize(file.size)} | 修改时间: \${formatDate(file.lastModified)}\`;
            
            fileInfo.appendChild(fileName);
            fileInfo.appendChild(fileDetails);
            
            const fileActions = document.createElement('div');
            fileActions.className = 'file-actions';
            
            const downloadBtn = document.createElement('button');
            downloadBtn.textContent = '下载';
            downloadBtn.addEventListener('click', () => downloadFile(file.id));
            
            fileActions.appendChild(downloadBtn);
            
            li.appendChild(fileInfo);
            li.appendChild(fileActions);
            
            fileListEl.appendChild(li);
          });
          
          // 更新上次同步时间
          localStorage.setItem('lastSyncTime', Date.now());
        } catch (err) {
          console.error('加载文件错误:', err);
        }
      }
      
      // 下载文件
      function downloadFile(fileId) {
        window.open(\`/api/files/download/\${fileId}?token=\${token}\`);
      }
      
      // 上传文件
      async function uploadFile(file) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await authenticatedFetch('/api/files/upload', {
            method: 'POST',
            body: formData
          });
          
          // 检查认证状态
          if (response.status === 401) {
            console.error('认证失败，重定向到登录页面');
            localStorage.removeItem('authToken');
            window.location.href = '/login';
            return;
          }
          
          const data = await response.json();
          
          if (data.success) {
            loadFiles(); // 重新加载文件列表
          } else {
            alert(\`上传失败: \${data.error}\`);
          }
        } catch (err) {
          console.error('上传文件错误:', err);
          alert('上传过程中发生错误');
        }
      }
      
      // 格式化文件大小
      function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
      }
      
      // 格式化日期
      function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
      }
      
      // 初始化拖放上传区域
      function initDropzone() {
        const dropzone = document.getElementById('dropzone');
        const fileInput = document.getElementById('fileInput');
        
        // 点击上传
        dropzone.addEventListener('click', () => {
          fileInput.click();
        });
        
        fileInput.addEventListener('change', () => {
          if (fileInput.files.length > 0) {
            uploadFile(fileInput.files[0]);
          }
        });
        
        // 拖放上传
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
      
      // 轮询文件变更
      function pollForChanges() {
        // 每5秒检查一次更改
        setInterval(async () => {
          try {
            // 获取上次同步时间
            const lastSync = localStorage.getItem('lastSyncTime') || 0;
            
            // 请求新文件和更改
            const response = await authenticatedFetch('/api/files/changes?since=' + lastSync);
            
            if (response.status === 401) {
              console.error('令牌过期，重定向到登录页面');
              localStorage.removeItem('authToken');
              window.location.href = '/login';
              return;
            }
            
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.changes.length > 0) {
                // 有新变更，重新加载文件列表
                loadFiles();
              }
            }
          } catch (error) {
            console.error('同步错误:', error);
          }
        }, 5000);
      }
      
      // 设备ID标识
      function getDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
          deviceId = 'device-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10);
          localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
      }
      
      // 退出登录
      document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      });
      
      // 页面加载时初始化
      window.addEventListener('load', () => {
        loadFiles();
        initDropzone();
        pollForChanges();
        
        // 在控制台显示设备ID，便于测试
        console.log('当前设备ID:', getDeviceId());
      });
    </script>
  </body>
  </html>
  `;
}