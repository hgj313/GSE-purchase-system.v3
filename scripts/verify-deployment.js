#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 验证部署配置...\n');

// 检查关键文件
const requiredFiles = [
  'netlify.toml',
  'client/package.json',
  'package.json',
  'netlify/functions/optimize.js',
  'netlify/functions/health.js'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file} ${exists ? '存在' : '缺失'}`);
  if (!exists) allFilesExist = false;
});

// 检查构建目录
const buildExists = fs.existsSync('client/build');
console.log(`${buildExists ? '✅' : '⚠️'} client/build ${buildExists ? '已构建' : '待构建'}`);

// 检查package.json脚本
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const hasNetlifyBuild = packageJson.scripts && packageJson.scripts['netlify-build'];
console.log(`${hasNetlifyBuild ? '✅' : '❌'} package.json 包含 netlify-build 脚本`);

// 检查netlify.toml配置
const netlifyToml = fs.readFileSync('netlify.toml', 'utf8');
const hasCorrectBuild = netlifyToml.includes('npm ci && npm ci --prefix client && npm run build --prefix client');
console.log(`${hasCorrectBuild ? '✅' : '❌'} netlify.toml 构建命令正确`);

console.log('\n📋 部署状态总结:');
console.log(allFilesExist && hasNetlifyBuild && hasCorrectBuild 
  ? '🎉 所有配置正确，可以部署到Netlify！'
  : '⚠️ 请修复上述问题后再部署');

// 提供部署指南
console.log('\n🚀 部署步骤:');
console.log('1. 确保所有文件已提交到Git');
console.log('2. 在Netlify网站: https://app.netlify.com');
console.log('3. 点击 "New site from Git"');
console.log('4. 选择Git仓库并连接');
console.log('5. 等待自动部署完成');

if (!buildExists) {
  console.log('\n💡 本地测试构建:');
  console.log('运行: npm run netlify-build');
}