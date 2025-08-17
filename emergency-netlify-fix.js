/**
 * 紧急Netlify修复脚本
 * 确保所有云端函数使用正确的数据库适配器
 */

const fs = require('fs');
const path = require('path');

console.log('🚨 执行紧急Netlify修复...');

// 需要修复的函数文件
const functionsToFix = [
  {
    file: 'netlify/functions/optimize.js',
    oldImport: "const DatabaseManager = require('../../server/database/Database');",
    newImport: "const db = require('./utils/netlifyDatabase');",
    oldUsage: 'const db = DatabaseManager;',
    newUsage: 'const db = require(\'./utils/netlifyDatabase\');'
  },
  {
    file: 'netlify/functions/health.js',
    oldImport: "const { Database } = require('../../server/database/Database');",
    newImport: "const db = require('./utils/netlifyDatabase');",
    oldUsage: 'const db = new Database();',
    newUsage: 'const dbInitialized = await db.init();'
  }
];

let fixesApplied = 0;

functionsToFix.forEach(fix => {
  try {
    if (fs.existsSync(fix.file)) {
      let content = fs.readFileSync(fix.file, 'utf8');
      let originalContent = content;
      
      console.log(`\n📋 检查 ${fix.file}...`);
      
      // 替换导入语句
      if (content.includes(fix.oldImport)) {
        content = content.replace(fix.oldImport, fix.newImport);
        console.log(`✅ 更新导入语句: ${fix.oldImport} → ${fix.newImport}`);
      }
      
      // 替换使用方式
      if (content.includes(fix.oldUsage)) {
        content = content.replace(fix.oldUsage, fix.newUsage);
        console.log(`✅ 更新使用方式: ${fix.oldUsage} → ${fix.newUsage}`);
      }
      
      // 修复数据库初始化检查
      if (fix.file.includes('health.js')) {
        // 移除旧的数据库查询
        content = content.replace(/await db\.query\('SELECT 1'\);/g, '');
        content = content.replace(/await db\.query\("SELECT 1"\);/g, '');
        
        // 更新健康检查逻辑
        const healthCheckLogic = `
    try {
      // 测试Netlify云端数据库连接
      const dbInitialized = await db.init();
      
      if (!dbInitialized) {
        return {
          statusCode: 503,
          headers,
          body: JSON.stringify({
            status: 'error',
            message: '云端数据库初始化失败',
            database: 'failed',
            timestamp: new Date().toISOString()
          })
        };
      }

      // 获取数据库统计信息
      const stats = db.getStats();
      
      const healthInfo = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.7.1',
        services: {
          database: 'connected',
          api: 'running'
        },
        stats: stats,
        environment: process.env.NODE_ENV || 'production',
        endpoints: [
          'GET /.netlify/functions/health',
          'POST /.netlify/functions/optimize',
          'POST /.netlify/functions/validate-constraints',
          'POST /.netlify/functions/upload-design-steels',
          'GET /.netlify/functions/optimize/:id/progress',
          'GET /.netlify/functions/optimize/history',
          'POST /.netlify/functions/export/excel',
          'POST /.netlify/functions/export/pdf'
        ]
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(healthInfo)
      };
    `;
        
        const oldPattern = /try \{[\s\S]*?const db = new Database\(\);[\s\S]*?await db\.query\('SELECT 1'\);[\s\S]*?const healthInfo = \{[\s\S]*?\};/g;
        content = content.replace(oldPattern, healthCheckLogic);
        console.log('✅ 更新健康检查逻辑');
      }
      
      // 修复优化函数
      if (fix.file.includes('optimize.js')) {
        // 修复数据库初始化消息
        content = content.replace(/console\.error\('❌ 数据库初始化失败'\);/g, "console.error('❌ 云端数据库初始化失败');");
        content = content.replace(/error: 'Database initialization failed'/g, "error: 'Cloud database initialization failed'");
        content = content.replace(/message: '无法连接到数据库，请稍后再试'/g, "message: '云端数据库初始化失败，请稍后再试'");
        
        console.log('✅ 更新优化函数错误消息');
      }
      
      // 保存修复后的文件
      if (content !== originalContent) {
        fs.writeFileSync(fix.file, content);
        fixesApplied++;
        console.log(`✅ 修复完成: ${fix.file}`);
      } else {
        console.log('ℹ️ 文件已是最新，无需修复');
      }
    } else {
      console.log(`❌ 文件不存在: ${fix.file}`);
    }
  } catch (error) {
    console.log(`❌ 修复失败: ${fix.file} - ${error.message}`);
  }
});

// 创建修复完成报告
const report = {
  timestamp: new Date().toISOString(),
  fixesApplied: fixesApplied,
  files: functionsToFix.map(fix => ({
    file: fix.file,
    status: fs.existsSync(fix.file) ? 'exists' : 'missing',
    fixed: fixesApplied > 0
  })),
  nextSteps: [
    '运行: npm run netlify-build',
    '运行: netlify deploy --prod',
    '验证: node test-correct-api.js'
  ]
};

fs.writeFileSync('netlify-emergency-fix-report.json', JSON.stringify(report, null, 2));

console.log('\n🎯 紧急修复完成！');
console.log(`✅ 应用修复: ${fixesApplied} 个文件`);
console.log('📋 修复报告已保存: netlify-emergency-fix-report.json');
console.log('\n下一步：');
report.nextSteps.forEach(step => console.log(`  ${step}`));