const { Database } = require('../../server/database/Database');

exports.handler = async (event, context) => {
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const db = new Database();
    
    // 检查数据库连接
    await db.query('SELECT 1');
    
    const healthInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '3.0.0',
      services: {
        database: 'connected',
        api: 'running'
      },
      endpoints: [
        'GET /api/health',
        'POST /api/optimize',
        'POST /api/validate-constraints',
        'POST /api/upload-design-steels',
        'GET /api/optimize/:id/progress',
        'GET /api/optimize/history',
        'POST /api/export/excel',
        'POST /api/export/pdf'
      ]
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(healthInfo)
    };
  } catch (error) {
    console.error('Health check failed:', error);
    
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      })
    };
  }
};