const { Database } = require('../../server/database/Database');
const { exportToExcel } = require('../../server/stable');

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
    const { type = 'excel', optimizationResult, exportOptions = {} } = data;

    if (!optimizationResult) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Optimization result is required' })
      };
    }

    let exportData;

    if (type === 'excel') {
      exportData = await exportToExcel(optimizationResult, exportOptions);
    } else if (type === 'pdf') {
      // PDF导出逻辑可以在这里添加
      return {
        statusCode: 501,
        headers,
        body: JSON.stringify({ error: 'PDF export not implemented yet' })
      };
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Unsupported export type' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="steel-optimization-${Date.now()}.xlsx"`
      },
      body: exportData.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('Export error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Export failed',
        message: error.message
      })
    };
  }
};