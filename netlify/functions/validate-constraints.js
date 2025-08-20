const ConstraintValidator = require('../../core/constraints/ConstraintValidator');

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
    const { constraints } = data;

    if (!constraints) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Constraints data is required' })
      };
    }

    const validator = new ConstraintValidator();
    const result = validator.validateAllConstraints([], [], constraints);
    if (!result.isValid) {
      const errorDetails = result.violations
        .map(v => `${v.type}: ${v.message}`)
        .join('；');
      throw new Error(`约束验证失败 - ${errorDetails}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Constraint validation error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Constraint validation failed',
        message: error.message
      })
    };
  }
};