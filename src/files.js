// 列出用户的文件
export async function listFiles(username, env) {
  console.log(`获取用户 ${username} 的文件列表`);
  
  try {
    // 使用正确的前缀，直接匹配所有该用户的文件元数据
    const prefix = `file:${username}:`;
    const metaSuffix = ':meta';
    
    console.log(`使用前缀查询: ${prefix}`);
    
    // 获取所有以此前缀开头的键
    const files = await env.SYNC_KV.list({ prefix });
    
    console.log(`KV查询返回的键数量: ${files.keys.length}`);
    console.log(`KV查询返回的键:`, files.keys.map(k => k.name));
    
    // 筛选出元数据键（以:meta结尾）
    const metaKeys = files.keys.filter(key => key.name.endsWith(metaSuffix));
    console.log(`找到的元数据键数量: ${metaKeys.length}`);
    
    // 处理文件列表
    const fileList = [];
    for (const key of metaKeys) {
      console.log(`获取文件元数据: ${key.name}`);
      try {
        const metadata = await env.SYNC_KV.get(key.name, 'json');
        if (metadata) {
          console.log(`找到有效元数据:`, metadata);
          fileList.push(metadata);
        } else {
          console.log(`元数据为空: ${key.name}`);
        }
      } catch (metaErr) {
        console.error(`获取元数据错误 ${key.name}:`, metaErr.message);
      }
    }
    
    console.log(`总共返回 ${fileList.length} 个文件`);
    
    return new Response(JSON.stringify({
      success: true,
      files: fileList
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error(`获取文件列表错误: ${err.message}`);
    console.error(err.stack);
    return new Response(JSON.stringify({
      success: false,
      error: `Failed to get file list: ${err.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 删除文件
export async function deleteFile(fileId, username, env) {
  try {
    // 获取文件元数据
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
    
    // 删除文件内容
    const contentKey = `file:${username}:${fileId}:content`;
    await env.SYNC_KV.delete(contentKey);
    
    // 删除文件元数据
    await env.SYNC_KV.delete(metaKey);
    
    return new Response(JSON.stringify({
      success: true
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: `Failed to delete file: ${err.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 删除消息
export async function deleteMessage(messageId, username, env) {
  try {
    // 删除消息
    await env.SYNC_KV.delete(`message:${username}:${messageId}`);
    
    // 更新消息列表
    const listKey = `message_list:${username}`;
    let messageList = await env.SYNC_KV.get(listKey, 'json') || [];
    messageList = messageList.filter(id => id !== messageId);
    await env.SYNC_KV.put(listKey, JSON.stringify(messageList));
    
    return new Response(JSON.stringify({
      success: true
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: `Failed to delete message: ${err.message}`
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
    
    // 检查并限制文件数量（只保留最近的10个文件）
    await limitFileCount(username, 10, env);
    
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

// 限制文件数量，保留最近的n个文件
async function limitFileCount(username, limit, env) {
  try {
    // 获取所有文件元数据
    const prefix = `file:${username}:`;
    const metaSuffix = ':meta';
    
    const files = await env.SYNC_KV.list({ prefix });
    const metaKeys = files.keys.filter(key => key.name.endsWith(metaSuffix));
    
    // 如果文件数量未超过限制，无需操作
    if (metaKeys.length <= limit) {
      return;
    }
    
    // 获取所有文件元数据
    const fileList = [];
    for (const key of metaKeys) {
      const metadata = await env.SYNC_KV.get(key.name, 'json');
      if (metadata) {
        fileList.push(metadata);
      }
    }
    
    // 按最近修改时间排序
    fileList.sort((a, b) => {
      return new Date(b.lastModified) - new Date(a.lastModified);
    });
    
    // 删除旧文件（保留最近的limit个文件）
    const filesToDelete = fileList.slice(limit);
    
    for (const file of filesToDelete) {
      // 删除文件内容
      await env.SYNC_KV.delete(`file:${username}:${file.id}:content`);
      // 删除文件元数据
      await env.SYNC_KV.delete(`file:${username}:${file.id}:meta`);
    }
    
    console.log(`已删除 ${filesToDelete.length} 个旧文件，保留 ${limit} 个最新文件`);
  } catch (err) {
    console.error('限制文件数量错误:', err);
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