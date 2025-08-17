const { Database } = require('../../server/database/Database');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const db = new Database();

  try {
    switch (event.httpMethod) {
      case 'GET':
        // 获取任务状态
        const taskId = event.path.split('/').pop();
        if (!taskId) {
          // 获取所有活跃任务
          const activeTasks = await db.query(`
            SELECT * FROM optimization_tasks 
            WHERE status IN ('pending', 'running')
            ORDER BY created_at DESC
          `);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ tasks: activeTasks })
          };
        }

        // 获取特定任务
        const task = await db.query(`
          SELECT * FROM optimization_tasks WHERE id = ?
        `, [taskId]);

        if (task.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Task not found' })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(task[0])
        };

      case 'POST':
        // 创建新任务
        const data = JSON.parse(event.body);
        const { designSteels, constraints, options } = data;

        if (!designSteels || !constraints) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing required data' })
          };
        }

        const newTaskId = Date.now().toString();
        await db.query(`
          INSERT INTO optimization_tasks (id, design_data, constraints, options, status, created_at)
          VALUES (?, ?, ?, ?, 'pending', datetime('now'))
        `, [newTaskId, JSON.stringify(designSteels), JSON.stringify(constraints), JSON.stringify(options)]);

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ taskId: newTaskId, status: 'pending' })
        };

      case 'DELETE':
        // 取消任务
        const cancelTaskId = event.path.split('/').pop();
        await db.query(`
          UPDATE optimization_tasks 
          SET status = 'cancelled', updated_at = datetime('now')
          WHERE id = ? AND status IN ('pending', 'running')
        `, [cancelTaskId]);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Task cancelled' })
        };

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

  } catch (error) {
    console.error('Task error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Task operation failed',
        message: error.message
      })
    };
  }
};