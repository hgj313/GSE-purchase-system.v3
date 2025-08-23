// 使用Netlify专用内存数据库
const Database = require('./utils/netlify-database');

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
    const { taskId, taskData } = data;

    if (!taskId || !taskData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Task ID and task data are required' })
      };
    }

    await Database.init();
    
    // 创建优化任务对象
    const task = {
      id: taskId,
      taskData: taskData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await Database.saveOptimizationTask(task);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        taskId: taskId,
        message: 'Optimization task saved successfully',
        version: 'Netlify V3内存版'
      })
    };

  } catch (error) {
    console.error('Save optimization task error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to save optimization task',
        message: error.message
      })
    };
  }
};