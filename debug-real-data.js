// 检查真实数据中的groupKey格式问题
const axios = require('axios');

async function debugRealData() {
  try {
    // 模拟真实优化数据
    const realData = {
      solutions: {
        "HRB400_3200": {
          cuttingPlans: [{
            sourceType: "module",
            moduleType: "HRB400",
            moduleLength: 12000,
            cuts: [
              { length: 3000, quantity: 2 },
              { length: 2000, quantity: 3 }
            ],
            waste: 0,
            newRemainders: [{ length: 0 }]
          }]
        },
        "HRB400_2500": {
          cuttingPlans: [{
            sourceType: "module",
            moduleType: "HRB400",
            moduleLength: 12000,
            cuts: [
              { length: 2500, quantity: 4 },
              { length: 2000, quantity: 1 }
            ],
            waste: 0,
            newRemainders: [{ length: 0 }]
          }]
        }
      },
      specificationStats: {
        "HRB400_3200": {
          lossRate: 0.0,
          utilization: 100.0,
          totalMaterial: 12000
        },
        "HRB400_2500": {
          lossRate: 0.0,
          utilization: 100.0,
          totalMaterial: 12000
        }
      },
      totalLossRate: 0.0
    };

    console.log('🔍 真实数据格式分析:');
    
    const solutionKeys = Object.keys(realData.solutions);
    const statsKeys = Object.keys(realData.specificationStats);
    
    console.log('Solution keys:', solutionKeys);
    console.log('SpecificationStats keys:', statsKeys);
    
    // 检查每个规格的数据流向
    solutionKeys.forEach(key => {
      const specStats = realData.specificationStats[key];
      const utilization = specStats?.utilization?.toFixed(1) || (specStats?.lossRate ? (100 - specStats.lossRate).toFixed(1) : '100.0');
      
      console.log(`\n📊 规格 ${key}:`);
      console.log(`  - 找到统计数据: ${!!specStats}`);
      console.log(`  - 利用率: ${utilization}%`);
      console.log(`  - 损耗率: ${specStats?.lossRate || 'N/A'}%`);
    });

    // 测试API调用
    console.log('\n🚀 测试API调用...');
    const response = await axios.post('http://localhost:5000/api/export/excel', {
      optimizationResult: realData,
      exportOptions: {}
    });
    
    console.log('✅ API响应:', response.status);
    console.log('📊 数据验证完成');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

debugRealData();