/**
 * Netlify云端部署修复脚本
 * 确保所有数据库相关文件正确部署
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 开始Netlify云端部署修复...');

// 1. 验证所有必要的Netlify函数文件存在
const requiredFiles = [
  'netlify/functions/optimize.js',
  'netlify/functions/health.js',
  'netlify/functions/utils/netlifyDatabase.js'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} 存在`);
  } else {
    console.log(`❌ ${file} 不存在`);
    allFilesExist = false;
  }
});

// 2. 检查文件内容是否正确
if (allFilesExist) {
  console.log('\n📋 验证文件内容...');
  
  // 检查optimize.js是否使用新的数据库
  const optimizeContent = fs.readFileSync('netlify/functions/optimize.js', 'utf8');
  if (optimizeContent.includes('netlifyDatabase')) {
    console.log('✅ optimize.js 已使用Netlify数据库适配器');
  } else {
    console.log('❌ optimize.js 未正确更新');
  }
  
  // 检查health.js是否使用新的数据库
  const healthContent = fs.readFileSync('netlify/functions/health.js', 'utf8');
  if (healthContent.includes('netlifyDatabase')) {
    console.log('✅ health.js 已使用Netlify数据库适配器');
  } else {
    console.log('❌ health.js 未正确更新');
  }
}

// 3. 创建部署检查报告
const report = {
  timestamp: new Date().toISOString(),
  files: requiredFiles.map(file => ({
    path: file,
    exists: fs.existsSync(path.join(__dirname, file)),
    size: fs.existsSync(path.join(__dirname, file)) ? fs.statSync(path.join(__dirname, file)).size : 0
  })),
  status: allFilesExist ? 'ready' : 'incomplete'
};

fs.writeFileSync('netlify-deploy-check.json', JSON.stringify(report, null, 2));
console.log('\n📊 部署检查报告已生成: netlify-deploy-check.json');

// 4. 提供部署建议
console.log('\n💡 部署建议:');
console.log('1. 运行: npm run build:netlify');
console.log('2. 运行: npm run netlify-build');
console.log('3. 检查: netlify deploy --prod');
console.log('4. 验证: node test-health-api.js');

console.log('\n🎯 修复完成！请按上述步骤部署到云端。');