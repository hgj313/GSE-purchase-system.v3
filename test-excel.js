const axios = require('axios');
const fs = require('fs');

async function testExcelExport() {
  try {
    const testData = {
      optimizationResult: {
        specificationStats: {
          "3000": { length: 3000, moduleLength: 3000, moduleCount: 5, utilization: 95 },
          "4000": { length: 4000, moduleLength: 4000, moduleCount: 3, utilization: 92 }
        },
        totalLossRate: 5,
        totalModuleUsed: 8,
        totalMaterial: 24000,
        totalWaste: 1200,
        solutions: {}
      },
      exportOptions: { format: "excel" }
    };

    console.log('开始测试Excel导出...');
    
    const response = await axios.post('http://localhost:5000/api/export/excel', testData, {
      responseType: 'arraybuffer',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000
    });

    fs.writeFileSync('test-export.xlsx', response.data);
    console.log('Excel导出成功！文件已保存为 test-export.xlsx');
    
  } catch (error) {
    console.error('Excel导出失败:', error.response ? error.response.data : error.message);
  }
}

testExcelExport();