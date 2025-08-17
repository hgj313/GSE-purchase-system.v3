// 最终用户场景测试
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 模拟用户实际数据格式
const userScenarioData = {
  solutions: {
    "320*320*12-12000mm模数钢材": {
      cuttingPlans: [{
        sourceType: "module",
        moduleType: "320*320*12-12000mm模数钢材",
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
        moduleType: "[150*5-12000mm模数钢材",
        moduleLength: 12000,
        cuts: [
          { length: 2500, quantity: 4 },
          { length: 1800, quantity: 2 }
        ],
        waste: 400,
        newRemainders: [{ length: 600 }]
      }]
    },
    "200*150*8-12000mm模数钢材": {
      cuttingPlans: [{
        sourceType: "module",
        moduleType: "200*150*8-12000mm模数钢材",
        moduleLength: 12000,
        cuts: [
          { length: 2400, quantity: 5 }
        ],
        waste: 0,
        newRemainders: [{ length: 0 }]
      }]
    },
    "350*250*10-12000mm模数钢材": {
      cuttingPlans: [{
        sourceType: "module",
        moduleType: "350*250*10-12000mm模数钢材",
        moduleLength: 12000,
        cuts: [
          { length: 2200, quantity: 5 },
          { length: 1000, quantity: 1 }
        ],
        waste: 800,
        newRemainders: [{ length: 0 }]
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
    },
    "200*150*8-12000mm模数钢材": {
      lossRate: 0.0,
      utilization: 100.0,
      totalMaterial: 84000
    },
    "350*250*10-12000mm模数钢材": {
      lossRate: 6.7,
      utilization: 93.3,
      totalMaterial: 132000
    }
  },
  totalLossRate: 3.4475
};

async function runUserScenarioTest() {
  try {
    console.log('🎯 用户场景测试开始');
    
    // 保存测试数据
    const testDataPath = path.join(__dirname, 'user-scenario-data.json');
    fs.writeFileSync(testDataPath, JSON.stringify(userScenarioData, null, 2));
    console.log(`💾 测试数据已保存到: ${testDataPath}`);
    
    // 发送API请求
    console.log('🚀 发送API请求...');
    const response = await axios.post('http://localhost:5000/api/export/excel', {
      optimizationResult: userScenarioData,
      exportOptions: {}
    });
    
    // 保存Excel响应
    const excelPath = path.join(__dirname, 'user-scenario-result.xlsx');
    fs.writeFileSync(excelPath, Buffer.from(response.data, 'binary'));
    console.log(`💾 Excel报告已保存到: ${excelPath}`);
    
    // 显示预期结果
    console.log('\n📊 预期结果:');
    Object.keys(userScenarioData.specificationStats).forEach(key => {
      const stats = userScenarioData.specificationStats[key];
      console.log(`  - ${key}: 利用率 ${stats.utilization}%`);
    });
    console.log(`  - 总计利用率: ${(100 - userScenarioData.totalLossRate).toFixed(1)}%`);
    
    console.log('\n✅ 测试完成，请查看生成的Excel报告和服务器日志');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('📋 错误详情:', error.response?.data || error);
  }
}

runUserScenarioTest();