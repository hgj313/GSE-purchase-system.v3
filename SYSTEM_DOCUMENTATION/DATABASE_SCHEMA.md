# 数据库Schema文档

## 1. 概述

本文档详细描述了钢材优化系统的数据库结构，包括表定义、字段说明、关系模型和索引设计。系统使用内存数据库进行本地开发和测试。

## 2. 数据库设计原则

- 规范化设计：遵循第三范式(3NF)，减少数据冗余
- 性能优化：为常用查询字段创建索引
- 可扩展性：设计支持未来功能扩展
- 数据完整性：使用约束确保数据一致性
- 安全性：敏感数据加密存储

## 3. 实体关系图(ERD)

```
+-----------------+       +-------------------+       +------------------+
| design_steels   |       | optimization_tasks|       | modulus_steels   |
+-----------------+       +-------------------+       +------------------+
| id              |       | id                |       | id               |
| length          |       | name              |       | length           |
| quantity        |       | status            |       | quantity         |
| type            |       | priority          |       | type             |
| created_at      |       | created_at        |       | modulus          |
| updated_at      |       | updated_at        |       | created_at       |
+-----------------+       | completed_at      |       | updated_at       |
        |                 | design_steel_ids  |       +------------------+
        |                 | modulus_steel_ids |
        |                 | constraints       |
        |                 | optimization_type |
        |                 | output            |
        |                 | statistics        |
        |                 +-------------------+
        |                         |
        |                         |
        v                         v
+-----------------+       +-------------------+
| cut_patterns    |       | optimization_logs |
+-----------------+       +-------------------+
| id              |       | id                |
| task_id         |       | task_id           |
| design_steel_id |       | message           |
| modulus_steel_id|       | level             |
| quantity        |       | timestamp         |
| waste           |       +-------------------+
| efficiency      |
| created_at      |
+-----------------+
```

## 4. 表结构定义

### 4.1 design_steels表

存储设计钢材信息

| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| id | VARCHAR(36) | PRIMARY KEY | 唯一标识符 |
| length | DECIMAL(10,2) | NOT NULL | 钢材长度 |
| quantity | INTEGER | NOT NULL | 数量 |
| type | VARCHAR(50) | NOT NULL | 钢材类型 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

### 4.2 modulus_steels表

存储模数钢材信息

| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| id | VARCHAR(36) | PRIMARY KEY | 唯一标识符 |
| length | DECIMAL(10,2) | NOT NULL | 钢材长度 |
| quantity | INTEGER | NOT NULL | 数量 |
| type | VARCHAR(50) | NOT NULL | 钢材类型 |
| modulus | DECIMAL(10,2) | NOT NULL | 模数 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

### 4.3 optimization_tasks表

存储优化任务信息

| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| id | VARCHAR(36) | PRIMARY KEY | 唯一标识符 |
| name | VARCHAR(100) | NOT NULL | 任务名称 |
| status | VARCHAR(20) | NOT NULL | 任务状态(pending, processing, completed, failed) |
| priority | INTEGER | DEFAULT 0 | 优先级 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |
| completed_at | TIMESTAMP | NULL | 完成时间 |
| design_steel_ids | JSON | NOT NULL | 设计钢材ID列表 |
| modulus_steel_ids | JSON | NOT NULL | 模数钢材ID列表 |
| constraints | JSON | NOT NULL | 约束条件 |
| optimization_type | VARCHAR(20) | NOT NULL | 优化类型 |
| output | JSON | NULL | 优化结果 |
| statistics | JSON | NULL | 统计信息 |

### 4.4 cut_patterns表

存储切割方案信息

| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| id | VARCHAR(36) | PRIMARY KEY | 唯一标识符 |
| task_id | VARCHAR(36) | FOREIGN KEY | 关联的优化任务ID |
| design_steel_id | VARCHAR(36) | FOREIGN KEY | 关联的设计钢材ID |
| modulus_steel_id | VARCHAR(36) | FOREIGN KEY | 关联的模数钢材ID |
| quantity | INTEGER | NOT NULL | 数量 |
| waste | DECIMAL(10,2) | NOT NULL | 废料率 |
| efficiency | DECIMAL(5,2) | NOT NULL | 效率 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |

### 4.5 optimization_logs表

存储优化任务日志

| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| id | VARCHAR(36) | PRIMARY KEY | 唯一标识符 |
| task_id | VARCHAR(36) | FOREIGN KEY | 关联的优化任务ID |
| message | TEXT | NOT NULL | 日志消息 |
| level | VARCHAR(10) | NOT NULL | 日志级别(info, warning, error) |
| timestamp | TIMESTAMP | NOT NULL | 日志时间 |

## 5. 索引设计

| 表名 | 索引字段 | 类型 | 描述 |
|------|----------|------|------|
| design_steels | length, type | 复合索引 | 优化按长度和类型查询 |
| modulus_steels | length, modulus | 复合索引 | 优化按长度和模数查询 |
| optimization_tasks | status, priority | 复合索引 | 优化任务列表查询 |
| optimization_tasks | created_at | 单字段索引 | 优化按创建时间查询 |
| cut_patterns | task_id | 单字段索引 | 优化按任务ID查询 |
| optimization_logs | task_id, timestamp | 复合索引 | 优化按任务ID和时间查询 |

## 6. 视图定义

### 6.1 v_optimization_results视图

```sql
CREATE VIEW v_optimization_results AS
SELECT
  t.id AS task_id,
  t.name AS task_name,
  t.status,
  t.completed_at,
  t.statistics,
  COUNT(p.id) AS pattern_count,
  SUM(p.waste) AS total_waste,
  AVG(p.efficiency) AS avg_efficiency
FROM
  optimization_tasks t
LEFT JOIN
  cut_patterns p ON t.id = p.task_id
GROUP BY
  t.id;
```

## 7. 数据导出

### 7.1 导出内存数据库数据

本地开发环境中，可以使用以下命令导出内存数据库数据：

```bash
# 导出数据为JSON文件
node export-database.js > db-export.json
```

## 8. 数据备份

本地开发环境中，可以定期备份内存数据库数据：

```bash
# 备份数据为JSON文件
node export-database.js > backup_$(date +%Y%m%d).json
```

## 9. 数据库安全

本地开发环境中，请注意以下安全事项：

- 保护数据库配置文件，避免泄露敏感信息
- 定期备份数据，防止数据丢失
- 开发完成后清除测试数据
- 注意保护包含数据库连接信息的环境变量文件

---

本数据库schema文档将随系统更新而定期维护。如有任何变更，请参考最新版本。