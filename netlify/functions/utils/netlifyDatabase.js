/**
 * Netlify云端数据库适配器
 * 解决Netlify Functions的文件系统权限问题
 * 使用内存数据库 + 临时文件系统的方式
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: process.env.ENV_FILE || '.env' });

const dbConfig = {
  storageType: process.env.STORAGE_TYPE || 'memory',
  connectionString: process.env.DATABASE_URL
};

class NetlifyDatabase {
  constructor() {
    this.data = null;
    this.initialized = false;
    this.initPromise = null;
  }

  /**
   * 初始化Netlify云端数据库
   * 使用内存存储，避免文件系统权限问题
   */
  async init() {
    if (this.initialized) return true;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._initialize();
    const result = await this.initPromise;
    this.initPromise = null;
    return result;
  }

  async _initialize() {
    try {
      console.log('🌐 初始化Netlify云端数据库...');

      // 存储模式检查
      if (process.env.STORAGE_TYPE !== 'memory') {
        console.warn('⚠️ 当前使用内存存储模式，无需数据库配置');
      }
      
      // 在Netlify环境中使用内存存储
      this.data = this.getDefaultData();
      
      // 尝试从环境变量加载预设数据（如果有）
      if (process.env.NETLIFY_DATA) {
        try {
          this.data = JSON.parse(process.env.NETLIFY_DATA);
          console.log('✅ 从环境变量加载预设数据');
        } catch (e) {
          console.log('⚠️ 环境变量数据格式错误，使用默认数据');
        }
      }

      console.log('✅ Netlify云端数据库初始化成功');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('❌ Netlify数据库初始化失败:', error);
      return false;
    }
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
        autoBackup: false, // 云端环境禁用自动备份
        maxLogEntries: 100,
        maxBackups: 5
      }
    };
  }

  /**
   * 创建优化任务
   */
  async createOptimizationTask(taskData) {
    try {
      await this.init();
      
      const taskId = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      const task = {
        id: taskId,
        designSteels: taskData.designSteels || [],
        moduleSteels: taskData.moduleSteels || [],
        constraints: taskData.constraints || {},
        status: 'pending',
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        results: null,
        error: null
      };

      this.data.optimizationTasks.push(task);
      this.data.systemStats.totalOptimizations++;
      this.data.systemStats.lastUpdated = new Date().toISOString();

      console.log(`✅ 云端任务创建成功: ${taskId}`);
      return taskId;
    } catch (error) {
      console.error('❌ 创建云端任务失败:', error);
      throw error;
    }
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(taskId, status) {
    try {
      await this.init();
      const task = this.data.optimizationTasks.find(t => t.id === taskId);
      if (task) {
        task.status = status;
        task.updatedAt = new Date().toISOString();
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ 更新任务状态失败:', error);
      return false;
    }
  }

  /**
   * 更新任务进度
   */
  async updateTaskProgress(taskId, progress, message) {
    try {
      await this.init();
      const task = this.data.optimizationTasks.find(t => t.id === taskId);
      if (task) {
        task.progress = progress;
        task.message = message;
        task.updatedAt = new Date().toISOString();
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ 更新任务进度失败:', error);
      return false;
    }
  }

  /**
   * 设置任务结果
   */
  async setTaskResults(taskId, results) {
    try {
      await this.init();
      const task = this.data.optimizationTasks.find(t => t.id === taskId);
      if (task) {
        task.results = results;
        task.status = results.success ? 'completed' : 'failed';
        task.progress = 100;
        task.updatedAt = new Date().toISOString();
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ 设置任务结果失败:', error);
      return false;
    }
  }

  /**
   * 设置任务错误
   */
  async setTaskError(taskId, error) {
    try {
      await this.init();
      const task = this.data.optimizationTasks.find(t => t.id === taskId);
      if (task) {
        task.error = error;
        task.status = 'failed';
        task.progress = 100;
        task.updatedAt = new Date().toISOString();
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ 设置任务错误失败:', error);
      return false;
    }
  }

  /**
   * 获取任务
   */
  async getTask(taskId) {
    await this.init();
    return this.data.optimizationTasks.find(t => t.id === taskId);
  }

  /**
   * 获取所有优化任务
   */
  getOptimizationTasks() {
    return this.data.optimizationTasks || [];
  }

  /**
   * 获取特定优化任务
   */
  getOptimizationTask(taskId) {
    return this.data.optimizationTasks.find(task => task.id === taskId) || null;
  }

  /**
   * 更新任务状态（带额外数据）
   */
  async updateTaskStatus(taskId, status, extraData = {}) {
    try {
      await this.init();
      const task = this.data.optimizationTasks.find(t => t.id === taskId);
      if (task) {
        task.status = status;
        if (extraData.message) task.message = extraData.message;
        task.updatedAt = new Date().toISOString();
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ 更新任务状态失败:', error);
      return false;
    }
  }

  /**
   * 获取数据库统计信息
   */
  getStats() {
    if (!this.data) {
      return {
        designSteels: 0,
        moduleSteels: 3,
        optimizationTasks: 0,
        completedTasks: 0,
        operationLogs: 0,
        databaseSize: '内存存储',
        lastUpdated: new Date().toISOString()
      };
    }

    return {
      designSteels: this.data.designSteels?.length || 0,
      moduleSteels: this.data.moduleSteels?.length || 0,
      optimizationTasks: this.data.optimizationTasks?.length || 0,
      completedTasks: this.data.optimizationTasks?.filter(task => task.status === 'completed')?.length || 0,
      operationLogs: this.data.operationLogs?.length || 0,
      databaseSize: '内存存储',
      lastUpdated: this.data.systemStats?.lastUpdated || new Date().toISOString()
    };
  }

  /**
   * 获取数据库连接
   */
  getConnection() {
    if (!this.initialized) {
      throw new Error('Netlify云端数据库未初始化');
    }
    return this;
  }
}

// 创建单例实例
const netlifyDb = new NetlifyDatabase();

module.exports = netlifyDb;