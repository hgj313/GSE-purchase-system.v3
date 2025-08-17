// 测试groupKey匹配问题
console.log("=== GroupKey匹配验证 ===\n");

// 模拟真实数据结构
const mockData = {
  solutions: {
    "HRB400_1256": {
      cuttingPlans: [
        {
          sourceType: "module",
          moduleType: "HRB400",
          moduleLength: 12000,
          sourceLength: 12000,
          cuts: [{ length: 3000, quantity: 2 }, { length: 2500, quantity: 2 }],
          waste: 1000,
          newRemainders: [{ length: 500 }]
        }
      ]
    }
  },
  specificationStats: {
    "HRB400_1256": {
      lossRate: 8.33,
      utilization: 91.67,
      totalMaterial: 12000,
      designLength: 11000,
      waste: 1000,
      realRemainder: 500
    }
  }
};

console.log("1. solutions中的groupKey:", Object.keys(mockData.solutions));
console.log("2. specificationStats中的groupKey:", Object.keys(mockData.specificationStats));

// 测试匹配
Object.entries(mockData.solutions).forEach(([groupKey, solution]) => {
  console.log(`\n3. 测试groupKey: ${groupKey}`);
  console.log(`   - specificationStats中存在: ${!!mockData.specificationStats[groupKey]}`);
  
  if (mockData.specificationStats[groupKey]) {
    const stats = mockData.specificationStats[groupKey];
    console.log(`   - 利用率: ${stats.utilization}%`);
    console.log(`   - 损耗率: ${stats.lossRate}%`);
  }
  
  // 检查切割计划中的moduleType
  if (solution.cuttingPlans) {
    solution.cuttingPlans.forEach((plan, index) => {
      console.log(`   - 切割计划${index}的moduleType: ${plan.moduleType}`);
    });
  }
});

// 验证Excel导出逻辑
console.log("\n=== Excel导出逻辑验证 ===");
const moduleUsage = {};
const specificationStats = mockData.specificationStats || {};

Object.entries(mockData.solutions).forEach(([groupKey, solution]) => {
  if (solution.cuttingPlans) {
    solution.cuttingPlans.forEach(plan => {
      if (plan.sourceType === 'module' && plan.moduleType) {
        const specStats = specificationStats[groupKey];
        const utilization = specStats?.utilization?.toFixed(1) || (specStats?.lossRate ? (100 - specStats.lossRate).toFixed(1) : '100.0');
        
        console.log(`\n规格 ${plan.moduleType} (${groupKey}):`);
        console.log(`- 从specificationStats获取利用率: ${utilization}%`);
        console.log(`- 数据验证: groupKey=${groupKey}, specStats存在=${!!specStats}`);
        
        if (!moduleUsage[plan.moduleType]) {
          moduleUsage[plan.moduleType] = {
            count: 0,
            utilization: utilization
          };
        }
        moduleUsage[plan.moduleType].count++;
      }
    });
  }
});

console.log("\n=== 最终结果 ===");
Object.entries(moduleUsage).forEach(([type, data]) => {
  console.log(`${type}: ${data.count}根, 利用率${data.utilization}%`);
});

console.log("\n✅ GroupKey匹配验证完成！");