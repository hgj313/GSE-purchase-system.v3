#!/usr/bin/env node
/**
 * GitHub仓库一键部署脚本
 * 将修复后的云端优化器部署到GitHub并验证
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GitHubDeployer {
  constructor() {
    this.repoUrl = process.env.GITHUB_REPO_URL;
    this.branch = process.env.GITHUB_BRANCH || 'main';
  }

  async deploy() {
    console.log('🚀 开始GitHub仓库部署...\n');

    try {
      // 1. 检查Git配置
      await this.checkGitConfig();
      
      // 2. 检查仓库状态
      await this.checkRepoStatus();
      
      // 3. 提交修复代码
      await this.commitFixes();
      
      // 4. 推送到GitHub
      await this.pushToGitHub();
      
      // 5. 验证部署状态
      await this.verifyDeployment();
      
      console.log('\n🎉 GitHub部署完成！');
      console.log('🌐 部署地址: https://your-username.github.io');
      
    } catch (error) {
      console.error('❌ 部署失败:', error.message);
      process.exit(1);
    }
  }

  async checkGitConfig() {
    console.log('🔍 检查Git配置...');
    try {
      execSync('git --version', { stdio: 'pipe' });
      
      const remote = execSync('git config --get remote.origin.url', { stdio: 'pipe' }).toString().trim();
      console.log(`✅ Git仓库: ${remote}`);
      
      if (!remote.includes('github.com')) {
        throw new Error('当前仓库不是GitHub仓库');
      }
    } catch (error) {
      throw new Error('Git配置检查失败: ' + error.message);
    }
  }

  async checkRepoStatus() {
    console.log('📋 检查仓库状态...');
    try {
      const status = execSync('git status --porcelain', { stdio: 'pipe' }).toString();
      
      if (status.trim()) {
        console.log('⚠️ 发现未提交更改:');
        console.log(status);
      } else {
        console.log('✅ 仓库状态干净');
      }
    } catch (error) {
      throw new Error('仓库状态检查失败: ' + error.message);
    }
  }

  async commitFixes() {
    console.log('💾 提交修复代码...');
    
    try {
      // 添加所有修复文件
      execSync('git add netlify/functions/', { stdio: 'pipe' });
      execSync('git add core/constraints/', { stdio: 'pipe' });
      execSync('git add *.md', { stdio: 'pipe' });
      execSync('git add *.js', { stdio: 'pipe' });
      
      // 检查是否有更改
      const status = execSync('git diff --cached --name-only', { stdio: 'pipe' }).toString();
      if (!status.trim()) {
        console.log('✅ 无新更改需要提交');
        return;
      }
      
      // 提交更改
      execSync('git commit -m "fix: 修复云端优化器ConstraintValidator导入和数据验证问题\n\n- 修复ConstraintValidator导入错误\n- 添加validateConstraints方法支持API\n- 增强数据验证和自动计算\n- 保持所有原有功能完整"', { stdio: 'pipe' });
      
      console.log('✅ 修复代码已提交');
    } catch (error) {
      throw new Error('代码提交失败: ' + error.message);
    }
  }

  async pushToGitHub() {
    console.log('🚀 推送到GitHub...');
    
    try {
      execSync(`git push origin ${this.branch}`, { stdio: 'inherit' });
      console.log('✅ 代码已推送到GitHub');
    } catch (error) {
      throw new Error('推送到GitHub失败: ' + error.message);
    }
  }

  async verifyDeployment() {
    console.log('⏳ 等待Netlify构建...');
    console.log('📊 构建状态可在Netlify控制台查看');
    console.log('🔗 构建完成后访问: https://your-site.netlify.app');
    
    // 创建验证脚本
    const verifyScript = `#!/bin/bash
echo "验证GitHub部署..."
echo "1. 健康检查:"
curl -s ${this.getNetlifyUrl()}/.netlify/functions/health | jq .

echo "2. 约束验证:"
curl -s -X POST ${this.getNetlifyUrl()}/.netlify/functions/validate-constraints \
  -H "Content-Type: application/json" \
  -d '{"constraints":{"wasteThreshold":600,"targetLossRate":5,"timeLimit":30000,"maxWeldingSegments":2}}' | jq .

echo "3. 优化测试:"
curl -s -X POST ${this.getNetlifyUrl()}/.netlify/functions/optimize \
  -H "Content-Type: application/json" \
  -d @test-data.json | jq .
`;
    
    fs.writeFileSync('verify-deployment.sh', verifyScript);
    execSync('chmod +x verify-deployment.sh', { stdio: 'pipe' });
    
    console.log('✅ 验证脚本已创建: verify-deployment.sh');
  }

  getNetlifyUrl() {
    // 从GitHub仓库URL推断Netlify URL
    const repoName = execSync('basename -s .git $(git config --get remote.origin.url)', { stdio: 'pipe' }).toString().trim();
    return `https://${repoName}.netlify.app`;
  }
}

// 使用说明
function showUsage() {
  console.log('📖 GitHub部署使用说明:');
  console.log('');
  console.log('1. 设置环境变量（可选）:');
  console.log('   export GITHUB_REPO_URL=https://github.com/username/repo.git');
  console.log('   export GITHUB_BRANCH=main');
  console.log('');
  console.log('2. 一键部署:');
  console.log('   node deploy-to-github.js');
  console.log('');
  console.log('3. 验证部署:');
  console.log('   ./verify-deployment.sh');
  console.log('');
  console.log('4. 或者使用npm脚本:');
  console.log('   npm run deploy:github');
  console.log('');
}

// 主函数
async function main() {
  showUsage();
  
  const deployer = new GitHubDeployer();
  await deployer.deploy();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = GitHubDeployer;