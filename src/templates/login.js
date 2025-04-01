export function loginPageTemplate() {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Login - Device Sync App</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        background-color: #f0f2f5;
      }
      .login-container {
        background: white;
        padding: 2.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 400px;
      }
      h1 {
        margin-top: 0;
        color: #333;
        text-align: center;
        font-weight: 600;
        font-size: 24px;
      }
      .app-description {
        text-align: center;
        color: #666;
        margin-bottom: 20px;
      }
      .form-group {
        margin-bottom: 1.2rem;
      }
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #555;
      }
      input {
        width: 100%;
        padding: 0.7rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 1rem;
        transition: border 0.3s;
      }
      input:focus {
        outline: none;
        border-color: #0066ff;
        box-shadow: 0 0 0 2px rgba(0, 102, 255, 0.1);
      }
      button {
        background: #0066ff;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 0.7rem 1rem;
        font-size: 1rem;
        cursor: pointer;
        width: 100%;
        font-weight: 500;
        transition: background 0.3s;
      }
      button:hover {
        background: #0052cc;
      }
      .error {
        color: #e53935;
        margin-top: 1rem;
        display: none;
        padding: 10px;
        background-color: rgba(229, 57, 53, 0.1);
        border-radius: 4px;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="login-container">
      <h1>Device Sync App</h1>
      <p class="app-description">Sync files and messages across your devices</p>
      <form id="loginForm">
        <div class="form-group">
          <label for="username">Username</label>
          <input type="text" id="username" name="username" required>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required>
        </div>
        <button type="submit">Log In</button>
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
          
          if (response.ok && data.success && data.token) {
            // Add debug log
            console.log('Login successful, saving token:', data.token);
            
            // Clear previous token (if any)
            localStorage.removeItem('authToken');
            
            // Store token in localStorage
            localStorage.setItem('authToken', data.token);
            
            // Also set as cookie (HTTP Only = false, allowing JavaScript access)
            document.cookie = \`authToken=\${data.token}; path=/; max-age=\${data.expiresIn}; SameSite=Strict\`;
            
            // Ensure localStorage and cookie update before redirecting
            setTimeout(() => {
              // Pass token as URL parameter
              window.location.href = '/app?token=' + encodeURIComponent(data.token);
            }, 300);
          } else {
            // Show error message
            const errorEl = document.getElementById('errorMessage');
            errorEl.textContent = data.error || 'Login failed';
            errorEl.style.display = 'block';
          }
        } catch (err) {
          console.error('Login error:', err);
          const errorEl = document.getElementById('errorMessage');
          errorEl.textContent = 'An error occurred. Please try again later.';
          errorEl.style.display = 'block';
        }
      });
    </script>
  </body>
  </html>
  `;
}