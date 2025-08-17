// 模拟用户实际使用场景，检查groupKey格式问题
const axios = require('axios');

// 模拟用户上传设计后的数据结构
const userData = {
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
    // 注意：这里可能格式不匹配
    "HRB400_1256.00": {
      lossRate: 8.33,
      utilization: 91.67,
      totalMaterial: 12000
    }
  },
  totalLossRate: 8.33
};

// 正确格式数据
const correctData = {
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
  totalLossRate: 8.33
};

function analyzeKeyMismatch() {
  console.log('🔍 分析用户场景中的groupKey格式问题');
  
  // 检查格式不匹配的情况
  const solutionKeys = Object.keys(userData.solutions);
  const statsKeys = Object.keys(userData.specificationStats);
  
  console.log('\n❌ 格式不匹配场景:');
  console.log('Solution keys:', solutionKeys);
  console.log('SpecificationStats keys:', statsKeys);
  
  solutionKeys.forEach(key => {
    const specStats = userData.specificationStats[key];
    console.log(`\n规格 ${key}:`);
    console.log(`  - 找到统计数据: ${!!specStats}`);
    console.log(`  - 将使用默认值: ${!specStats ? '100.0%' : '实际值'}`);
    
    if (!specStats) {
      console.log(`  - ⚠️ 格式不匹配！`);
      console.log(`  - 期望: ${key}`);
      console.log(`  - 实际: ${statsKeys.join(', ')}`);
    }
  });
  
  console.log('\n✅ 正确格式场景:');
  const correctSolutionKeys = Object.keys(correctData.solutions);
  const correctStatsKeys = Object.keys(correctData.specificationStats);
  
  console.log('Solution keys:', correctSolutionKeys);
  console.log('SpecificationStats keys:', correctStatsKeys);
  
  correctSolutionKeys.forEach(key => {
    const specStats = correctData.specificationStats[key];
    console.log(`\n规格 ${key}:`);
    console.log(`  - 找到统计数据: ${!!specStats}`);
    console.log(`  - 利用率: ${specStats?.utilization || 100}%`);
  });
}

async function testAPI() {
  console.log('\n🚀 测试API处理格式不匹配...');
  
  try {
    const response = await axios.post('http://localhost:5000/api/export/excel', {
      optimizationResult: userData,
      exportOptions: {}
    });
    
    console.log('✅ API响应:', response.status);
    console.log('⚠️  注意：由于格式不匹配，各规格可能显示100%');
    
  } catch (error) {
    console.error('❌ API调用失败:', error.message);
  }
}

// 运行分析
analyzeKeyMismatch();
testAPI();