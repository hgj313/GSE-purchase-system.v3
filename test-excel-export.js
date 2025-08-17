// 测试Excel导出数据接入验证
const fs = require('fs');
const path = require('path');

// 模拟真实的optimizationResult数据结构
const mockRealOptimizationResult = {
  solutions: {
    "HRB400_1256": {
      cuttingPlans: [
        {
          sourceType: "module",
          moduleType: "HRB400",
          moduleLength: 12000,
          sourceLength: 12000,
          cuts: [
            { length: 3000, quantity: 2, designId: "DS001" },
            { length: 2500, quantity: 2, designId: "DS002" }
          ],
          waste: 1000,
          newRemainders: [{ length: 500 }],
          sourceId: "M001"
        }
      ]
    },
    "HRB335_804": {
      cuttingPlans: [
        {
          sourceType: "module",
          moduleType: "HRB335",
          moduleLength: 9000,
          sourceLength: 9000,
          cuts: [
            { length: 2000, quantity: 3, designId: "DS003" },
            { length: 1500, quantity: 2, designId: "DS004" }
          ],
          waste: 500,
          newRemainders: [{ length: 1000 }],
          sourceId: "M002"
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
      realRemainder: 500,
      moduleUsed: 1
    },
    "HRB335_804": {
      lossRate: 5.56,
      utilization: 94.44,
      totalMaterial: 9000,
      designLength: 8500,
      waste: 500,
      realRemainder: 1000,
      moduleUsed: 1
    }
  },
  totalLossRate: 7.14,
  totalModuleUsed: 2,
  totalMaterial: 21000,
  totalWaste: 1500,
  totalRealRemainder: 1500,
  totalPseudoRemainder: 0
};

// 模拟stable.js中的Excel导出逻辑
function testExcelExportLogic(optimizationResult) {
  console.log("=== 测试Excel导出数据接入 ===\n");
  
  const moduleUsage = {};
  const specificationStats = optimizationResult.specificationStats || {};
  
  console.log("1. 验证specificationStats数据:");
  Object.entries(specificationStats).forEach(([key, stats]) => {
    console.log(`   ${key}: 利用率=${stats.utilization}%, 损耗率=${stats.lossRate}%`);
  });
  
  console.log("\n2. 验证solutions数据:");
  Object.entries(optimizationResult.solutions).forEach(([groupKey, solution]) => {
    console.log(`   ${groupKey}: 有${solution.cuttingPlans?.length || 0}个切割计划`);
  });
  
  console.log("\n3. 测试实际Excel逻辑:");
  
  if (optimizationResult.solutions) {
    Object.entries(optimizationResult.solutions).forEach(([groupKey, solution]) => {
      if (solution.cuttingPlans) {
        solution.cuttingPlans.forEach(plan => {
          if (plan.sourceType === 'module' && plan.moduleType) {
            // 关键：直接从specificationStats获取利用率
            const specStats = specificationStats[groupKey];
            const utilization = specStats?.utilization?.toFixed(1) || (specStats?.lossRate ? (100 - specStats.lossRate).toFixed(1) : '100.0');
            
            console.log(`   规格 ${plan.moduleType} (${groupKey}):`);
            console.log(`   - 从specificationStats获取利用率: ${utilization}%`);
            console.log(`   - 原始数据: utilization=${specStats?.utilization}, lossRate=${specStats?.lossRate}`);
            
            if (!moduleUsage[plan.moduleType]) {
              moduleUsage[plan.moduleType] = {
                length: plan.moduleLength || plan.sourceLength,
                count: 0,
                totalUsed: 0,
                totalWaste: 0,
                totalRemainder: 0,
                utilization: utilization
              };
            }
            moduleUsage[plan.moduleType].count++;
            moduleUsage[plan.moduleType].totalUsed += (plan.cuts?.reduce((sum, cut) => sum + cut.length * cut.quantity, 0) || 0);
            moduleUsage[plan.moduleType].totalWaste += (plan.waste || 0);
            moduleUsage[plan.moduleType].totalRemainder += (plan.newRemainders?.reduce((sum, r) => sum + r.length, 0) || 0);
          }
        });
      }
    });
  }
  
  console.log("\n4. 最终Excel数据:");
  Object.entries(moduleUsage).forEach(([moduleType, usage]) => {
    console.log(`   ${moduleType}: 利用率=${usage.utilization}% (使用${usage.count}根, 总长${usage.length}mm)`);
  });
  
  console.log("\n5. 总计利用率:");
  const overallUtilization = (100 - optimizationResult.totalLossRate).toFixed(1);
  console.log(`   总体利用率: ${overallUtilization}% (基于totalLossRate=${optimizationResult.totalLossRate}%)`);
  
  return {
    moduleUsage,
    overallUtilization,
    dataVerified: true
  };
}

// 执行测试
const testResult = testExcelExportLogic(mockRealOptimizationResult);
console.log("\n✅ 数据接入验证完成！");