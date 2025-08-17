const { Database } = require('../../server/database/Database');
const XLSX = require('xlsx');

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
    const { fileName, content, type } = data;

    if (!fileName || !content) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'File name and content are required' })
      };
    }

    let designSteels = [];

    // 对于所有文件类型，content是base64编码的内容，需要先解码
    let fileBuffer;
    try {
      fileBuffer = Buffer.from(content, 'base64');
    } catch (decodeError) {
      console.error('Base64解码失败:', decodeError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '文件内容解析失败: 无效的base64编码' })
      };
    }

    // 根据文件类型解析内容
    if (type === 'csv' || fileName.endsWith('.csv')) {
      // 解析CSV内容
      try {
        const csvContent = fileBuffer.toString('utf8');
        const lines = csvContent.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const steel = {};
          headers.forEach((header, index) => {
            if (values[index]) {
              steel[header] = isNaN(values[index]) ? values[index] : parseFloat(values[index]);
            }
          });
          designSteels.push(steel);
        }
      } catch (csvError) {
        console.error('CSV解析失败:', csvError);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'CSV文件解析失败' })
        };
      }
    } else if (type === 'json' || fileName.endsWith('.json')) {
      // 解析JSON内容
      try {
        const jsonContent = fileBuffer.toString('utf8');
        designSteels = JSON.parse(jsonContent);
      } catch (jsonError) {
        console.error('JSON解析失败:', jsonError);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'JSON文件解析失败' })
        };
      }
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || 
               type.includes('excel') || type.includes('spreadsheet')) {
      // 解析Excel文件内容
      try {
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // 转换为JSON格式
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // V2完整数据转换逻辑 - 支持8个核心字段
        designSteels = jsonData.map((row, index) => {
          const steel = {
            id: `design_${Date.now()}_${index}`,
            length: parseFloat(row['长度'] || row['长度(mm)'] || row['Length'] || row['length'] || 
                              row['长度 (mm)'] || row['长度（mm）'] || row['长度mm'] || 0),
            quantity: parseInt(row['数量'] || row['数量(件)'] || row['Quantity'] || row['quantity'] || 
                              row['件数'] || row['数量（件）'] || 0),
            crossSection: parseFloat(row['截面面积'] || row['截面面积(mm²)'] || row['截面面积（mm²）'] || 
                                    row['面积'] || row['CrossSection'] || row['crossSection'] || 100),
            componentNumber: row['构件编号'] || row['构件号'] || row['ComponentNumber'] || 
                            row['componentNumber'] || row['编号'] || `GJ${String(index + 1).padStart(3, '0')}`,
            specification: row['规格'] || row['Specification'] || row['specification'] || 
                          row['型号'] || row['钢材规格'] || '',
            partNumber: row['部件编号'] || row['部件号'] || row['PartNumber'] || 
                       row['partNumber'] || row['零件号'] || `BJ${String(index + 1).padStart(3, '0')}`,
            material: row['材质'] || row['Material'] || row['material'] || 
                     row['钢材材质'] || row['材料'] || '',
            note: row['备注'] || row['Note'] || row['note'] || 
                 row['说明'] || row['备注说明'] || ''
          };
          return steel;
        }).filter(steel => steel.length > 0 && steel.quantity > 0);
      } catch (excelError) {
        console.error('Excel解析失败:', excelError);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Excel文件解析失败' })
        };
      }
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Unsupported file type' })
      };
    }

    // 验证数据结构
    if (!Array.isArray(designSteels)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid data format' })
      };
    }

    // 保存上传记录
    try {
      const db = new Database();
      await db.query(`
        INSERT INTO file_uploads (file_name, file_type, content, uploaded_at)
        VALUES (?, ?, ?, datetime('now'))
      `, [fileName, type, JSON.stringify(designSteels)]);
    } catch (dbError) {
      console.warn('Failed to save upload record:', dbError);
    }

    // 计算统计信息
    const crossSectionStats = {
      无截面面积: designSteels.filter(s => s.crossSection === 0 || !s.crossSection).length
    };
    
    const specificationStats = {};
    designSteels.forEach(steel => {
      if (steel.specification) {
        specificationStats[steel.specification] = (specificationStats[steel.specification] || 0) + 1;
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        fileName,
        count: designSteels.length,
        designSteels: designSteels,  // 客户端期望的字段名
        debugInfo: {
          原始行数: designSteels.length,
          有效数据: designSteels.length,
          截面面积统计: crossSectionStats,
          规格统计: specificationStats,
          版本信息: 'Netlify V3增强版'
        }
      })
    };

  } catch (error) {
    console.error('File upload error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'File upload failed',
        message: error.message
      })
    };
  }
};