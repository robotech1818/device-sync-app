export function stylesComponent() {
  return `
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
    
    /* Confirm Dialog Styles */
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
  `;
}
