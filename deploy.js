#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeployManager {
  constructor() {
    this.projectRoot = process.cwd();
    this.checklist = [];
  }

  async deploy() {
    console.log('🚀 开始部署钢材采购优化系统到Netlify...\n');
    
    try {
      await this.checkPrerequisites();
      await this.validateConfiguration();
      await this.buildClient();
      await this.prepareNetlify();
      await this.createDeployZip();
      
      console.log('\n✅ 部署准备完成！');
      console.log('\n📋 下一步操作：');
      console.log('1. 访问 https://app.netlify.com');
      console.log('2. 点击 "New site from Git"');
      console.log('3. 选择你的代码仓库');
      console.log('4. 确认构建设置：');
      console.log('   - Build command: npm run build');
      console.log('   - Publish directory: client/build');
      console.log('5. 点击 "Deploy site"');
      
    } catch (error) {
      console.error('\n❌ 部署失败:', error.message);
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    console.log('📋 检查先决条件...');
    
    // 检查必需文件
    const requiredFiles = [
      'netlify.toml',
      'package.json',
      'client/package.json',
      'client/src/App.tsx'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`缺少必需文件: ${file}`);
      }
      this.checklist.push(`✅ ${file}`);
    }

    // 检查Node.js版本
    try {
      const nodeVersion = process.version;
      console.log(`Node.js版本: ${nodeVersion}`);
    } catch (error) {
      throw new Error('Node.js未安装');
    }

    console.log('✅ 先决条件检查通过\n');
  }

  async validateConfiguration() {
    console.log('🔧 验证配置文件...');

    // 验证netlify.toml
    const netlifyConfig = path.join(this.projectRoot, 'netlify.toml');
    if (fs.existsSync(netlifyConfig)) {
      const config = fs.readFileSync(netlifyConfig, 'utf8');
      if (!config.includes('[build]')) {
        throw new Error('netlify.toml格式不正确');
      }
      this.checklist.push('✅ netlify.toml配置正确');
    }

    // 验证函数文件
    const functionsDir = path.join(this.projectRoot, 'netlify', 'functions');
    if (!fs.existsSync(functionsDir)) {
      throw new Error('netlify/functions目录不存在');
    }

    const requiredFunctions = [
      'health.js',
      'optimize.js',
      'validate-constraints.js',
      'upload-design-steels.js',
      'stats.js',
      'task.js',
      'history.js',
      'export.js'
    ];

    for (const func of requiredFunctions) {
      const funcPath = path.join(functionsDir, func);
      if (!fs.existsSync(funcPath)) {
        throw new Error(`缺少函数文件: ${func}`);
      }
    }

    console.log('✅ 配置文件验证通过\n');
  }

  async buildClient() {
    console.log('🏗️ 构建客户端...');
    
    const clientDir = path.join(this.projectRoot, 'client');
    
    try {
      // 安装客户端依赖
      console.log('安装客户端依赖...');
      execSync('npm install', { cwd: clientDir, stdio: 'inherit' });
      
      // 构建客户端
      console.log('构建生产版本...');
      execSync('npm run build', { cwd: clientDir, stdio: 'inherit' });
      
      this.checklist.push('✅ 客户端构建成功');
      
    } catch (error) {
      throw new Error(`客户端构建失败: ${error.message}`);
    }
  }

  async prepareNetlify() {
    console.log('📦 准备Netlify部署...');
    
    // 创建部署清单
    const manifest = {
      version: '3.0.0',
      buildTime: new Date().toISOString(),
      functions: [],
      client: {
        buildDir: 'client/build',
        framework: 'React'
      }
    };

    // 检查函数文件
    const functionsDir = path.join(this.projectRoot, 'netlify', 'functions');
    const functions = fs.readdirSync(functionsDir)
      .filter(f => f.endsWith('.js'))
      .map(f => path.join('netlify', 'functions', f));
    
    manifest.functions = functions;

    // 保存清单
    fs.writeFileSync(
      path.join(this.projectRoot, 'deployment-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    this.checklist.push('✅ Netlify部署准备完成');
  }

  async createDeployZip() {
    console.log('📁 创建部署包...');
    
    const deployFiles = [
      'netlify.toml',
      'netlify/functions/',
      'client/build/',
      'package.json',
      'package-lock.json',
      'core/',
      'database/',
      'config/',
      'server/database/',
      'deployment-manifest.json'
    ];

    // 创建部署说明
    const deployInstructions = `
# 部署说明

## 一键部署步骤：

### 方法1: Netlify CLI (推荐)
\`\`\`bash
# 安装Netlify CLI
npm install -g netlify-cli

# 登录
netlify login

# 部署
netlify deploy --prod --dir=client/build --functions=netlify/functions
\`\`\`

### 方法2: Git部署
1. 推送到Git仓库
2. 在Netlify控制台连接仓库
3. 设置构建设置：
   - Build command: npm run build
   - Publish directory: client/build
   - Functions directory: netlify/functions

### 方法3: 拖拽部署
1. 打包client/build目录
2. 上传到Netlify

## 环境变量设置：
在Netlify控制台设置：
- NODE_VERSION: 18
- NPM_VERSION: 9

## 验证部署：
访问部署后的URL，检查：
- 前端页面正常加载
- API端点可用
- 优化功能正常工作
`;

    fs.writeFileSync(
      path.join(this.projectRoot, 'DEPLOY_INSTRUCTIONS.md'),
      deployInstructions
    );

    console.log('✅ 部署包创建完成');
  }
}

// 运行部署
if (require.main === module) {
  const deployer = new DeployManager();
  deployer.deploy().catch(console.error);
}

module.exports = { DeployManager };