const { Database } = require('../../server/database/Database');

exports.handler = async (event, context) => {
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { fileName, content, type } = data;

    if (!fileName || !content) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'File name and content are required' })
      };
    }

    let designSteels = [];

    // 根据文件类型解析内容
    if (type === 'csv' || fileName.endsWith('.csv')) {
      // 解析CSV内容
      const lines = content.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const steel = {};
        headers.forEach((header, index) => {
          if (values[index]) {
            steel[header] = isNaN(values[index]) ? values[index] : parseFloat(values[index]);
          }
        });
        designSteels.push(steel);
      }
    } else if (type === 'json' || fileName.endsWith('.json')) {
      // 解析JSON内容
      designSteels = JSON.parse(content);
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Unsupported file type' })
      };
    }

    // 验证数据结构
    if (!Array.isArray(designSteels)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid data format' })
      };
    }

    // 保存上传记录
    try {
      const db = new Database();
      await db.query(`
        INSERT INTO file_uploads (file_name, file_type, content, uploaded_at)
        VALUES (?, ?, ?, datetime('now'))
      `, [fileName, type, JSON.stringify(designSteels)]);
    } catch (dbError) {
      console.warn('Failed to save upload record:', dbError);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        fileName,
        count: designSteels.length,
        data: designSteels
      })
    };

  } catch (error) {
    console.error('File upload error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'File upload failed',
        message: error.message
      })
    };
  }
};