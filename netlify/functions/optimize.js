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

    // 输入验证 - 添加调试日志
    console.log('🔍 开始输入验证...');
    console.log('设计钢材:', JSON.stringify(designSteels, null, 2));
    console.log('模块钢材:', JSON.stringify(moduleSteels, null, 2));

    if (!designSteels || !Array.isArray(designSteels) || designSteels.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid or empty design steels data' })
      };
    }

    // 验证设计钢材的完整性
    for (let i = 0; i < designSteels.length; i++) {
      const steel = designSteels[i];
      if (!steel.length || steel.length <= 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: `设计钢材${i + 1}：长度必须大于0`,
            details: [{ type: 'invalidDesignLength', message: `设计钢材${i + 1}：长度必须大于0`, steelIndex: i }]
          })
        };
      }
      if (!steel.quantity || steel.quantity <= 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: `设计钢材${i + 1}：数量必须大于0`,
            details: [{ type: 'invalidDesignQuantity', message: `设计钢材${i + 1}：数量必须大于0`, steelIndex: i }]
          })
        };
      }
      
      // 添加默认截面面积（如果没有）
      if (!steel.crossSection || steel.crossSection <= 0) {
        // 根据直径估算截面面积（πr²）
        const diameter = steel.diameter || 25;
        steel.crossSection = Math.round(Math.PI * Math.pow(diameter/2, 2));
        console.log(`设计钢材${i + 1}：自动计算截面面积为${steel.crossSection}`);
      }
    }

    if (!moduleSteels || !Array.isArray(moduleSteels) || moduleSteels.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid or empty module steels data' })
      };
    }

    // 验证模块钢材的完整性
    for (let i = 0; i < moduleSteels.length; i++) {
      const module = moduleSteels[i];
      if (!module.length || module.length <= 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: `模块钢材${i + 1}：长度必须大于0`,
            details: [{ type: 'invalidModuleLength', message: `模块钢材${i + 1}：长度必须大于0`, moduleIndex: i }]
          })
        };
      }
      if (!module.quantity || module.quantity <= 0) {
        module.quantity = 1; // 默认数量
        console.log(`模块钢材${i + 1}：设置默认数量为1`);
      }
    }

    // 约束验证 - 添加调试日志
    console.log('🔍 开始约束验证...');
    console.log('设计钢材:', JSON.stringify(designSteels, null, 2));
    console.log('模块钢材:', JSON.stringify(moduleSteels, null, 2));
    console.log('约束条件:', JSON.stringify(constraints, null, 2));
    
    const validator = new ConstraintValidator();
    const validationResult = validator.validateAllConstraints(designSteels, moduleSteels, constraints);
    
    console.log('验证结果:', validationResult);
    
    if (!validationResult.isValid) {
      const errorDetails = validationResult.violations
        .map(v => `${v.type}: ${v.message}`)
        .join('；');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `约束验证失败 - ${errorDetails}`,
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