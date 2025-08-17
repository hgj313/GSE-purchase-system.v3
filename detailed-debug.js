// 详细调试脚本 - 检查groupKey格式和数据流向
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 模拟实际数据
const testData = {
  solutions: {
    "320*320*12-12000mm模数钢材": {
      cuttingPlans: [{
        sourceType: "module",
        moduleType: "320*320*12",
        moduleLength: 12000,
        cuts: [
          { length: 3000, quantity: 4 },
          { length: 2000, quantity: 3 }
        ],
        waste: 600,
        newRemainders: [{ length: 400 }]
      }]
    },
    "[150*5-12000mm模数钢材": {
      cuttingPlans: [{
        sourceType: "module",
        moduleType: "[150*5",
        moduleLength: 12000,
        cuts: [
          { length: 2500, quantity: 4 },
          { length: 1800, quantity: 2 }
        ],
        waste: 400,
        newRemainders: [{ length: 600 }]
      }]
    }
  },
  specificationStats: {
    "320*320*12-12000mm模数钢材": {
      lossRate: 5.0,
      utilization: 95.0,
      totalMaterial: 144000
    },
    "[150*5-12000mm模数钢材": {
      lossRate: 3.3,
      utilization: 96.7,
      totalMaterial: 120000
    }
  },
  totalLossRate: 4.2
};

async function detailedDebug() {
  try {
    console.log('🔍 详细调试开始');
    console.log('📊 测试数据结构:');
    console.log('Solution keys:', Object.keys(testData.solutions));
    console.log('SpecificationStats keys:', Object.keys(testData.specificationStats));
    
    // 保存测试数据到文件
    const testDataPath = path.join(__dirname, 'test-data.json');
    fs.writeFileSync(testDataPath, JSON.stringify(testData, null, 2));
    console.log(`💾 测试数据已保存到: ${testDataPath}`);
    
    // 发送API请求
    console.log('🚀 发送API请求...');
    const response = await axios.post('http://localhost:5000/api/export/excel', {
      optimizationResult: testData,
      exportOptions: {}
    });
    
    console.log('✅ API响应:', response.status);
    console.log('📥 响应大小:', response.data.length, '字节');
    
    // 保存响应到文件
    const outputPath = path.join(__dirname, 'debug-response.xlsx');
    fs.writeFileSync(outputPath, Buffer.from(response.data, 'binary'));
    console.log(`💾 响应已保存到: ${outputPath}`);
    
    console.log('🔍 调试完成，请查看服务器日志获取更多信息');
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
    console.error('📋 错误详情:', error.response?.data || error);
  }
}

detailedDebug();

// 定期检查服务器日志 (运行5次，每次间隔2秒)
let checkCount = 0;
const maxChecks = 5;
const interval = setInterval(() => {
  checkCount++;
  if (checkCount > maxChecks) {
    clearInterval(interval);
    return;
  }
  console.log(`🔄 正在检查服务器日志 (${checkCount}/${maxChecks})`);
  // 在实际环境中，这里会调用check_command_status工具
}, 2000);