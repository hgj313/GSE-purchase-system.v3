#!/usr/bin/env node
/**
 * GitHub部署验证脚本
 * 用于验证GitHub仓库部署到Netlify后的云端优化器功能
 */

const axios = require('axios');

// 配置您的GitHub Pages + Netlify域名
const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'https://your-username.github.io';
const NETLIFY_FUNCTIONS_URL = process.env.NETLIFY_URL || 'https://your-site.netlify.app';

// 测试数据
const testData = {
  designSteels: [
    { length: 3000, quantity: 10, crossSection: 491 },
    { length: 4500, quantity: 5, crossSection: 314 }
  ],
  moduleSteels: [
    { length: 12000, quantity: 5 },
    { length: 9000, quantity: 3 }
  ],
  constraints: {
    wasteThreshold: 600,
    targetLossRate: 5,
    timeLimit: 30000,
    maxWeldingSegments: 2
  }
};

class GitHubDeploymentVerifier {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      details: []
    };
  }

  async testEndpoint(name, url, method = 'GET', data = null) {
    this.results.total++;
    try {
      const config = {
        method,
        url,
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (data && method === 'POST') {
        config.data = data;
      }

      const response = await axios(config);
      this.results.passed++;
      this.results.details.push({
        name,
        status: '✅ PASS',
        statusCode: response.status,
        data: response.data
      });
      return response.data;
    } catch (error) {
      this.results.failed++;
      this.results.details.push({
        name,
        status: '❌ FAIL',
        error: error.message,
        response: error.response?.data
      });
      return null;
    }
  }

  async verifyDeployment() {
    console.log('🚀 开始GitHub部署验证...\n');
    
    const urlsToTest = [
      {
        name: '健康检查',
        url: `${this.baseUrl}/.netlify/functions/health`
      },
      {
        name: '约束验证',
        url: `${this.baseUrl}/.netlify/functions/validate-constraints`,
        method: 'POST',
        data: { constraints: testData.constraints }
      },
      {
        name: '优化任务创建',
        url: `${this.baseUrl}/.netlify/functions/optimize`,
        method: 'POST',
        data: testData
      },
      {
        name: '任务历史',
        url: `${this.baseUrl}/.netlify/functions/history`
      }
    ];

    // 并行测试所有端点
    const promises = urlsToTest.map(test => 
      this.testEndpoint(test.name, test.url, test.method, test.data)
    );

    await Promise.all(promises);

    // 输出结果
    console.log('\n📊 测试结果汇总:');
    console.log(`总测试: ${this.results.total}`);
    console.log(`通过: ${this.results.passed}`);
    console.log(`失败: ${this.results.failed}`);

    this.results.details.forEach(detail => {
      console.log(`\n${detail.name}: ${detail.status}`);
      if (detail.error) {
        console.log(`  错误: ${detail.error}`);
      }
      if (detail.data) {
        console.log(`  响应: ${JSON.stringify(detail.data).substring(0, 200)}...`);
      }
    });

    return this.results.failed === 0;
  }

  async verifyTaskLifecycle() {
    console.log('\n🔄 验证任务生命周期...');
    
    try {
      // 1. 创建任务
      const createResponse = await axios.post(
        `${this.baseUrl}/.netlify/functions/optimize`,
        testData
      );
      
      if (!createResponse.data.taskId) {
        console.log('❌ 无法创建任务');
        return false;
      }

      const taskId = createResponse.data.taskId;
      console.log(`✅ 任务创建成功: ${taskId}`);

      // 2. 轮询任务状态
      let attempts = 0;
      const maxAttempts = 15;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await axios.get(
          `${this.baseUrl}/.netlify/functions/task?id=${taskId}`
        );
        
        const status = statusResponse.data.status;
        console.log(`📊 任务状态: ${status} (第${attempts + 1}次查询)`);
        
        if (status === 'completed') {
          console.log('✅ 任务完成验证通过');
          return true;
        } else if (status === 'failed') {
          console.log('❌ 任务失败');
          return false;
        }
        
        attempts++;
      }
      
      console.log('⏱️ 任务超时');
      return false;
    } catch (error) {
      console.log('❌ 任务生命周期验证失败:', error.message);
      return false;
    }
  }
}

// 主函数
async function main() {
  console.log('🔍 GitHub部署验证器\n');
  
  // 使用环境变量或默认值
  const baseUrls = [
    process.env.NETLIFY_URL,
    process.env.GITHUB_PAGES_URL,
    'https://your-site.netlify.app',
    'http://localhost:8888'
  ].filter(Boolean);

  let success = false;
  
  for (const baseUrl of baseUrls) {
    console.log(`\n🌐 测试URL: ${baseUrl}`);
    const verifier = new GitHubDeploymentVerifier(baseUrl);
    
    const basicTest = await verifier.verifyDeployment();
    if (basicTest) {
      const lifecycleTest = await verifier.verifyTaskLifecycle();
      success = lifecycleTest;
      
      if (success) {
        console.log('\n🎉 所有测试通过！GitHub部署成功 ✅');
        break;
      }
    }
  }

  if (!success) {
    console.log('\n❌ 部署验证失败，请检查配置');
    console.log('💡 提示: 设置环境变量 NETLIFY_URL 或 GITHUB_PAGES_URL');
    process.exit(1);
  }
}

// 环境变量设置示例
console.log('💡 环境变量设置示例:');
console.log('Windows: set NETLIFY_URL=https://your-site.netlify.app');
console.log('Linux/Mac: export NETLIFY_URL=https://your-site.netlify.app');
console.log('');

if (require.main === module) {
  main().catch(console.error);
}

module.exports = GitHubDeploymentVerifier;