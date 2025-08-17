const { Database } = require('../../server/database/Database');

exports.handler = async (event, context) => {
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
    
    // 获取查询参数
    const limit = parseInt(event.queryStringParameters?.limit || '50');
    const offset = parseInt(event.queryStringParameters?.offset || '0');

    // 获取优化历史
    const history = await db.query(`
      SELECT * FROM optimization_history
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    // 获取总数
    const total = await db.query(`
      SELECT COUNT(*) as count FROM optimization_history
    `);

    const formattedHistory = history.map(item => ({
      id: item.id,
      createdAt: item.created_at,
      designData: JSON.parse(item.design_data || '[]'),
      constraints: JSON.parse(item.constraints || '{}'),
      result: JSON.parse(item.result || '{}')
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        history: formattedHistory,
        pagination: {
          total: total[0].count,
          limit,
          offset
        }
      })
    };

  } catch (error) {
    console.error('History error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to get history',
        message: error.message
      })
    };
  }
};