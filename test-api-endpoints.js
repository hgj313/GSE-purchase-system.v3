const fs = require('fs');
const path = require('path');

// 模拟Netlify函数环境
const mockEvent = {
  httpMethod: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    designSteels: [
      { length: 6000, quantity: 10, crossSection: 100 },
      { length: 3000, quantity: 5, crossSection: 100 }
    ],
    moduleSteels: [
      { length: 12000, quantity: 3, crossSection: 100 },
      { length: 8000, quantity: 2, crossSection: 100 }
    ],
    constraints: {
      wasteThreshold: 600,
      targetLossRate: 5,
      timeLimit: 300000,
      maxWeldingSegments: 1
    }
  }),
  path: '/optimize'
};

// 模拟context
const mockContext = {};

async function testLocalAPI() {
  console.log('🚀 开始API端点测试...\n');
  
  // 检查本地文件
  console.log('🧪 开始测试本地API端点...');
  const filesToCheck = [
    'netlify/functions/optimize.js',
    'netlify/functions/task.js',
    'core/optimizer/SteelOptimizerV3.js',
    'core/constraints/ConstraintValidator.js',
    'server/database/Database.js',
    'steel_system.json'
  ];

  filesToCheck.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`📁 ${file} 存在: ${exists}`);
  });

  if (fs.existsSync('steel_system.json')) {
    const stats = fs.statSync('steel_system.json');
    console.log(`📊 数据库文件大小: ${stats.size} 字节`);
  }

  console.log('\n🧪 模拟Netlify函数调用...');
  
  try {
    // 直接导入optimize函数
    const optimizeHandler = require('./netlify/functions/optimize.js').handler;
    
    console.log('📋 约束管理器初始化完成');
    
    // 调用optimize函数
    const response = await optimizeHandler(mockEvent, mockContext);
    
    console.log('📤 发送测试请求...');
    console.log(`📥 响应状态: ${response.statusCode}`);
    console.log(`📥 响应内容: ${response.body}`);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      console.log('✅ 优化任务创建成功:', data.taskId);
      
      // 测试查询任务状态
      console.log('\n🧪 测试任务查询...');
      const taskHandler = require('./netlify/functions/task.js').handler;
      
      const taskEvent = {
        httpMethod: 'GET',
        path: `/task/${data.taskId}`
      };
      
      const taskResponse = await taskHandler(taskEvent, mockContext);
      console.log(`📥 任务查询响应: ${taskResponse.statusCode}`);
      
      if (taskResponse.statusCode === 200) {
        const taskData = JSON.parse(taskResponse.body);
        console.log('✅ 任务状态:', taskData.status);
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('❌ 错误堆栈:', error.stack);
  }
  
  console.log('\n✅ 测试完成');
}

// 运行测试
testLocalAPI().catch(console.error);