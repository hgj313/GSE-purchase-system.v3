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
    const tasks = await Database.getOptimizationTasks();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: tasks.length,
        tasks: tasks,
        version: 'Netlify V3内存版'
      })
    };

  } catch (error) {
    console.error('Get optimization tasks error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to get optimization tasks',
        message: error.message
      })
    };
  }
};