/**
 * 最终Netlify部署脚本
 * 一键完成云端部署
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 开始最终Netlify部署...');

// 部署步骤
const steps = [
  {
    name: '验证修复状态',
    command: 'node emergency-netlify-fix.js'
  },
  {
    name: '构建Netlify包',
    command: 'npm run netlify-build'
  },
  {
    name: '部署到云端',
    command: 'netlify deploy --prod'
  },
  {
    name: '验证云端服务',
    command: 'node test-correct-api.js'
  }
];

async function runDeployment() {
  let successCount = 0;
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.log(`\n📋 ${i + 1}/${steps.length}: ${step.name}...`);
    
    try {
      if (step.name === '部署到云端') {
        // 检查是否已安装netlify-cli
        try {
          execSync('netlify --version', { stdio: 'pipe' });
        } catch (e) {
          console.log('⚠️ netlify-cli未安装，请先安装：npm install -g netlify-cli');
          console.log('或使用: npx netlify deploy --prod');
          continue;
        }
      }
      
      const output = execSync(step.command, { 
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: 'inherit'
      });
      
      successCount++;
      console.log(`✅ ${step.name} 完成`);
      
    } catch (error) {
      console.log(`❌ ${step.name} 失败: ${error.message}`);
      
      // 提供替代方案
      if (step.name === '部署到云端') {
        console.log('\n💡 替代部署方案:');
        console.log('1. 手动部署到Netlify网站');
        console.log('2. 使用Netlify CLI: npx netlify deploy --prod');
        console.log('3. 使用GitHub Actions自动部署');
      }
      
      break;
    }
  }
  
  // 创建部署报告
  const report = {
    timestamp: new Date().toISOString(),
    stepsCompleted: successCount,
    totalSteps: steps.length,
    success: successCount === steps.length,
    nextActions: []
  };
  
  if (successCount === steps.length) {
    report.nextActions = [
      '✅ 所有步骤完成！云端API已部署成功',
      '🎯 使用 node test-correct-api.js 验证云端服务',
      '🌐 访问 https://deluxe-heliotrope-cc6c08.netlify.app/.netlify/functions/health'
    ];
  } else {
    report.nextActions = [
      '🔄 检查错误并重新运行失败的步骤',
      '📋 查看 netlify-emergency-fix-report.json',
      '💡 参考 DEPLOYMENT_SUCCESS_GUIDE.md'
    ];
  }
  
  fs.writeFileSync('final-deployment-report.json', JSON.stringify(report, null, 2));
  
  console.log('\n📊 部署完成报告:');
  console.log(`✅ 完成步骤: ${successCount}/${steps.length}`);
  console.log('📄 详细报告: final-deployment-report.json');
  
  report.nextActions.forEach(action => console.log(action));
}

// 执行部署
runDeployment().catch(console.error);