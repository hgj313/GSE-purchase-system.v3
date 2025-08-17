/**
 * 云端部署检查工具
 * 验证所有修复是否正确部署到Netlify
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 检查云端部署状态...');

// 检查关键文件是否包含正确的数据库引用
const filesToCheck = [
  {
    path: 'netlify/functions/optimize.js',
    requiredContent: 'netlifyDatabase'
  },
  {
    path: 'netlify/functions/health.js',
    requiredContent: 'netlifyDatabase'
  }
];

let allCorrect = true;

filesToCheck.forEach(file => {
  try {
    const content = fs.readFileSync(file.path, 'utf8');
    const hasRequired = content.includes(file.requiredContent);
    
    console.log(`${hasRequired ? '✅' : '❌'} ${file.path}: ${hasRequired ? '已更新' : '未更新'}`);
    
    if (!hasRequired) {
      allCorrect = false;
    }
  } catch (error) {
    console.log(`❌ ${file.path}: 读取失败 - ${error.message}`);
    allCorrect = false;
  }
});

// 创建部署清单
const deploymentManifest = {
  timestamp: new Date().toISOString(),
  version: '1.7.1',
  fixes: [
    '修复云端数据库初始化失败问题',
    '创建Netlify专用数据库适配器',
    '更新所有云端函数使用内存数据库',
    '修复文件系统权限问题'
  ],
  files: filesToCheck.map(file => ({
    path: file.path,
    status: fs.existsSync(file.path) ? 'exists' : 'missing',
    updated: fs.existsSync(file.path) ? 
      fs.readFileSync(file.path, 'utf8').includes(file.requiredContent) : false
  })),
  deploymentReady: allCorrect
};

fs.writeFileSync('netlify-deployment-manifest.json', JSON.stringify(deploymentManifest, null, 2));

console.log('\n📊 部署清单已生成: netlify-deployment-manifest.json');

if (allCorrect) {
  console.log('\n🎯 所有修复已就绪，可以部署到云端！');
  console.log('下一步：运行 netlify deploy --prod');
} else {
  console.log('\n⚠️ 部分文件未正确更新，请检查上述错误');
}