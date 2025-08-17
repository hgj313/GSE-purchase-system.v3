const { SteelOptimizerV3 } = require('../../core/optimizer/SteelOptimizerV3');
const { ConstraintValidator } = require('../../core/constraints/ConstraintValidator');
const { Database } = require('../../server/database/Database');

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
    const { designSteels, constraints, options = {} } = data;

    if (!designSteels || !Array.isArray(designSteels)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid design steels data' })
      };
    }

    // 验证约束条件
    const validator = new ConstraintValidator();
    const validationResult = validator.validateConstraints(constraints);
    
    if (!validationResult.isValid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid constraints', 
          details: validationResult.errors 
        })
      };
    }

    // 执行优化
    const optimizer = new SteelOptimizerV3();
    const result = await optimizer.optimize(designSteels, constraints, options);

    // 保存优化历史
    try {
      const db = new Database();
      await db.query(`
        INSERT INTO optimization_history (design_data, constraints, result, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `, [JSON.stringify(designSteels), JSON.stringify(constraints), JSON.stringify(result)]);
    } catch (dbError) {
      console.warn('Failed to save optimization history:', dbError);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Optimization error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Optimization failed',
        message: error.message
      })
    };
  }
};