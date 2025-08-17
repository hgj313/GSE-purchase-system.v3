// 测试数据结构验证脚本
const fs = require('fs');

// 模拟一个优化结果来验证数据结构
const mockOptimizationResult = {
  solutions: {
    "HRB400_1256": {
      cuttingPlans: [
        {
          sourceType: "module",
          moduleType: "HRB400",
          moduleLength: 12000,
          sourceLength: 12000,
          cuts: [
            { length: 3000, quantity: 2 },
            { length: 2500, quantity: 2 }
          ],
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
  },
  totalLossRate: 8.33,
  totalModuleUsed: 1,
  totalMaterial: 12000,
  totalWaste: 1000,
  totalRealRemainder: 500
};

console.log("=== 数据结构验证 ===");
console.log("specificationStats keys:", Object.keys(mockOptimizationResult.specificationStats));
console.log("HRB400_1256 utilization:", mockOptimizationResult.specificationStats["HRB400_1256"].utilization);
console.log("HRB400_1256 lossRate:", mockOptimizationResult.specificationStats["HRB400_1256"].lossRate);

// 模拟Excel导出逻辑
const moduleUsage = {};
const specificationStats = mockOptimizationResult.specificationStats || {};

if (mockOptimizationResult.solutions) {
  Object.entries(mockOptimizationResult.solutions).forEach(([groupKey, solution]) => {
    if (solution.cuttingPlans) {
      solution.cuttingPlans.forEach(plan => {
        if (plan.sourceType === 'module' && plan.moduleType) {
          const specStats = specificationStats[groupKey];
          const utilization = specStats?.utilization?.toFixed(1) || (specStats?.lossRate ? (100 - specStats.lossRate).toFixed(1) : '100.0');
          
          console.log(`\n规格 ${plan.moduleType} (${groupKey}):`);
          console.log(`- 利用率: ${utilization}%`);
          console.log(`- 损耗率: ${specStats?.lossRate || 0}%`);
          
          if (!moduleUsage[plan.moduleType]) {
            moduleUsage[plan.moduleType] = {
              length: plan.moduleLength || plan.sourceLength,
              count: 0,
              utilization: utilization
            };
          }
          moduleUsage[plan.moduleType].count++;
        }
      });
    }
  });
}

console.log("\n=== 最终moduleUsage ===");
console.log(JSON.stringify(moduleUsage, null, 2));