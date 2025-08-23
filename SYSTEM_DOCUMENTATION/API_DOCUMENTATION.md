# API接口文档

## 1. 概述

本文档详细描述了钢材优化系统的所有API接口，包括请求参数、响应格式和示例。这些API用于前端与后端之间的通信，以及第三方系统的集成。

## 2. 基础信息

- API基础URL: `http://localhost:8888/.netlify/functions` (本地开发环境)
- 认证方式: 无(本地开发环境)
- 请求/响应格式: JSON
- 错误处理: 所有错误响应包含`error`字段和HTTP状态码

## 3. 设计钢材API

### 3.1 获取设计钢材数据

- **端点**: `/get-design-steels`
- **方法**: GET
- **描述**: 获取所有设计钢材数据
- **请求参数**: 无
- **响应格式**: 
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "string",
        "length": number,
        "quantity": number,
        "type": "string",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "count": number
  }
  ```
- **示例**: 
  ```bash
  curl http://localhost:8888/.netlify/functions/get-design-steels
  ```

### 3.2 上传设计钢材数据

- **端点**: `/upload-design-steels`
- **方法**: POST
- **描述**: 上传设计钢材数据(支持CSV、JSON和Excel格式)
- **请求参数**: 
  ```json
  {
    "fileType": "string", // csv, json, xlsx
    "fileData": "string"  // base64编码的文件内容
  }
  ```
- **响应格式**: 
  ```json
  {
    "success": true,
    "message": "数据已成功上传",
    "count": number
  }
  ```
- **示例**: 
  ```bash
  curl -X POST -H "Content-Type: application/json" -d '{
    "fileType": "json",
    "fileData": "eyJkZXNpZ25TdGVlbHMiOlt7Imxlbmd0aCI6MTAsInF1YW50aXR5IjoxfV19"
  }' http://localhost:8888/.netlify/functions/upload-design-steels
  ```

## 4. 模数钢材API

### 4.1 获取模数钢材数据

- **端点**: `/get-modulus-steels`
- **方法**: GET
- **描述**: 获取所有模数钢材数据
- **请求参数**: 无
- **响应格式**: 
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "string",
        "length": number,
        "quantity": number,
        "type": "string",
        "modulus": number,
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "count": number
  }
  ```
- **示例**: 
  ```bash
  curl http://localhost:8888/.netlify/functions/get-modulus-steels
  ```

## 5. 优化任务API

### 5.1 获取优化任务

- **端点**: `/get-optimization-tasks`
- **方法**: GET
- **描述**: 获取所有优化任务
- **请求参数**: 
  - `status` (可选): 任务状态(pending, processing, completed, failed)
- **响应格式**: 
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "string",
        "name": "string",
        "status": "string",
        "priority": number,
        "createdAt": "string",
        "updatedAt": "string",
        "completedAt": "string"
      }
    ],
    "count": number
  }
  ```
- **示例**: 
  ```bash
  curl http://localhost:8888/.netlify/functions/get-optimization-tasks?status=completed
  ```

### 5.2 提交优化任务

- **端点**: `/optimize`
- **方法**: POST
- **描述**: 提交新的优化任务
- **请求参数**: 
  ```json
  {
    "name": "string",
    "designSteelIds": ["string"],
    "modulusSteelIds": ["string"],
    "constraints": {
      "maxWaste": number,
      "minUtilization": number,
      "priority": "string" // efficiency, speed, quality
    },
    "optimizationType": "string" // standard, advanced, experimental
  }
  ```
- **响应格式**: 
  ```json
  {
    "success": true,
    "message": "优化任务已提交",
    "taskId": "string"
  }
  ```
- **示例**: 
  ```bash
  curl -X POST -H "Content-Type: application/json" -d '{
    "name": "测试优化任务",
    "designSteelIds": ["id1", "id2"],
    "modulusSteelIds": ["id3", "id4"],
    "constraints": {
      "maxWaste": 10,
      "minUtilization": 90,
      "priority": "efficiency"
    },
    "optimizationType": "standard"
  }' http://localhost:8888/.netlify/functions/optimize
  ```

### 5.3 获取任务详情

- **端点**: `/task?id={taskId}`
- **方法**: GET
- **描述**: 获取特定优化任务的详细信息和结果
- **请求参数**: 
  - `id`: 任务ID
- **响应格式**: 
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "name": "string",
      "status": "string",
      "priority": number,
      "createdAt": "string",
      "updatedAt": "string",
      "completedAt": "string",
      "input": { ... }, // 输入参数
      "output": { ... }, // 优化结果
      "statistics": { ... } // 统计信息
    }
  }
  ```
- **示例**: 
  ```bash
  curl http://localhost:8888/.netlify/functions/task?id=task123
  ```

## 6. 系统状态API

### 6.1 系统健康检查

- **端点**: `/health`
- **方法**: GET
- **描述**: 检查系统健康状态
- **请求参数**: 无
- **响应格式**: 
  ```json
  {
    "success": true,
    "status": "ok",
    "timestamp": "string",
    "version": "string",
    "components": {
      "database": "ok",
      "api": "ok",
      "functions": "ok"
    }
  }
  ```
- **示例**: 
  ```bash
  curl http://localhost:8888/.netlify/functions/health
  ```

### 6.2 系统统计信息

- **端点**: `/stats`
- **方法**: GET
- **描述**: 获取系统统计信息
- **请求参数**: 无
- **响应格式**: 
  ```json
  {
    "success": true,
    "data": {
      "designSteelsCount": number,
      "modulusSteelsCount": number,
      "optimizationTasksCount": number,
      "completedTasksCount": number,
      "averageOptimizationTime": number,
      "totalWasteSaved": number
    }
  }
  ```
- **示例**: 
  ```bash
  curl http://localhost:8888/.netlify/functions/stats
  ```

## 7. 数据导出API

### 7.1 导出优化结果

- **端点**: `/export`
- **方法**: POST
- **描述**: 导出优化结果为Excel或PDF格式
- **请求参数**: 
  ```json
  {
    "taskId": "string",
    "format": "string" // excel, pdf
  }
  ```
- **响应格式**: 
  ```json
  {
    "success": true,
    "message": "导出成功",
    "downloadUrl": "string"
  }
  ```
- **示例**: 
  ```bash
  curl -X POST -H "Content-Type: application/json" -d '{
    "taskId": "task123",
    "format": "excel"
  }' http://localhost:8888/.netlify/functions/export
  ```

## 8. 错误代码

| 状态码 | 错误类型 | 描述 |
|--------|----------|------|
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未授权访问 |
| 403 | Forbidden | 禁止访问 |
| 404 | Not Found | 资源不存在 |
| 500 | Internal Server Error | 服务器内部错误 |
| 503 | Service Unavailable | 服务不可用 |

## 9. 示例响应错误格式

```json
{
  "success": false,
  "error": "请求参数错误",
  "details": "缺少必要的fileType参数",
  "statusCode": 400
}
```

---

本API文档将定期更新，请确保使用最新版本。如有任何疑问或建议，请联系系统管理员。