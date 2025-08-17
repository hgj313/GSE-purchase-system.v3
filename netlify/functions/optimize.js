const { SteelOptimizerV3 } = require('../../core/optimizer/SteelOptimizerV3');
const { ConstraintValidator } = require('../../core/constraints/ConstraintValidator');
const { DatabaseManager } = require('../../server/database/Database');

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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { designSteels, moduleSteels, constraints } = data;

    // 输入验证
    if (!designSteels || !Array.isArray(designSteels) || designSteels.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid or empty design steels data' })
      };
    }

    if (!moduleSteels || !Array.isArray(moduleSteels) || moduleSteels.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid or empty module steels data' })
      };
    }

    // 约束验证
    const validator = new ConstraintValidator();
    const validationResult = validator.validateAllConstraints(designSteels, moduleSteels, constraints);
    
    if (!validationResult.isValid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid constraints', 
          details: validationResult.violations,
          suggestions: validationResult.suggestions
        })
      };
    }

    // 创建数据库管理器
    const db = new DatabaseManager();
    await db.init();

    // 创建优化任务
    const taskId = await db.createOptimizationTask({
      designSteels,
      moduleSteels,
      constraints
    });

    console.log(`✅ 优化任务已创建: ${taskId}`);

    // 异步执行优化任务，不阻塞返回
    setTimeout(async () => {
      try {
        // 更新任务状态为运行中
        await db.updateTaskProgress(taskId, 20, '正在执行优化...');
        await db.updateTaskStatus(taskId, 'running');

        // 执行优化
        const optimizer = new SteelOptimizerV3(designSteels, moduleSteels, constraints);
        const optimizationResult = await optimizer.optimize();
        
        // 设置任务结果
        await db.setTaskResults(taskId, optimizationResult);

        console.log(`✅ 优化完成: ${taskId}`);

      } catch (error) {
        console.error('❌ 优化任务失败:', error);
        
        // 设置任务错误
        await db.setTaskError(taskId, error);
      }
    }, 100);

    // 立即返回任务ID，让客户端通过轮询获取状态
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        taskId: taskId,
        message: '优化任务已创建，请通过taskId查询进度',
        status: 'pending'
      })
    };

  } catch (error) {
    console.error('❌ API错误:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'API Error',
        message: error.message,
        success: false
      })
    };
  }
};