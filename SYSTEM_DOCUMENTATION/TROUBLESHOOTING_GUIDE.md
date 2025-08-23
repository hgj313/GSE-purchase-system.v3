# 故障排除指南

## 1. 概述

本文档提供了钢材优化系统复现和运行过程中常见问题的解决方案。如果您在使用系统时遇到问题，请先查阅本指南。如问题仍未解决，请联系系统管理员。

## 2. 环境配置问题

### 2.1 Node.js和npm安装问题

**症状**: 运行`node -v`或`npm -v`命令时提示"命令未找到"或版本过低。

**解决方案**: 
1. 确认Node.js已正确安装
   ```bash
   # Windows
   where node
   # macOS/Linux
   which node
   ```
2. 如果未安装或版本过低，访问 https://nodejs.org/ 下载并安装LTS版本
3. 安装完成后，重启命令行窗口
4. 验证安装
   ```bash
   node -v  # 应显示v16.14.0或更高版本
   npm -v   # 应显示v8.3.0或更高版本
   ```

### 2.2 Netlify CLI安装问题

**症状**: 运行`netlify`命令时提示"命令未找到"。

**解决方案**: 
1. 重新安装Netlify CLI
   ```bash
   npm install -g netlify-cli
   ```
2. 确认安装位置
   ```bash
   # Windows
   where netlify
   # macOS/Linux
   which netlify
   ```
3. 如果仍然无法访问，检查npm全局安装路径是否已添加到系统PATH

## 3. 依赖安装问题

### 3.1 依赖安装失败

**症状**: 运行`npm install`时出现错误，无法安装依赖包。

**解决方案**: 
1. 清除npm缓存
   ```bash
   npm cache clean --force
   ```
2. 删除node_modules目录和package-lock.json文件
   ```bash
   # Windows
   rmdir /s /q node_modules
   del package-lock.json
   # macOS/Linux
   rm -rf node_modules
   rm package-lock.json
   ```
3. 使用淘宝镜像源(中国用户)
   ```bash
   npm install --registry=https://registry.npm.taobao.org
   ```
4. 检查网络连接，确保可以访问npm仓库

### 3.2 依赖版本冲突

**症状**: 安装依赖时出现版本冲突错误，如"could not resolve dependency"。

**解决方案**: 
1. 使用npm的--force或--legacy-peer-deps选项
   ```bash
   npm install --force
   # 或
   npm install --legacy-peer-deps
   ```
2. 更新package.json文件中的依赖版本
3. 使用yarn替代npm尝试安装
   ```bash
   yarn install
   ```

## 4. 数据库问题

### 4.1 数据库连接失败

**症状**: 启动应用时提示"无法连接到数据库"或类似错误。

**解决方案**: 
1. 检查.env文件中的数据库配置是否正确
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=password
   DB_NAME=steel_optimization
   ```
2. 确认数据库服务正在运行
   ```bash
   # MySQL
   service mysql status
   # 或
   systemctl status mysql
   
   # PostgreSQL
   service postgresql status
   ```
3. 确认数据库用户具有正确的权限
4. 尝试手动连接数据库验证配置
   ```bash
   mysql -u root -p
   ```

### 4.2 数据库表不存在

**症状**: 访问应用时提示"表不存在"错误。

**解决方案**: 
1. 执行数据库初始化脚本
   ```bash
   cd database
   mysql -u root -p < init-netlify.sql
   ```
2. 确认脚本执行成功，没有报错
3. 检查数据库中是否已创建表
   ```bash
   mysql -u root -p steel_optimization
   SHOW TABLES;
   ```

## 5. 运行应用问题

### 5.1 Netlify开发服务器启动失败

**症状**: 运行`netlify dev --port 8888`时出现错误，服务器无法启动。

**解决方案**: 
1. 检查端口8888是否已被占用
   ```bash
   # Windows
   netstat -ano | findstr :8888
   # macOS/Linux
   lsof -i :8888
   ```
2. 如果端口已被占用，使用其他端口
   ```bash
   netlify dev --port 8889
   ```
3. 检查netlify.toml文件配置是否正确
4. 查看详细错误日志
   ```bash
   netlify dev --debug
   ```

### 5.2 前端应用启动失败

**症状**: 运行`npm start`(在client目录)时出现错误，无法启动React应用。

**解决方案**: 
1. 确认client目录下已安装依赖
   ```bash
   cd client
   npm install
   ```
2. 检查端口3000是否已被占用
3. 清除缓存并重启
   ```bash
   npm start -- --reset-cache
   ```
4. 查看详细错误信息，针对性解决

## 6. 功能问题

### 6.1 文件上传失败

**症状**: 上传CSV、JSON或Excel文件时出现错误。

**解决方案**: 
1. 检查文件格式是否符合要求
   - CSV: 确保包含正确的列名和格式
   - JSON: 确保格式正确，可使用在线JSON验证工具
   - Excel: 确保使用.xlsx格式，而非.xls
2. 检查文件大小是否超过限制(默认10MB)
3. 查看浏览器控制台错误信息
4. 查看Netlify函数日志
   ```bash
   netlify dev --debug
   ```

### 6.2 优化任务失败

**症状**: 提交优化任务后，任务状态显示为"failed"。

**解决方案**: 
1. 检查输入数据是否有效
2. 查看任务详情中的错误信息
3. 查看优化算法日志
4. 尝试使用不同的优化算法
5. 降低数据规模或调整优化参数

## 7. API问题

### 7.1 API请求返回404错误

**症状**: 调用API时返回"404 Not Found"错误。

**解决方案**: 
1. 确认API端点URL是否正确
2. 确认Netlify开发服务器正在运行
3. 检查netlify/functions目录下是否存在对应的函数文件
4. 确认函数文件名与API端点名称一致

### 7.2 API请求返回500错误

**症状**: 调用API时返回"500 Internal Server Error"错误。

**解决方案**: 
1. 查看Netlify函数日志
   ```bash
   netlify logs
   ```
2. 检查函数代码是否存在语法错误
3. 检查数据库连接是否正常
4. 增加日志输出，调试问题

## 8. 跨域问题

**症状**: 前端应用无法调用API，浏览器控制台提示CORS错误。

**解决方案**: 
1. 检查API服务器是否设置了正确的CORS头
2. 确认netlify.toml文件中的CORS配置
   ```toml
   [[headers]]
   for = "/*"
   [headers.values]
   Access-Control-Allow-Origin = "*"
   Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
   Access-Control-Allow-Headers =