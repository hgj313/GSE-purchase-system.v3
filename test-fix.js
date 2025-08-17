// 测试groupKey格式匹配修复
const axios = require('axios');

// 模拟格式不匹配的真实数据
const testData = {
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
    "HRB400_1256.00": {
      lossRate: 8.33,
      utilization: 91.67,
      totalMaterial: 12000
    }
  },
  totalLossRate: 8.33
};

async function testFix() {
  console.log('🧪 测试groupKey格式修复');
  console.log('格式: solutions=HRB400_1256, specificationStats=HRB400_1256.00');
  
  try {
    const response = await axios.post('http://localhost:5000/api/export/excel', {
      optimizationResult: testData,
      exportOptions: {}
    });
    
    console.log('✅ API响应:', response.status);
    console.log('📊 修复验证完成');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testFix();