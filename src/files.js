// 列出用户的文件
export async function listFiles(username, env) {
  console.log(`获取用户 ${username} 的文件列表`);
  
  try {
    // 首先尝试从文件索引获取数据（新的优化方式）
    const indexKey = `fileindex:${username}`;
    const fileIndex = await env.SYNC_KV.get(indexKey, 'json');
    
    // 如果文件索引存在，直接使用索引数据
    if (fileIndex && Array.isArray(fileIndex)) {
      console.log(`从文件索引获取 ${fileIndex.length} 个文件`);
      return new Response(JSON.stringify({
        success: true,
        files: fileIndex
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=120' // 缓存2分钟
        }
      });
    }
    
    // 索引不存在，使用传统方式获取文件并创建索引
    console.log(`文件索引不存在，使用传统方式获取并创建索引`);
    
    // 使用正确的前缀，直接匹配所有该用户的文件元数据
    const prefix = `file:${username}:`;
    const metaSuffix = ':meta';
    
    // 获取所有以此前缀开头的键
    const files = await env.SYNC_KV.list({ prefix });
    
    // 筛选出元数据键（以:meta结尾）
    const metaKeys = files.keys.filter(key => key.name.endsWith(metaSuffix));
    console.log(`找到的元数据键数量: ${metaKeys.length}`);
    
    // 如果没有文件，返回空数组
    if (metaKeys.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        files: []
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 批量获取文件元数据
    const metaPromises = metaKeys.map(key => 
      env.SYNC_KV.get(key.name, 'json')
        .then(metadata => metadata || null)
        .catch(err => {
          console.error(`获取元数据错误 ${key.name}:`, err.message);
          return null;
        })
    );
    
    const metadataResults = await Promise.all(metaPromises);
    const fileList = metadataResults.filter(Boolean);
    
    // 对文件按照最后修改时间排序，并只返回最近的10个文件
    fileList.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    const recentFiles = fileList.slice(0, 10);
    
    // 构建并保存文件索引
    await updateFileIndex(username, recentFiles, env);
    
    return new Response(JSON.stringify({
      success: true,
      files: recentFiles
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=120' // 缓存2分钟
      }
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

// 更新文件索引
async function updateFileIndex(username, files, env) {
  const indexKey = `fileindex:${username}`;
  
  try {
    // 仅保存必要信息到索引中
    const indexData = files.map(file => ({
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    }));
    
    // 保存索引
    await env.SYNC_KV.put(indexKey, JSON.stringify(indexData));
    console.log(`文件索引已更新，包含 ${indexData.length} 个文件`);
    return true;
  } catch (err) {
    console.error('更新文件索引失败:', err);
    return false;
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
    
    // 准备批量删除操作
    const deletePromises = [
      // 删除文件内容
      env.SYNC_KV.delete(`file:${username}:${fileId}:content`),
      // 删除文件元数据
      env.SYNC_KV.delete(metaKey)
    ];
    
    // 并行执行删除操作
    await Promise.all(deletePromises);
    
    // 更新文件索引
    await updateFileIndexForDelete(username, fileId, env);
    
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

// 从索引中删除文件
async function updateFileIndexForDelete(username, fileId, env) {
  const indexKey = `fileindex:${username}`;
  
  try {
    // 获取现有索引
    const fileIndex = await env.SYNC_KV.get(indexKey, 'json') || [];
    
    // 从索引中删除文件
    const updatedIndex = fileIndex.filter(file => file.id !== fileId);
    
    // 更新索引
    await env.SYNC_KV.put(indexKey, JSON.stringify(updatedIndex));
    console.log(`文件已从索引中删除，当前索引包含 ${updatedIndex.length} 个文件`);
    return true;
  } catch (err) {
    console.error('从索引中删除文件失败:', err);
    return false;
  }
}

// 删除消息 - 优化实现
export async function deleteMessage(messageId, username, env) {
  try {
    // 使用优化后的消息存储结构
    const messagesKey = `messages:${username}`;
    let messages = await env.SYNC_KV.get(messagesKey, 'json') || [];
    
    // 过滤掉要删除的消息
    messages = messages.filter(msg => msg.id !== messageId);
    
    // 更新消息列表
    await env.SYNC_KV.put(messagesKey, JSON.stringify(messages));
    
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

// 清除消息 - 优化实现
export async function clearMessages(username, env) {
  try {
    // 清空消息列表（一次操作）
    const messagesKey = `messages:${username}`;
    await env.SYNC_KV.put(messagesKey, JSON.stringify([]));
    
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

// 处理文件上传 - 优化实现
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
    
    // 检查文件大小限制
    if (file.size > 2 * 1024 * 1024) { // 2MB限制
      return new Response(JSON.stringify({
        success: false,
        error: 'File size exceeds 2MB limit'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 生成唯一文件ID
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // 创建文件元数据
    const metadata = {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date().toISOString(),
      owner: username
    };
    
    // 读取文件内容
    const fileContent = await file.arrayBuffer();
    
    // 并行执行存储操作
    const storePromises = [
      // 存储文件内容
      env.SYNC_KV.put(
        `file:${username}:${fileId}:content`,
        fileContent
      ),
      
      // 存储文件元数据
      env.SYNC_KV.put(
        `file:${username}:${fileId}:meta`,
        JSON.stringify(metadata)
      )
    ];
    
    await Promise.all(storePromises);
    
    // 更新文件索引
    await updateFileIndexForUpload(username, metadata, env);
    
    // 限制文件数量（只保留最近的10个文件）
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

// 将新上传的文件添加到索引
async function updateFileIndexForUpload(username, fileMetadata, env) {
  const indexKey = `fileindex:${username}`;
  
  try {
    // 获取现有索引
    let fileIndex = await env.SYNC_KV.get(indexKey, 'json') || [];
    
    // 添加新文件到索引
    fileIndex.push({
      id: fileMetadata.id,
      name: fileMetadata.name,
      type: fileMetadata.type,
      size: fileMetadata.size,
      lastModified: fileMetadata.lastModified
    });
    
    // 按最近修改时间排序
    fileIndex.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    
    // 限制索引大小
    if (fileIndex.length > 10) {
      fileIndex = fileIndex.slice(0, 10);
    }
    
    // 更新索引
    await env.SYNC_KV.put(indexKey, JSON.stringify(fileIndex));
    console.log(`文件已添加到索引，当前索引包含 ${fileIndex.length} 个文件`);
    return true;
  } catch (err) {
    console.error('更新文件索引失败:', err);
    return false;
  }
}

// 限制文件数量，保留最近的n个文件 - 优化实现
async function limitFileCount(username, limit, env) {
  try {
    // 首先获取文件索引
    const indexKey = `fileindex:${username}`;
    let fileIndex = await env.SYNC_KV.get(indexKey, 'json') || [];
    
    // 如果文件数量未超过限制，无需操作
    if (fileIndex.length <= limit) {
      return;
    }
    
    console.log(`文件数量超限，当前: ${fileIndex.length}, 限制: ${limit}`);
    
    // 按照最近修改时间排序
    fileIndex.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    
    // 需要删除的文件 (保留最近的limit个文件)
    const filesToDelete = fileIndex.slice(limit);
    
    if (filesToDelete.length === 0) return;
    
    // 批量删除操作，减少DeleteKey调用次数
    const deletePromises = [];
    for (const file of filesToDelete) {
      // 删除文件内容
      deletePromises.push(env.SYNC_KV.delete(`file:${username}:${file.id}:content`));
      // 删除文件元数据
      deletePromises.push(env.SYNC_KV.delete(`file:${username}:${file.id}:meta`));
    }
    
    await Promise.all(deletePromises);
    
    // 更新文件索引，只保留保留的文件
    await env.SYNC_KV.put(indexKey, JSON.stringify(fileIndex.slice(0, limit)));
    
    console.log(`已删除 ${filesToDelete.length} 个旧文件，保留 ${limit} 个最新文件`);
  } catch (err) {
    console.error('限制文件数量错误:', err);
  }
}

// 下载文件 - 添加缓存头
export async function downloadFile(fileId, username, env) {
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
    
    // 获取文件内容
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
    
    // 设置适当的响应头并返回文件，增加缓存
    return new Response(fileContent, {
      headers: {
        'Content-Type': metadata.type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(metadata.name)}"`,
        'Cache-Control': 'private, max-age=3600', // 缓存1小时
        'ETag': `"${fileId}-${new Date(metadata.lastModified).getTime()}"` // 添加ETag用于条件请求
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

// 更新文件状态 - 优化实现
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
    
    // 更新最后修改时间
    metadata.lastModified = lastModified;
    metadata.lastSyncDevice = deviceId;
    
    // 并行执行更新操作
    const updatePromises = [
      // 更新文件元数据
      env.SYNC_KV.put(metaKey, JSON.stringify(metadata)),
      
      // 更新文件索引
      updateFileIndexForStatusChange(username, metadata, env)
    ];
    
    await Promise.all(updatePromises);
    
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

// 更新文件索引中的文件状态
async function updateFileIndexForStatusChange(username, metadata, env) {
  const indexKey = `fileindex:${username}`;
  
  try {
    // 获取现有索引
    let fileIndex = await env.SYNC_KV.get(indexKey, 'json') || [];
    
    // 更新文件状态
    const fileIdx = fileIndex.findIndex(file => file.id === metadata.id);
    if (fileIdx >= 0) {
      fileIndex[fileIdx] = {
        id: metadata.id,
        name: metadata.name,
        type: metadata.type,
        size: metadata.size,
        lastModified: metadata.lastModified
      };
      
      // 按最近修改时间排序
      fileIndex.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
      
      // 更新索引
      await env.SYNC_KV.put(indexKey, JSON.stringify(fileIndex));
      console.log(`文件状态已在索引中更新: ${metadata.id}`);
    }
    return true;
  } catch (err) {
    console.error('更新文件索引状态失败:', err);
    return false;
  }
}

// 优化后的消息同步实现
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
    
    // 生成唯一消息ID (如果未提供)
    if (!message.id) {
      message.id = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }
    
    // 添加时间戳 (如果未提供)
    if (!message.timestamp) {
      message.timestamp = new Date().toISOString();
    }
    
    // 准备消息数据
    const messageData = {
      ...message,
      deviceId,
      owner: username
    };
    
    // 获取消息列表键
    const messagesKey = `messages:${username}`;
    
    // 获取现有消息
    let messages = await env.SYNC_KV.get(messagesKey, 'json') || [];
    
    // 添加新消息
    messages.push(messageData);
    
    // 限制消息数量 (50条)
    const MAX_MESSAGES = 50;
    if (messages.length > MAX_MESSAGES) {
      messages = messages.slice(messages.length - MAX_MESSAGES);
    }
    
    // 保存更新后的消息列表 (单次操作)
    await env.SYNC_KV.put(messagesKey, JSON.stringify(messages));
    
    return new Response(JSON.stringify({
      success: true,
      message: messageData
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache' // 确保消息始终是最新的
      }
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

// 获取消息 - 优化实现
export async function getMessages(username, env) {
  try {
    // 直接从合并的消息列表中获取消息
    const messagesKey = `messages:${username}`;
    const messages = await env.SYNC_KV.get(messagesKey, 'json') || [];
    
    // 按时间戳排序
    messages.sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    return new Response(JSON.stringify({
      success: true,
      messages: messages
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=60' // 缓存1分钟
      }
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