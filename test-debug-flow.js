// 测试数据流向的调试脚本
const axios = require('axios');

// 模拟真实优化结果数据
const testData = {
  optimizationResult: {
    solutions: {
      "HRB400_1256": {
        cuttingPlans: [{
          sourceType: "module",
          moduleType: "HRB400",
          moduleLength: 12000,
          cuts: [
            { length: 3000, quantity: 2 },
            { length: 2500, quantity: 2 }
          ],
          waste: 1000,
          newRemainders: [{ length: 500 }]
        }]
      }
    },
    specificationStats: {
      "HRB400_1256": {
        lossRate: 8.33,
        utilization: 91.67,
        totalMaterial: 12000
      }
    },
    totalLossRate: 8.33,
    totalModuleUsed: 1,
    totalMaterial: 12000,
    totalWaste: 1000,
    totalRealRemainder: 500,
    totalPseudoRemainder: 0,
    executionTime: 45
  }
};

async function testDataFlow() {
  try {
    console.log('🧪 开始测试数据流向...');
    console.log('📊 测试数据:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post('http://localhost:5000/api/export/excel', testData);
    
    console.log('✅ 请求成功，响应状态:', response.status);
    console.log('📦 响应大小:', response.data.length, '字节');
    
  } catch (error) {
    console.error('❌ 请求失败:', error.response?.data || error.message);
  }
}

// 检查数据结构
function verifyDataStructure() {
  const { optimizationResult } = testData;
  
  console.log('🔍 数据结构验证:');
  console.log('✅ solutions存在:', !!optimizationResult.solutions);
  console.log('✅ specificationStats存在:', !!optimizationResult.specificationStats);
  
  Object.entries(optimizationResult.solutions).forEach(([groupKey, solution]) => {
    console.log(`📋 规格 ${groupKey}:`);
    console.log(`  - 有cuttingPlans: ${!!solution.cuttingPlans}`);
    console.log(`  - 对应specStats: ${!!optimizationResult.specificationStats[groupKey]}`);
    
    const specStats = optimizationResult.specificationStats[groupKey];
    if (specStats) {
      console.log(`  - utilization: ${specStats.utilization}%`);
      console.log(`  - lossRate: ${specStats.lossRate}%`);
    }
  });
  
  console.log(`📊 总计lossRate: ${optimizationResult.totalLossRate}%`);
  console.log(`📊 预计总计利用率: ${100 - optimizationResult.totalLossRate}%`);
}

// 执行测试
verifyDataStructure();
testDataFlow();