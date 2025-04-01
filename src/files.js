// List user's files
export async function listFiles(username, env) {
  // Use KV list prefix functionality to get all user's files
  const prefix = `file:${username}:`;
  const fileMetaPrefix = `${prefix}.*:meta`; // Use .* to match all file IDs
  
  try {
    const files = await env.SYNC_KV.list({ prefix: fileMetaPrefix });
    
    // Process file list
    const fileList = [];
    for (const key of files.keys) {
      const metadata = await env.SYNC_KV.get(key.name, 'json');
      if (metadata) {
        fileList.push(metadata);
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      files: fileList
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: `Failed to get file list: ${err.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function clearMessages(username, env) {
  try {
    // 获取消息列表
    const listKey = `message_list:${username}`;
    const messageList = await env.SYNC_KV.get(listKey, 'json') || [];
    
    // 删除所有消息
    for (const msgId of messageList) {
      await env.SYNC_KV.delete(`message:${username}:${msgId}`);
    }
    
    // 清空消息列表
    await env.SYNC_KV.put(listKey, JSON.stringify([]));
    
    return new Response(JSON.stringify({
      success: true
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: `清除消息失败: ${err.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle file upload
export async function handleFileUpload(request, username, env) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No file provided'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check file size limit
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      return new Response(JSON.stringify({
        success: false,
        error: 'File size exceeds 2MB limit'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Generate unique file ID
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Store file metadata
    const metadata = {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date().toISOString(),
      owner: username
    };
    
    // Read file content and save to KV
    const fileContent = await file.arrayBuffer();
    
    // Store file content
    await env.SYNC_KV.put(
      `file:${username}:${fileId}:content`,
      fileContent
    );
    
    // Store file metadata
    await env.SYNC_KV.put(
      `file:${username}:${fileId}:meta`,
      JSON.stringify(metadata)
    );
    
    return new Response(JSON.stringify({
      success: true,
      fileId: fileId,
      metadata: metadata
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: `File upload failed: ${err.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Download file
export async function downloadFile(fileId, username, env) {
  try {
    // Get file metadata
    const metaKey = `file:${username}:${fileId}:meta`;
    const metadata = await env.SYNC_KV.get(metaKey, 'json');
    
    if (!metadata) {
      return new Response(JSON.stringify({
        success: false,
        error: 'File not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get file content
    const contentKey = `file:${username}:${fileId}:content`;
    const fileContent = await env.SYNC_KV.get(contentKey, 'arrayBuffer');
    
    if (!fileContent) {
      return new Response(JSON.stringify({
        success: false,
        error: 'File content not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Set appropriate response headers and return file
    return new Response(fileContent, {
      headers: {
        'Content-Type': metadata.type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(metadata.name)}"`,
        'Cache-Control': 'private, max-age=3600'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: `File download failed: ${err.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Sync file status
export async function syncFileStatus(request, username, env) {
  try {
    const { fileId, lastModified, deviceId } = await request.json();
    
    if (!fileId || !lastModified || !deviceId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get file metadata
    const metaKey = `file:${username}:${fileId}:meta`;
    const metadata = await env.SYNC_KV.get(metaKey, 'json');
    
    if (!metadata) {
      return new Response(JSON.stringify({
        success: false,
        error: 'File not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Update last modified time
    metadata.lastModified = lastModified;
    metadata.lastSyncDevice = deviceId;
    
    // Save updated metadata
    await env.SYNC_KV.put(metaKey, JSON.stringify(metadata));
    
    return new Response(JSON.stringify({
      success: true,
      metadata: metadata
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: `Sync file status failed: ${err.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle message synchronization
export async function syncMessage(request, username, env) {
  try {
    const { message, deviceId } = await request.json();
    
    if (!message || !deviceId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Generate a unique message ID if not provided
    if (!message.id) {
      message.id = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }
    
    // Add timestamp if not provided
    if (!message.timestamp) {
      message.timestamp = new Date().toISOString();
    }
    
    // Store message in KV
    const messageKey = `message:${username}:${message.id}`;
    const messageData = {
      ...message,
      deviceId,
      owner: username
    };
    
    await env.SYNC_KV.put(messageKey, JSON.stringify(messageData));
    
    // Get message list for this user to update
    const listKey = `message_list:${username}`;
    let messageList = await env.SYNC_KV.get(listKey, 'json') || [];
    
    // Add new message ID to list
    messageList.push(message.id);
    
    // Limit to max number of messages (50)
    const MAX_MESSAGES = 50;
    if (messageList.length > MAX_MESSAGES) {
      const messagesToDelete = messageList.slice(0, messageList.length - MAX_MESSAGES);
      
      // Delete old messages
      for (const msgId of messagesToDelete) {
        await env.SYNC_KV.delete(`message:${username}:${msgId}`);
      }
      
      // Update message list
      messageList = messageList.slice(messageList.length - MAX_MESSAGES);
    }
    
    // Save updated message list
    await env.SYNC_KV.put(listKey, JSON.stringify(messageList));
    
    return new Response(JSON.stringify({
      success: true,
      message: messageData
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: `Message sync failed: ${err.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get messages
export async function getMessages(username, env) {
  try {
    // Get message list
    const listKey = `message_list:${username}`;
    const messageList = await env.SYNC_KV.get(listKey, 'json') || [];
    
    // Fetch all messages
    const messages = [];
    for (const msgId of messageList) {
      const messageKey = `message:${username}:${msgId}`;
      const messageData = await env.SYNC_KV.get(messageKey, 'json');
      if (messageData) {
        messages.push(messageData);
      }
    }
    
    // Sort by timestamp
    messages.sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    return new Response(JSON.stringify({
      success: true,
      messages: messages
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: `Failed to get messages: ${err.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}