/**
 * GitHub到Netlify部署验证脚本
 * 确保所有配置正确，支持GitHub自动部署
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 验证GitHub到Netlify部署配置...\n');

const checks = [];

// 1. 验证netlify.toml配置
function checkNetlifyConfig() {
  const netlifyToml = path.join(__dirname, 'netlify.toml');
  if (!fs.existsSync(netlifyToml)) {
    checks.push({ name: 'netlify.toml存在', status: '❌ 失败', message: 'netlify.toml文件不存在' });
    return false;
  }

  const content = fs.readFileSync(netlifyToml, 'utf8');
  const requiredFields = ['[build]', 'command', 'publish', 'functions'];
  const missing = requiredFields.filter(field => !content.includes(field));
  
  if (missing.length === 0) {
    checks.push({ name: 'netlify.toml配置', status: '✅ 通过', message: '所有必要配置项都存在' });
    return true;
  } else {
    checks.push({ name: 'netlify.toml配置', status: '❌ 失败', message: `缺少: ${missing.join(', ')}` });
    return false;
  }
}

// 2. 验证构建脚本
function checkBuildScripts() {
  const rootPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const clientPackageJson = JSON.parse(fs.readFileSync('client/package.json', 'utf8'));
  
  const hasNetlifyBuild = rootPackageJson.scripts && rootPackageJson.scripts['netlify-build'];
  const hasClientBuild = clientPackageJson.scripts && clientPackageJson.scripts['build'];
  
  if (hasNetlifyBuild && hasClientBuild) {
    checks.push({ name: '构建脚本', status: '✅ 通过', message: '构建脚本配置正确' });
    return true;
  } else {
    checks.push({ name: '构建脚本', status: '❌ 失败', message: '缺少构建脚本' });
    return false;
  }
}

// 3. 验证文件结构
function checkFileStructure() {
  const requiredFiles = [
    'netlify/functions/optimize.js',
    'netlify/functions/health.js',
    'netlify/functions/validate-constraints.js',
    'client/package.json',
    'client/src/App.tsx'
  ];
  
  const missing = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missing.length === 0) {
    checks.push({ name: '文件结构', status: '✅ 通过', message: '所有必要文件都存在' });
    return true;
  } else {
    checks.push({ name: '文件结构', status: '❌ 失败', message: `缺少文件: ${missing.join(', ')}` });
    return false;
  }
}

// 4. 验证依赖
function checkDependencies() {
  const rootPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const clientPackageJson = JSON.parse(fs.readFileSync('client/package.json', 'utf8'));
  
  const requiredRootDeps = ['express', 'cors', 'uuid'];
  const requiredClientDeps = ['react', 'react-dom', 'antd', 'recharts'];
  
  const missingRoot = requiredRootDeps.filter(dep => !rootPackageJson.dependencies[dep]);
  const missingClient = requiredClientDeps.filter(dep => !clientPackageJson.dependencies[dep]);
  
  if (missingRoot.length === 0 && missingClient.length === 0) {
    checks.push({ name: '依赖配置', status: '✅ 通过', message: '所有必要依赖都已配置' });
    return true;
  } else {
    const allMissing = [...missingRoot, ...missingClient.map(dep => `client:${dep}`)];
    checks.push({ name: '依赖配置', status: '❌ 失败', message: `缺少依赖: ${allMissing.join(', ')}` });
    return false;
  }
}

// 5. 验证环境变量配置
function checkEnvironmentConfig() {
  const netlifyToml = fs.readFileSync('netlify.toml', 'utf8');
  const hasEnvVars = netlifyToml.includes('[build.environment]');
  
  if (hasEnvVars) {
    checks.push({ name: '环境变量', status: '✅ 通过', message: '环境变量配置存在' });
    return true;
  } else {
    checks.push({ name: '环境变量', status: '⚠️ 警告', message: '建议添加环境变量配置' });
    return true; // 不是致命错误
  }
}

// 6. 验证GitHub Actions配置（可选）
function checkGitHubActions() {
  const githubActionsPath = '.github/workflows';
  if (fs.existsSync(githubActionsPath)) {
    const files = fs.readdirSync(githubActionsPath);
    if (files.some(file => file.includes('netlify') || file.includes('deploy'))) {
      checks.push({ name: 'GitHub Actions', status: '✅ 通过', message: '已配置自动部署' });
    } else {
      checks.push({ name: 'GitHub Actions', status: '⚠️ 信息', message: '未找到Netlify部署配置，将使用自动GitHub集成' });
    }
  } else {
    checks.push({ name: 'GitHub Actions', status: '⚠️ 信息', message: '未配置GitHub Actions，Netlify将自动检测并部署' });
  }
  return true;
}

// 7. 验证构建命令
function checkBuildCommand() {
  const netlifyToml = fs.readFileSync('netlify.toml', 'utf8');
  const buildCommandMatch = netlifyToml.match(/command\s*=\s*"([^"]+)"/);
  
  if (buildCommandMatch) {
    const command = buildCommandMatch[1];
    if (command.includes('npm ci') && command.includes('npm run build')) {
      checks.push({ name: '构建命令', status: '✅ 通过', message: '构建命令配置正确' });
      return true;
    } else {
      checks.push({ name: '构建命令', status: '⚠️ 警告', message: '构建命令可能需要调整' });
      return true;
    }
  }
  
  checks.push({ name: '构建命令', status: '❌ 失败', message: '无法解析构建命令' });
  return false;
}

// 8. 验证函数目录
function checkFunctionsDirectory() {
  const functionsDir = 'netlify/functions';
  if (fs.existsSync(functionsDir)) {
    const files = fs.readdirSync(functionsDir);
    const jsFiles = files.filter(file => file.endsWith('.js'));
    
    if (jsFiles.length >= 3) { // 至少有optimize.js, health.js, validate-constraints.js
      checks.push({ name: '函数目录', status: '✅ 通过', message: `找到${jsFiles.length}个函数文件` });
      return true;
    } else {
      checks.push({ name: '函数目录', status: '❌ 失败', message: `函数文件不足: ${jsFiles.length}` });
      return false;
    }
  } else {
    checks.push({ name: '函数目录', status: '❌ 失败', message: 'netlify/functions目录不存在' });
    return false;
  }
}

// 执行所有检查
function runAllChecks() {
  console.log('📋 开始验证GitHub到Netlify部署配置...\n');
  
  checkNetlifyConfig();
  checkBuildScripts();
  checkFileStructure();
  checkDependencies();
  checkEnvironmentConfig();
  checkGitHubActions();
  checkBuildCommand();
  checkFunctionsDirectory();
  
  console.log('\n📊 验证结果汇总:');
  console.log('='.repeat(50));
  
  let passed = 0;
  let warnings = 0;
  let failed = 0;
  
  checks.forEach(check => {
    console.log(`${check.status} ${check.name}: ${check.message}`);
    
    if (check.status.startsWith('✅')) passed++;
    else if (check.status.startsWith('⚠️')) warnings++;
    else if (check.status.startsWith('❌')) failed++;
  });
  
  console.log('\n📈 统计:');
  console.log(`✅ 通过: ${passed}`);
  console.log(`⚠️ 警告: ${warnings}`);
  console.log(`❌ 失败: ${failed}`);
  
  // 生成部署指南
  const deploymentGuide = {
    timestamp: new Date().toISOString(),
    status: failed === 0 ? 'READY_FOR_DEPLOYMENT' : 'NEEDS_FIXES',
    checks: checks,
    githubDeploymentSteps: [
      "1. 在GitHub上创建新仓库",
      "2. 将当前项目推送到GitHub",
      "3. 登录Netlify (https://app.netlify.com)",
      "4. 点击 'Add new site' → 'Import from Git'",
      "5. 选择GitHub并授权",
      "6. 选择你的仓库",
      "7. 确认构建设置：",
      "   - Build command: npm run netlify-build",
      "   - Publish directory: client/build",
      "   - Functions directory: netlify/functions",
      "8. 点击 'Deploy site'",
      "9. 等待自动部署完成"
    ],
    troubleshooting: [
      "如果构建失败，检查netlify.toml中的命令",
      "确保package.json中的依赖都正确安装",
      "检查是否有大文件导致构建超时",
      "验证所有函数文件语法正确"
    ]
  };
  
  fs.writeFileSync('github-netlify-deployment-report.json', JSON.stringify(deploymentGuide, null, 2));
  
  console.log('\n📄 详细报告已保存到: github-netlify-deployment-report.json');
  
  if (failed === 0) {
    console.log('\n🎉 配置验证通过！可以安全部署到Netlify');
    console.log('💡 建议使用GitHub集成方式部署');
  } else {
    console.log('\n⚠️ 需要修复上述失败项后再部署');
  }
  
  return failed === 0;
}

// 执行验证
const isReady = runAllChecks();
process.exit(isReady ? 0 : 1);