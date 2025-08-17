const { Database } = require('../../server/database/Database');

exports.handler = async (event, context) => {
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const db = new Database();
    
    // 获取统计信息
    const optimizationCount = await db.query(`
      SELECT COUNT(*) as count FROM optimization_history
    `);
    
    const fileUploadCount = await db.query(`
      SELECT COUNT(*) as count FROM file_uploads
    `);
    
    const recentOptimizations = await db.query(`
      SELECT * FROM optimization_history 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    const stats = {
      totalOptimizations: optimizationCount[0].count,
      totalFileUploads: fileUploadCount[0].count,
      recentOptimizations: recentOptimizations.map(opt => ({
        id: opt.id,
        createdAt: opt.created_at,
        designData: JSON.parse(opt.design_data),
        result: JSON.parse(opt.result)
      })),
      systemInfo: {
        version: '3.0.0',
        timestamp: new Date().toISOString()
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(stats)
    };

  } catch (error) {
    console.error('Stats error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to get stats',
        message: error.message
      })
    };
  }
};