// 引入组件
import { stylesComponent } from './components/styles.js';
import { headerComponent } from './components/header.js';
import { fileUploaderComponent } from './components/fileUploader.js';
import { messagePanelComponent } from './components/messagePanel.js';
import { fileListComponent } from './components/fileList.js';
import { scriptsComponent } from './components/scripts.js';

// 主模板函数
export function appPageTemplate(username) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Device Sync App</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${stylesComponent()}
  </head>
  <body>
    ${headerComponent(username)}
    
    <div class="container">
      ${fileUploaderComponent()}
      ${messagePanelComponent()}
    </div>
    
    ${fileListComponent()}
    
    ${scriptsComponent()}
  </body>
  </html>
  `;
}