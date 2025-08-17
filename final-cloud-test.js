/**
 * 最终云端API测试脚本
 * 验证所有修复是否正确部署到Netlify
 */

const https = require('https');

// 云端API端点
const CLOUD_BASE_URL = 'https://deluxe-heliotrope-cc6c08.netlify.app';

const endpoints = {
  health: '/.netlify/functions/health',
  optimize: '/.netlify/functions/optimize',
  constraints: '/.netlify/functions/validate-constraints',
  stats: '/.netlify/functions/stats'
};

console.log('🚀 开始最终云端API验证测试...');
console.log('📍 云端地址:', CLOUD_BASE_URL);

// 测试数据
const testData = {
  designSteels: [
    { length: 6000, quantity: 10, crossSection: 100 },
    { length: 3000, quantity: 5, crossSection: 100 }
  ],
  moduleSteels: [
    { length: 12000, quantity: 3, crossSection: 100 },
    { length: 9000, quantity: 2, crossSection: 100 }
  ],
  constraints: {
    wasteThreshold: 600,
    targetLossRate: 5,
    timeLimit: 300000,
    maxWeldingSegments: 1
  }
};

// 测试健康检查
async function testHealth() {
  console.log('\n🔍 1. 测试健康检查API...');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'deluxe-heliotrope-cc6c08.netlify.app',
      path: endpoints.health,
      method: 'GET',
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ 健康检查响应:', response.status);
          
          if (response.status === 'healthy') {
            console.log('🎉 云端服务运行正常！');
            console.log('📊 数据库统计:', response.stats);
          } else {
            console.log('⚠️ 服务状态:', response);
          }
          
          resolve(response);
        } catch (e) {
          console.log('❌ 响应解析失败:', e.message);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ 健康检查请求失败:', error.message);
      resolve(null);
    });

    req.on('timeout', () => {
      console.log('⏰ 健康检查超时');
      req.destroy();
      resolve(null);
    });

    req.end();
  });
}

// 测试优化API
async function testOptimization() {
  console.log('\n🔍 2. 测试优化API...');
  
  return new Promise((resolve) => {
    const postData = JSON.stringify(testData);
    
    const options = {
      hostname: 'deluxe-heliotrope-cc6c08.netlify.app',
      path: endpoints.optimize,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ 优化API响应状态:', res.statusCode);
          console.log('📄 响应内容:', JSON.stringify(response, null, 2));
          
          if (response.success) {
            console.log('🎉 优化任务创建成功！');
            console.log('📋 任务ID:', response.taskId);
          } else {
            console.log('⚠️ 优化API错误:', response.error);
            if (response.details) {
              console.log('🔍 约束验证详情:', response.details);
            }
          }
          
          resolve(response);
        } catch (e) {
          console.log('❌ 响应解析失败:', e.message);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ 优化API请求失败:', error.message);
      resolve(null);
    });

    req.on('timeout', () => {
      console.log('⏰ 优化API超时');
      req.destroy();
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

// 测试约束验证
async function testConstraints() {
  console.log('\n🔍 3. 测试约束验证API...');
  
  return new Promise((resolve) => {
    const postData = JSON.stringify(testData);
    
    const options = {
      hostname: 'deluxe-heliotrope-cc6c08.netlify.app',
      path: endpoints.constraints,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ 约束验证响应状态:', res.statusCode);
          console.log('📄 验证结果:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (e) {
          console.log('❌ 响应解析失败:', e.message);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ 约束验证请求失败:', error.message);
      resolve(null);
    });

    req.end();
  });
}

// 运行完整测试
async function runFullTest() {
  console.log('🎯 开始完整云端验证测试...');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: {}
  };
  
  // 测试健康检查
  results.tests.health = await testHealth();
  
  // 测试优化API
  results.tests.optimize = await testOptimization();
  
  // 测试约束验证
  results.tests.constraints = await testConstraints();
  
  // 生成测试报告
  console.log('\n📊 最终测试报告:');
  console.log('==================');
  
  const passedTests = Object.values(results.tests).filter(r => r && 
    (r.status === 'healthy' || r.success === true)).length;
  
  console.log(`✅ 通过测试: ${passedTests}/3`);
  console.log(`📋 详细结果: ${JSON.stringify(results, null, 2)}`);
  
  // 保存测试报告
  fs.writeFileSync('final-cloud-test-report.json', JSON.stringify(results, null, 2));
  console.log('\n📄 完整测试报告已保存: final-cloud-test-report.json');
  
  if (passedTests === 3) {
    console.log('\n🎉 所有云端测试通过！系统已完全修复！');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查部署状态');
  }
}

// 执行测试
const fs = require('fs');
runFullTest().catch(console.error);