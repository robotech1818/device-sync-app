export function fileListComponent() {
  return `
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
  `;
}
