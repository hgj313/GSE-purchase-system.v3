// 测试groupKey格式不匹配问题
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
    totalLossRate: 8.33
  }
};

function analyzeKeyMismatch() {
  const { solutions, specificationStats } = testData.optimizationResult;
  
  console.log('🔍 GroupKey格式分析:');
  
  const solutionKeys = Object.keys(solutions);
  const statsKeys = Object.keys(specificationStats);
  
  console.log('Solution keys:', solutionKeys);
  console.log('SpecificationStats keys:', statsKeys);
  
  solutionKeys.forEach(key => {
    console.log(`\n📋 分析 ${key}:`);
    console.log(`  - 在specificationStats中: ${key in specificationStats}`);
    console.log(`  - 完全匹配: ${statsKeys.includes(key)}`);
    
    // 检查格式
    const parts = key.split('_');
    console.log(`  - 格式: ${parts.join(' + ')}`);
  });
  
  // 模拟实际数据流向
  const moduleUsage = {};
  const specStatsData = testData.optimizationResult.specificationStats;
  
  Object.entries(testData.optimizationResult.solutions).forEach(([groupKey, solution]) => {
    solution.cuttingPlans.forEach(plan => {
      if (plan.sourceType === 'module' && plan.moduleType) {
        const specStats = specStatsData[groupKey];
        const utilization = specStats?.utilization?.toFixed(1) || (specStats?.lossRate ? (100 - specStats.lossRate).toFixed(1) : '100.0');
        
        console.log(`\n🔍 实际计算 ${plan.moduleType}:`);
        console.log(`  - groupKey: ${groupKey}`);
        console.log(`  - 找到specStats: ${!!specStats}`);
        console.log(`  - 最终utilization: ${utilization}%`);
        
        if (!specStats) {
          console.log(`  - ⚠️ 使用默认值100%`);
        }
      }
    });
  });
}

analyzeKeyMismatch();