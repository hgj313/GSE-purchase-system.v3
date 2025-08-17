const axios = require('axios');
const fs = require('fs');

async function testSimplifiedExcelExport() {
  try {
    const testData = {
      optimizationResult: {
        specificationStats: {
          "3000": { length: 3000, moduleLength: 3000, moduleCount: 5 },
          "4000": { length: 4000, moduleLength: 4000, moduleCount: 3 },
          "6000": { length: 6000, moduleLength: 6000, moduleCount: 2 }
        },
        totalLossRate: 5,
        totalModuleUsed: 10,
        totalMaterial: 36000,
        totalWaste: 1800,
        solutions: {}
      },
      exportOptions: { format: "excel" }
    };

    console.log('开始测试简化版Excel导出...');
    
    const response = await axios.post('http://localhost:5000/api/export/excel', testData, {
      responseType: 'arraybuffer',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000
    });

    const filename = 'simplified-export.xlsx';
    fs.writeFileSync(filename, response.data);
    console.log(`简化版Excel导出成功！文件已保存为 ${filename}`);
    
    // 检查文件大小
    const stats = fs.statSync(filename);
    console.log(`文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('简化版Excel导出失败:', error.response ? error.response.data : error.message);
  }
}

testSimplifiedExcelExport();