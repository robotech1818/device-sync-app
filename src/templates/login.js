export function loginPageTemplate() {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>登录 - 设备同步应用</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: Arial, sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        background-color: #f5f5f5;
      }
      .login-container {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 400px;
      }
      h1 {
        margin-top: 0;
        color: #333;
        text-align: center;
      }
      .form-group {
        margin-bottom: 1rem;
      }
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: bold;
      }
      input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
      }
      button {
        background: #0066ff;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 0.5rem 1rem;
        font-size: 1rem;
        cursor: pointer;
        width: 100%;
      }
      button:hover {
        background: #0052cc;
      }
      .error {
        color: red;
        margin-top: 1rem;
        display: none;
      }
    </style>
  </head>
  <body>
    <div class="login-container">
      <h1>设备同步应用</h1>
      <form id="loginForm">
        <div class="form-group">
          <label for="username">用户名</label>
          <input type="text" id="username" name="username" required>
        </div>
        <div class="form-group">
          <label for="password">密码</label>
          <input type="password" id="password" name="password" required>
        </div>
        <button type="submit">登录</button>
        <div id="errorMessage" class="error"></div>
      </form>
    </div>
    
    <script>
      document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
          const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
          });
          
          const data = await response.json();
          
          if (response.ok) {
            // 存储令牌
            localStorage.setItem('authToken', data.token);
            // 重定向到应用页面
            window.location.href = '/app';
          } else {
            // 显示错误信息
            const errorEl = document.getElementById('errorMessage');
            errorEl.textContent = data.error || '登录失败';
            errorEl.style.display = 'block';
          }
        } catch (err) {
          console.error('登录错误:', err);
          const errorEl = document.getElementById('errorMessage');
          errorEl.textContent = '发生错误，请稍后再试';
          errorEl.style.display = 'block';
        }
      });
    </script>
  </body>
  </html>
  `;
}
