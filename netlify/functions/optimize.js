const SteelOptimizerV3 = require('../../core/optimizer/SteelOptimizerV3');
const ConstraintValidator = require('../../core/constraints/ConstraintValidator');
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

    // 创建Netlify云端数据库管理器
    const db = require('./utils/netlifyDatabase');
    const dbInitialized = await db.init();
    if (!dbInitialized) {
      console.error('❌ 云端数据库初始化失败');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Cloud database initialization failed',
          message: '云端数据库初始化失败，请稍后再试'
        })
      };
    }

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
        console.log(`🚀 开始异步执行优化任务: ${taskId}`);
        
        // 更新任务状态为运行中
        const progressUpdated = await db.updateTaskProgress(taskId, 20, '正在执行优化...');
        if (!progressUpdated) {
          console.error(`❌ 无法更新任务进度: ${taskId}`);
        }
        
        const statusUpdated = await db.updateTaskStatus(taskId, 'running');
        if (!statusUpdated) {
          console.error(`❌ 无法更新任务状态: ${taskId}`);
        }

        // 执行优化
        console.log(`🔍 开始执行优化算法: ${taskId}`);
        const optimizer = new SteelOptimizerV3(designSteels, moduleSteels, constraints);
        const optimizationResult = await optimizer.optimize();
        
        console.log(`📊 优化结果: ${taskId}, success: ${optimizationResult.success}`);
        
        // 设置任务结果
        const resultsSet = await db.setTaskResults(taskId, optimizationResult);
        if (resultsSet) {
          console.log(`✅ 优化完成并保存结果: ${taskId}`);
        } else {
          console.error(`❌ 无法保存优化结果: ${taskId}`);
        }

      } catch (error) {
        console.error('❌ 优化任务执行异常:', error);
        console.error('❌ 错误堆栈:', error.stack);
        
        // 设置任务错误 - 添加重试逻辑
        try {
          await db.setTaskError(taskId, {
            message: error.message || '优化过程中发生未知错误',
            stack: error.stack || '',
            timestamp: new Date().toISOString()
          });
          console.log(`📝 已记录任务错误: ${taskId}`);
        } catch (dbError) {
          console.error('❌ 无法记录任务错误:', dbError);
        }
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