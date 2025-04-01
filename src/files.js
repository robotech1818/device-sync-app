// 列出用户的文件
export async function listFiles(username, env) {
  // 使用KV的list前缀功能获取用户的所有文件
  const prefix = `file:${username}:`;
  const fileMetaPrefix = `${prefix}.*:meta`; // 使用.*匹配所有文件ID
  
  try {
    const files = await env.SYNC_KV.list({ prefix: fileMetaPrefix });
    
    // 处理文件列表
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
      error: `获取文件列表失败: ${err.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 处理文件上传
export async function handleFileUpload(request, username, env) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return new Response(JSON.stringify({
        success: false,
        error: '未提供文件'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 检查文件大小限制
    if (file.size > 2 * 1024 * 1024) { // 2MB限制
      return new Response(JSON.stringify({
        success: false,
        error: '文件大小超过2MB限制'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 生成唯一文件ID
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // 存储文件元数据
    const metadata = {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date().toISOString(),
      owner: username
    };
    
    // 读取文件内容并保存到KV
    const fileContent = await file.arrayBuffer();
    
    // 存储文件内容
    await env.SYNC_KV.put(
      `file:${username}:${fileId}:content`,
      fileContent
    );
    
    // 存储文件元数据
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
      error: `文件上传失败: ${err.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 下载文件
export async function downloadFile(fileId, username, env) {
  try {
    // 获取文件元数据
    const metaKey = `file:${username}:${fileId}:meta`;
    const metadata = await env.SYNC_KV.get(metaKey, 'json');
    
    if (!metadata) {
      return new Response(JSON.stringify({
        success: false,
        error: '文件不存在'
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
        error: '文件内容不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 设置适当的响应头并返回文件
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
      error: `文件下载失败: ${err.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 同步文件状态
export async function syncFileStatus(request, username, env) {
  try {
    const { fileId, lastModified, deviceId } = await request.json();
    
    if (!fileId || !lastModified || !deviceId) {
      return new Response(JSON.stringify({
        success: false,
        error: '缺少必要参数'
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
        error: '文件不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 更新最后修改时间
    metadata.lastModified = lastModified;
    metadata.lastSyncDevice = deviceId;
    
    // 保存更新后的元数据
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
      error: `同步文件状态失败: ${err.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
