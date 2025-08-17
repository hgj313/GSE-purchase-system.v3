# Netlify 部署指南

## 项目概述
钢材采购优化系统 V3.0 - Netlify 无服务器部署版本

## 部署步骤

### 1. 准备代码
```bash
# 确保项目结构完整
├── netlify.toml          # Netlify配置文件
├── netlify/              # Netlify函数目录
│   └── functions/        # 无服务器函数
│       ├── health.js      # 健康检查
│       ├── optimize.js    # 优化计算
│       ├── validate-constraints.js  # 约束验证
│       ├── upload-design-steels.js  # 文件上传
│       ├── stats.js       # 统计信息
│       ├── task.js        # 任务管理
│       ├── history.js     # 历史记录
│       └── export.js      # 导出功能
├── client/               # React前端应用
├── server/               # 后端代码（用于本地开发）
├── core/                 # 核心优化算法
├── database/             # 数据库脚本
└── package.json          # 项目依赖
```

### 2. 配置环境变量
在Netlify控制台中设置以下环境变量：
- `NODE_VERSION`: 18
- `NPM_VERSION`: 9
- `DATABASE_URL`: 数据库连接字符串（使用SQLite或外部数据库）

### 3. 部署命令
```bash
# 构建命令
npm run build

# 发布目录
client/build

# 函数目录
netlify/functions
```

### 4. 功能特性
- ✅ 钢材优化计算
- ✅ 约束条件验证
- ✅ 文件上传（CSV/JSON）
- ✅ Excel导出
- ✅ 优化历史记录
- ✅ 实时任务管理
- ✅ 系统健康检查
- ✅ 统计信息

### 5. API端点
- `GET /.netlify/functions/health` - 系统健康检查
- `POST /.netlify/functions/optimize` - 执行优化
- `POST /.netlify/functions/validate-constraints` - 验证约束
- `POST /.netlify/functions/upload-design-steels` - 上传设计钢材数据
- `GET /.netlify/functions/stats` - 获取统计信息
- `POST /.netlify/functions/export` - 导出结果
- `GET /.netlify/functions/task/:id` - 获取任务状态
- `POST /.netlify/functions/task` - 创建新任务
- `DELETE /.netlify/functions/task/:id` - 取消任务
- `GET /.netlify/functions/history` - 获取优化历史

### 6. 本地测试
```bash
# 安装依赖
npm install

# 启动本地开发服务器
netlify dev

# 或直接使用
npm start
```

### 7. 注意事项
- 确保所有依赖正确安装
- 检查数据库连接配置
- 验证CORS设置
- 测试所有API端点
- 监控函数执行时间和内存使用

### 8. 性能优化
- 使用缓存减少计算重复
- 优化数据库查询
- 压缩响应数据
- 使用CDN加速静态资源

## 故障排除
- 检查函数日志
- 验证环境变量
- 测试数据库连接
- 确认文件权限