# 优化算法说明

## 1. 概述

本文档详细介绍了钢材优化系统的核心优化算法，包括切割优化、材料利用率最大化和剩余材料管理等功能的实现原理、参数调优和性能分析。

## 2. 优化目标

钢材优化系统的主要目标是：
1. 最大化材料利用率
2. 最小化废料产生
3. 优化切割方案数量
4. 满足生产约束条件
5. 平衡优化质量与计算时间

## 3. 算法类型

系统实现了以下几种优化算法：

### 3.1 标准优化算法
- **名称**: 贪心算法 + 动态规划
- **适用场景**: 常规切割任务，中等规模数据
- **复杂度**: O(n²)
- **优化重点**: 材料利用率

### 3.2 高级优化算法
- **名称**: 遗传算法
- **适用场景**: 复杂切割任务，大规模数据
- **复杂度**: O(n³)，但可通过参数控制
- **优化重点**: 全局最优解

### 3.3 实验性优化算法
- **名称**: 模拟退火算法
- **适用场景**: 特定场景下的精细优化
- **复杂度**: 可控，取决于退火参数
- **优化重点**: 跳出局部最优

## 4. 算法原理

### 4.1 标准优化算法 (贪心 + 动态规划)

#### 4.1.1 核心思想
1. **贪心阶段**: 优先选择利用率最高的切割组合
2. **动态规划阶段**: 对剩余材料进行二次优化
3. **组合阶段**: 合并优化结果，生成最终切割方案

#### 4.1.2 实现步骤
```javascript
function standardOptimization(designSteels, modulusSteels, constraints) {
  // 1. 预处理数据
  const sortedDesigns = sortDesignSteelsByPriority(designSteels, constraints.priority);
  const sortedModulus = sortModulusSteelsByEfficiency(modulusSteels);

  // 2. 贪心匹配
  const initialMatches = greedyMatch(sortedDesigns, sortedModulus);

  // 3. 动态规划优化剩余材料
  const optimizedMatches = dynamicProgrammingOptimization(initialMatches, sortedModulus);

  // 4. 应用约束条件
  const constrainedMatches = applyConstraints(optimizedMatches, constraints);

  // 5. 生成最终方案
  return generateFinalSolution(constrainedMatches);
}
```

### 4.2 高级优化算法 (遗传算法)

#### 4.2.1 核心思想
1. **种群初始化**: 随机生成一组初始切割方案
2. **适应度评估**: 计算每个方案的适应度(材料利用率、废料率等)
3. **选择**: 选择适应度高的方案进行繁殖
4. **交叉**: 组合两个方案的优点生成新方案
5. **变异**: 随机修改方案以保持多样性
6. **迭代**: 重复上述步骤直至收敛

#### 4.2.2 实现步骤
```javascript
function geneticOptimization(designSteels, modulusSteels, constraints) {
  // 1. 初始化种群
  let population = initializePopulation(designSteels, modulusSteels, POPULATION_SIZE);

  // 2. 进化循环
  for (let generation = 0; generation < MAX_GENERATIONS; generation++) {
    // 评估适应度
    const fitnessScores = evaluateFitness(population, constraints);

    // 选择
    const selected = selection(population, fitnessScores);

    // 交叉
    const offspring = crossover(selected);

    // 变异
    mutate(offspring, MUTATION_RATE);

    // 更新种群
    population = replacePopulation(population, offspring, fitnessScores);

    // 检查收敛
    if (isConverged(population, fitnessScores)) break;
  }

  // 3. 返回最优解
  return getBestSolution(population);
}
```

### 4.3 实验性优化算法 (模拟退火)

#### 4.3.1 核心思想
1. **初始解**: 生成一个初始切割方案
2. **温度参数**: 设定初始温度和冷却率
3. **邻域搜索**: 随机修改当前方案生成新方案
4. **接受准则**: 根据能量差和温度决定是否接受新方案
5. **冷却**: 降低温度，重复上述步骤直至温度降至阈值

## 5. 参数调优

### 5.1 标准算法参数
- `priority`: 优化优先级 (efficiency, speed, quality)
- `maxWaste`: 最大允许废料率 (%)
- `minUtilization`: 最小要求利用率 (%)

### 5.2 遗传算法参数
- `populationSize`: 种群大小 (建议: 50-200)
- `maxGenerations`: 最大迭代次数 (建议: 100-500)
- `crossoverRate`: 交叉率 (建议: 0.6-0.9)
- `mutationRate`: 变异率 (建议: 0.01-0.1)
- `elitismCount`: 精英保留数量 (建议: 2-5)

### 5.3 模拟退火参数
- `initialTemperature`: 初始温度 (建议: 100-1000)
- `coolingRate`: 冷却率 (建议: 0.8-0.99)
- `minTemperature`: 最小温度 (建议: 0.1-1)
- `maxIterationsPerTemp`: 每个温度下的最大迭代次数 (建议: 50-200)

## 6. 算法性能分析

### 6.1 时间复杂度比较
| 算法类型 | 时间复杂度 | 数据规模适应性 |
|----------|------------|----------------|
| 标准算法 | O(n²) | 中小规模数据 (n < 1000) |
| 遗传算法 | O(n³) | 中大规模数据 (n < 5000) |
| 模拟退火 | O(n²·k) | 小规模精细优化 (n < 500) |

### 6.2 空间复杂度比较
| 算法类型 | 空间复杂度 | 内存需求 |
|----------|------------|----------|
| 标准算法 | O(n) | 低 |
| 遗传算法 | O(n·p) | 中高 |
| 模拟退火 | O(n) | 中 |

### 6.3 优化效果比较
| 算法类型 | 材料利用率 | 稳定性 | 计算时间 |
|----------|------------|--------|----------|
| 标准算法 | 高 | 高 | 短 |
| 遗传算法 | 最高 | 中 | 长 |
| 模拟退火 | 较高 | 中低 | 中 |

## 7. 算法选择指南

- **小规模数据**: 选择标准算法，速度快且效果好
- **中等规模数据**: 标准算法或遗传算法
- **大规模数据**: 遗传算法，可接受较长计算时间以获得最优解
- **特殊形状材料**: 考虑使用实验性算法
- **时间敏感场景**: 标准算法，设置较低精度要求

## 8. 算法扩展

### 8.1 并行优化
系统支持并行计算优化任务，可通过以下配置启用：
```javascript
// config/default.js
module.exports = {
  optimization: {
    parallel: true,
    maxThreads: 4
  }
};
```

### 8.2 自定义优化策略
1. 创建新的优化器类，继承BaseOptimizer
2. 实现optimize方法
3. 在优化API中注册新优化器

```javascript
// core/optimizer/CustomOptimizer.js
class CustomOptimizer extends BaseOptimizer {
  optimize(designSteels, modulusSteels, constraints) {
    // 实现自定义优化逻辑
    return customSolution;
  }
}

// 注册优化器
OptimizerFactory.register('custom', CustomOptimizer);
```

## 9. 未来改进方向

1. 集成机器学习模型预测最优参数
2. 实现混合优化算法，结合多种算法的优点
3. 开发针对特定行业的专用优化策略
4. 优化算法的可视化与交互调优

---

本算法说明文档将随系统更新而定期维护。如有任何变更，请参考最新版本。