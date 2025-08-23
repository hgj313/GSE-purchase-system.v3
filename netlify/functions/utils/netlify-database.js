/**
 * Netlify函数专用内存数据库
 * 完全避免文件系统操作和ES模块兼容性问题
 */
class NetlifyDatabase {
  constructor() {
    this.data = this.getDefaultData();
    this.initialized = false;
  }

  /**
   * 获取默认数据结构
   */
  getDefaultData() {
    return {
      designSteels: [],
      moduleSteels: [
        {
          id: 'default_1',
          name: '12米标准钢材',
          length: 12000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'default_2', 
          name: '9米标准钢材',
          length: 9000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'default_3',
          name: '6米标准钢材', 
          length: 6000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      optimizationTasks: [],
      systemStats: {
        totalOptimizations: 0,
        totalDesignSteels: 0,
        totalModuleSteels: 3,
        totalSavedCost: 0,
        lastUpdated: new Date().toISOString()
      },
      operationLogs: [],
      settings: {
        autoBackup: false, // 内存数据库不需要备份
        maxLogEntries: 100,
        maxBackups: 0
      }
    };
  }

  /**
   * 初始化数据库（空操作，内存数据库不需要）
   */
  async init() {
    this.initialized = true;
    return true;
  }

  /**
   * 获取数据库连接
   */
  getConnection() {
    return { data: this.data };
  }

  /**
   * 保存数据（空操作，内存数据库不需要持久化）
   */
  async save() {
    return true;
  }

  /**
   * 重新加载数据（空操作，内存数据库不需要）
   */
  async reload() {
    return true;
  }

  /**
   * 获取数据库统计信息
   */
  getStats() {
    try {
      const data = this.data;
      
      const stats = {
        designSteels: data.designSteels?.length || 0,
        moduleSteels: data.moduleSteels?.length || 0,
        optimizationTasks: data.optimizationTasks?.length || 0,
        completedTasks: data.optimizationTasks?.filter(task => task.status === 'completed')?.length || 0,
        operationLogs: data.operationLogs?.length || 0,
        databaseSize: '内存存储',
        lastUpdated: data.systemStats?.lastUpdated || new Date().toISOString()
      };
      
      return stats;
    } catch (error) {
      console.error('获取数据库统计信息失败:', error);
      return null;
    }
  }

  /**
   * 记录操作日志（简化版）
   */
  async logOperation(type, description, details = null, req = null) {
    try {
      const log = {
        id: Date.now().toString(),
        operationType: type,
        description: description,
        details: details,
        createdAt: new Date().toISOString()
      };

      this.data.operationLogs.push(log);
      
      // 限制日志数量
      const maxLogs = this.data.settings?.maxLogEntries || 100;
      if (this.data.operationLogs.length > maxLogs) {
        this.data.operationLogs = this.data.operationLogs.slice(-maxLogs);
      }
      
      return true;
    } catch (error) {
      console.error('记录操作日志失败:', error);
    }
  }

  /**
   * 更新系统统计
   */
  async updateSystemStats(updates) {
    try {
      this.data.systemStats = {
        ...this.data.systemStats,
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      return true;
    } catch (error) {
      console.error('更新系统统计失败:', error);
    }
  }

  /**
   * 设计钢材CRUD操作
   */
  async saveDesignSteels(steels) {
    try {
      this.data.designSteels = steels.map(steel => ({
        ...steel,
        updatedAt: new Date().toISOString(),
        createdAt: steel.createdAt || new Date().toISOString()
      }));
      
      await this.updateSystemStats({
        totalDesignSteels: steels.length
      });
      
      return true;
    } catch (error) {
      console.error('保存设计钢材失败:', error);
      return false;
    }
  }

  getDesignSteels() {
    return this.data.designSteels || [];
  }

  /**
   * 模数钢材CRUD操作
   */
  async saveModuleSteels(steels) {
    try {
      this.data.moduleSteels = steels.map(steel => ({
        ...steel,
        updatedAt: new Date().toISOString(),
        createdAt: steel.createdAt || new Date().toISOString()
      }));
      
      await this.updateSystemStats({
        totalModuleSteels: steels.length
      });
      
      return true;
    } catch (error) {
      console.error('保存模数钢材失败:', error);
      return false;
    }
  }

  getModuleSteels() {
    return this.data.moduleSteels || [];
  }

  /**
   * 优化任务CRUD操作
   */
  async saveOptimizationTask(task) {
    try {
      const existingIndex = this.data.optimizationTasks.findIndex(t => t.id === task.id);
      
      const taskWithTimestamp = {
        ...task,
        updatedAt: new Date().toISOString(),
        createdAt: task.createdAt || new Date().toISOString()
      };
      
      if (existingIndex >= 0) {
        this.data.optimizationTasks[existingIndex] = taskWithTimestamp;
      } else {
        this.data.optimizationTasks.push(taskWithTimestamp);
      }
      
      // 如果是完成状态，更新总优化次数
      if (task.status === 'completed') {
        const completedCount = this.data.optimizationTasks.filter(t => t.status === 'completed').length;
        await this.updateSystemStats({
          totalOptimizations: completedCount
        });
      }
      
      return true;
    } catch (error) {
      console.error('保存优化任务失败:', error);
      return false;
    }
  }

  getOptimizationTasks() {
    return this.data.optimizationTasks || [];
  }

  getOptimizationTask(id) {
    return this.data.optimizationTasks?.find(task => task.id === id) || null;
  }

  /**
   * 创建新的优化任务
   */
  async createOptimizationTask(taskData) {
    try {
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newTask = {
        id: taskId,
        status: 'pending',
        progress: 0,
        message: '任务已创建，等待执行',
        results: null,
        error: null,
        executionTime: 0,
        startTime: new Date().toISOString(),
        endTime: null,
        inputData: {
          designSteelsCount: taskData.designSteels?.length || 0,
          moduleSteelsCount: taskData.moduleSteels?.length || 0,
          constraints: taskData.constraints || {}
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      this.data.optimizationTasks.push(newTask);
      return taskId;
    } catch (error) {
      console.error('创建优化任务失败:', error);
      throw error;
    }
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(taskId, status, updates = {}) {
    try {
      const taskIndex = this.data.optimizationTasks.findIndex(t => t.id === taskId);
      
      if (taskIndex === -1) {
        throw new Error(`任务不存在: ${taskId}`);
      }
      
      const task = this.data.optimizationTasks[taskIndex];
      
      // 更新任务数据
      this.data.optimizationTasks[taskIndex] = {
        ...task,
        status: status,
        updatedAt: new Date().toISOString(),
        ...updates
      };
      
      // 如果任务完成或失败，设置结束时间
      if (status === 'completed' || status === 'failed') {
        this.data.optimizationTasks[taskIndex].endTime = new Date().toISOString();
        
        // 计算执行时间
        const startTime = new Date(task.startTime).getTime();
        const endTime = Date.now();
        this.data.optimizationTasks[taskIndex].executionTime = endTime - startTime;
      }
      
      return true;
    } catch (error) {
      console.error('更新任务状态失败:', error);
      return false;
    }
  }

  /**
   * 更新任务进度
   */
  async updateTaskProgress(taskId, progress, message = '') {
    try {
      const taskIndex = this.data.optimizationTasks.findIndex(t => t.id === taskId);
      
      if (taskIndex === -1) {
        console.warn(`任务不存在: ${taskId}`);
        return false;
      }
      
      this.data.optimizationTasks[taskIndex].progress = progress;
      this.data.optimizationTasks[taskIndex].message = message;
      this.data.optimizationTasks[taskIndex].updatedAt = new Date().toISOString();
      
      console.log(`📊 任务进度更新: ${taskId} -> ${progress}% (${message})`);
      return true;
    } catch (error) {
      console.error('更新任务进度失败:', error);
      return false;
    }
  }

  /**
   * 设置任务结果
   */
  async setTaskResults(taskId, results) {
    try {
      // 确保results是可序列化的对象
      let resultsToSave = results;
      if (typeof results !== 'object' || results === null) {
        resultsToSave = { value: results };
      }
      
      return await this.updateTaskStatus(taskId, 'completed', {
        results: JSON.stringify(resultsToSave),
        progress: 100,
        message: resultsToSave.success ? '优化完成' : '优化完成但有警告'
      });
    } catch (error) {
      console.error('设置任务结果失败:', error);
      return false;
    }
  }

  /**
   * 设置任务错误
   */
  async setTaskError(taskId, error) {
    try {
      // 灵活处理不同格式的错误信息
      let errorMessage = '未知错误';
      let errorDetails = null;
      
      if (error && typeof error === 'object') {
        errorMessage = error.message || '未知错误';
        
        errorDetails = {
          message: error.message,
          stack: error.stack,
          timestamp: error.timestamp || new Date().toISOString()
        };
      } else {
        errorMessage = String(error);
      }
      
      return await this.updateTaskStatus(taskId, 'failed', {
        error: errorMessage,
        errorDetails: errorDetails,
        message: `优化失败: ${errorMessage}`
      });
    } catch (error) {
      console.error('设置任务错误失败:', error);
      return false;
    }
  }

  /**
   * 获取活跃任务（正在执行的任务）
   */
  getActiveTasks() {
    return this.data.optimizationTasks?.filter(task => 
      task.status === 'pending' || task.status === 'running'
    ) || [];
  }

  /**
   * 清理过期任务（超过24小时的已完成任务）
   */
  async cleanupExpiredTasks() {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const beforeCount = this.data.optimizationTasks.length;
      this.data.optimizationTasks = this.data.optimizationTasks.filter(task => {
        // 保留活跃任务和24小时内的任务
        return (task.status === 'pending' || task.status === 'running') || 
               (task.updatedAt > oneDayAgo);
      });
      
      const afterCount = this.data.optimizationTasks.length;
      const cleanedCount = beforeCount - afterCount;
      
      if (cleanedCount > 0) {
        console.log(`🧹 清理了 ${cleanedCount} 个过期任务`);
      }
      
      return cleanedCount;
    } catch (error) {
      console.error('清理过期任务失败:', error);
      return 0;
    }
  }

  /**
   * 获取操作日志
   */
  getOperationLogs(limit = 100) {
    const logs = this.data.operationLogs || [];
    return logs.slice(-limit).reverse(); // 返回最新的日志
  }

  /**
   * 导出数据
   */
  async exportData() {
    try {
      return {
        exportTime: new Date().toISOString(),
        version: '3.0.0',
        data: this.data
      };
    } catch (error) {
      console.error('导出数据失败:', error);
      return null;
    }
  }

  /**
   * 导入数据
   */
  async importData(data) {
    try {
      // 验证数据格式
      if (!data.data || typeof data.data !== 'object') {
        throw new Error('无效的数据格式');
      }
      
      // 合并数据
      this.data = {
        ...this.getDefaultData(),
        ...data.data
      };
      
      console.log('✅ 数据导入成功');
      return true;
    } catch (error) {
      console.error('❌ 数据导入失败:', error);
      return false;
    }
  }
}

// 创建单例实例
const netlifyDatabase = new NetlifyDatabase();

// 兼容CommonJS和ES模块
module.exports = netlifyDatabase;