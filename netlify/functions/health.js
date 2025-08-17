const db = require('./utils/netlifyDatabase');

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
    // 测试Netlify云端数据库连接
    const dbInitialized = await db.init();
    
    if (!dbInitialized) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({
          status: 'error',
          message: '云端数据库初始化失败',
          database: 'failed',
          timestamp: new Date().toISOString()
        })
      };
    }

    // 获取数据库统计信息
    const stats = db.getStats();
    
    const healthInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.7.0',
      services: {
        database: 'connected',
        api: 'running'
      },
      stats: stats,
      environment: process.env.NODE_ENV || 'production',
      endpoints: [
        'GET /.netlify/functions/health',
        'POST /.netlify/functions/optimize',
        'POST /.netlify/functions/validate-constraints',
        'POST /.netlify/functions/upload-design-steels',
        'GET /.netlify/functions/optimize/:id/progress',
        'GET /.netlify/functions/optimize/history',
        'POST /.netlify/functions/export/excel',
        'POST /.netlify/functions/export/pdf'
      ]
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(healthInfo)
    };
  } catch (error) {
    console.error('❌ 云端健康检查失败:', error);
    
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        message: '云端服务异常'
      })
    };
  }
};