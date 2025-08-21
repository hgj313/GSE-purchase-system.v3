// 使用Netlify云端数据库适配器
const NetlifyDatabase = require('./utils/netlifyDatabase');

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

  // 创建Netlify云端数据库实例
  const db = require('./utils/netlifyDatabase');
  await db.init();

  try {
    switch (event.httpMethod) {
      case 'GET':
        // 获取任务状态
        const taskId = event.path.split('/').pop();
        if (!taskId || taskId === 'task') {
          // 获取所有活跃任务
          const allTasks = db.getOptimizationTasks();
          const activeTasks = allTasks.filter(task => 
            task.status === 'pending' || task.status === 'running'
          ).sort((a, b) => 
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          
          // 转换结果格式以匹配客户端期望
          const formattedTasks = activeTasks.map(formatTaskResponse);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ tasks: formattedTasks })
          };
        }

        // 获取特定任务
        const task = db.getOptimizationTask(taskId);

        if (!task) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ 
              error: 'Task not found',
              success: false
            })
          };
        }

        // 格式化任务响应以匹配客户端期望
        const formattedTask = formatTaskResponse(task);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(formattedTask)
        };

      case 'POST':
        // 创建新任务（保留此端点用于向后兼容）
        const data = JSON.parse(event.body);
        
        // 支持新的参数结构
        const taskData = {
          designSteels: data.designSteels || (data.input_data ? JSON.parse(data.input_data).designSteels : null),
          moduleSteels: data.moduleSteels || (data.input_data ? JSON.parse(data.input_data).moduleSteels : []),
          constraints: data.constraints || (data.input_data ? JSON.parse(data.input_data).constraints : null),
          options: data.options || {}
        };

        if (!taskData.designSteels || !taskData.constraints) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: 'Missing required data',
              success: false
            })
          };
        }

        // 使用DatabaseManager API创建任务
        const newTaskId = await db.createOptimizationTask(taskData);

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            success: true,
            taskId: newTaskId,
            status: 'pending',
            message: '优化任务已创建，请通过taskId查询进度'
          })
        };

      case 'DELETE':
        // 取消任务
        const cancelTaskId = event.path.split('/').pop();
        
        // 获取任务并检查状态
        const taskToCancel = db.getOptimizationTask(cancelTaskId);
        
        if (!taskToCancel || 
            (taskToCancel.status !== 'pending' && taskToCancel.status !== 'running')) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: 'Task cannot be cancelled',
              success: false
            })
          };
        }
        
        // 更新任务状态为取消
        await db.updateTaskStatus(cancelTaskId, 'cancelled', {
          message: '任务已取消'
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Task cancelled'
          })
        };

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({
            error: 'Method not allowed',
            success: false
          })
        };
    }

  } catch (error) {
    console.error('❌ Task error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Task operation failed',
        message: error.message,
        success: false
      })
    };
  }
};

// 格式化任务响应以匹配客户端期望的格式
function formatTaskResponse(task) {
  try {
    // 确保返回的字段与客户端期望的一致
    return {
      id: task.id,
      status: task.status,
      progress: task.progress || 0,
      message: task.message || '',
      // 尝试解析results字段，如果存在且是JSON字符串
      results: task.results ? (typeof task.results === 'string' ? JSON.parse(task.results) : task.results) : null,
      error: task.error || null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    };
  } catch (error) {
    console.error('❌ Error formatting task response:', error);
    // 如果解析失败，返回基础信息
    return {
      id: task.id,
      status: task.status || 'unknown',
      progress: 0,
      message: '任务数据解析失败',
      results: null,
      error: error.message,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    };
  }
}