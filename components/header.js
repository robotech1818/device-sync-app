export function headerComponent(username) {
  return `
  <div class="header">
    <h1>Device Sync App</h1>
    <div class="user-info">
      <span>Welcome, ${username}</span>
      <button class="logout" id="logoutBtn">Logout</button>
    </div>
  </div>
  `;
}
