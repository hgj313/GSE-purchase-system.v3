# 钢材优化系统复现指南

## 1. 系统概述

本指南详细介绍了如何复现钢材优化系统，该系统是一个基于Node.js和React的Web应用，提供钢材设计、优化和数据管理功能。系统包含前端客户端、后端API和Netlify云函数等组件。

## 2. 环境准备

### 2.1 必要软件
- Node.js (v16.14.0或更高版本)
- npm (v8.3.0或更高版本)
- Git
- Netlify CLI
- 数据库工具(如SQLite或MySQL)

### 2.2 安装指南
1. 安装Node.js和npm
   - Windows: 访问 https://nodejs.org/ 下载并安装LTS版本
   - macOS: 使用Homebrew `brew install node`
   - Linux: 使用包管理器如`apt install nodejs npm`

2. 安装Git
   - 访问 https://git-scm.com/ 下载并安装

3. 安装Netlify CLI
   ```bash
   npm install -g netlify-cli
   ```

## 3. 代码获取

### 3.1 克隆代码仓库
```bash
# 替换为实际仓库URL
git clone https://github.com/your-username/steel-optimization-system.git
cd steel-optimization-system
```

### 3.2 目录结构
```
steel-optimization-system/
├── api/                 # 后端API服务
├── client/              # 前端React应用
├── config/              # 配置文件
├── core/                # 核心优化算法
├── database/            # 数据库脚本
├── netlify/             # Netlify云函数
├── server/              # 本地服务器
├── scripts/             # 部署和测试脚本
└── test-data/           # 测试数据
```

## 4. 依赖项安装

### 4.1 安装根目录依赖
```bash
npm install
```

### 4.2 安装客户端依赖
```bash
cd client
npm install
cd ..
```

### 4.3 安装服务器依赖
```bash
cd server
npm install
cd ..
```

## 5. 配置设置

### 5.1 环境变量配置
1. 复制示例环境变量文件
   ```bash
   cp .env.example .env
   ```

2. 编辑.env文件，设置以下关键变量
   ```
   # 数据库配置
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=password
   DB_NAME=steel_optimization

   # Netlify配置
   NETLIFY_AUTH_TOKEN=your_netlify_auth_token
   SITE_ID=your_site_id
   ```

### 5.2 数据库配置
1. 确保已安装并启动数据库服务
2. 执行数据库初始化脚本
   ```bash
   cd database
   # 对于MySQL
   mysql -u root -p < init-netlify.sql
   # 对于SQLite
   sqlite3 steel_optimization.db < init-netlify.sql
   cd ..
   ```

## 6. 运行系统

### 6.1 启动本地开发服务器
```bash
# 启动Netlify开发服务器
netlify dev --port 8888
```

### 6.2 启动前端开发服务器
```bash
cd client
npm start
# 前端应用将运行在 http://localhost:3000
```

### 6.3 启动后端API服务器
```bash
cd server
node index.js
# 后端API将运行在 http://localhost:4000
```

## 7. 测试验证

### 7.1 运行单元测试
```bash
# 根目录运行测试
npm test
```

### 7.2 功能测试
1. 访问前端应用: http://localhost:3000
2. 测试文件上传功能
   - 使用test-data目录中的测试文件
   - 上传CSV、JSON和Excel格式的钢材数据
3. 测试优化功能
   - 提交优化任务
   - 查看优化结果
4. 测试数据导出功能
   - 导出优化结果为Excel或PDF

### 7.3 API端点测试
使用curl或Postman测试以下API端点:
- GET /api/design-steels - 获取设计钢材数据
- POST /api/upload-design-steels - 上传设计钢材数据
- GET /api/optimization-tasks - 获取优化任务
- POST /api/optimize - 提交优化任务

## 8. 本地部署说明

### 8.1 本地开发环境设置
确保按照前面章节的步骤完成了环境准备、依赖安装和配置设置。

### 8.2 启动本地服务
运行以下命令启动本地开发环境：
```bash
# 启动Netlify开发服务器（提供云函数支持）
netlify dev --port 8888

# 在另一个终端中启动前端开发服务器
cd client
npm start

# 在另一个终端中启动后端API服务器
cd server
node index.js
```

### 8.3 验证本地部署
访问以下URL验证本地部署是否成功：
- 前端应用：http://localhost:3000
- Netlify函数：http://localhost:8888/.netlify/functions/get-design-steels
- API服务器：http://localhost:4000

本地部署完成后，您可以使用系统的所有功能，包括文件上传、优化计算和数据管理等。

## 9. 故障排除

### 9.1 常见问题
1. 数据库连接错误
   - 检查.env文件中的数据库配置
   - 确保数据库服务正在运行

2. 依赖项安装错误
   - 尝试删除node_modules目录并重新安装
   ```bash
   rm -rf node_modules
   npm install
   ```

3. Netlify函数错误
   - 查看Netlify日志
   ```bash
   netlify logs
   ```

4. 跨域问题
   - 确保API服务器设置了正确的CORS头
   - 检查Netlify.toml文件中的CORS配置

## 10. 系统架构详解

### 10.1 前端架构
- React框架
- Redux状态管理
- Ant Design UI组件库
- Axios进行API调用

### 10.2 后端架构
- Node.js + Express
- Netlify云函数
- 内存数据库或MySQL/SQLite

### 10.3 核心算法
- 钢材切割优化算法
- 剩余材料管理算法
- 并行优化处理

## 11. 扩展功能

### 11.1 添加新的优化策略
1. 在core/optimizer目录下创建新的优化器类
2. 实现SteelOptimizer接口
3. 在优化API中添加对新优化器的支持

### 11.2 集成新数据源
1. 在api/services目录下创建新的数据服务
2. 实现数据导入/导出接口
3. 更新前端以支持新数据源

---

通过遵循本指南，您应该能够成功复现整个钢材优化系统。如果遇到任何问题，请参考故障排除部分或联系系统管理员。