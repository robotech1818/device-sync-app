export function messagePanelComponent() {
  return `
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
  `;
}
