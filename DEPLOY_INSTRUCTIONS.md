
# 部署说明

## 一键部署步骤：

### 方法1: Netlify CLI (推荐)
```bash
# 安装Netlify CLI
npm install -g netlify-cli

# 登录
netlify login

# 部署
netlify deploy --prod --dir=client/build --functions=netlify/functions
```

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
