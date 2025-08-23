// 使用Netlify专用内存数据库
const Database = require('./utils/netlify-database');

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
    await Database.init();
    const modulusSteels = await Database.getModulusSteels();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: modulusSteels.length,
        modulusSteels: modulusSteels,
        version: 'Netlify V3内存版'
      })
    };

  } catch (error) {
    console.error('Get modulus steels error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to get modulus steels',
        message: error.message
      })
    };
  }
};