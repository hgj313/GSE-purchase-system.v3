// Netlify函数任务管理器
class TaskManager {
  constructor() {
    this.tasks = new Map();
    this.maxConcurrentTasks = 3;
  }

  async createTask(taskData) {
    const taskId = this.generateTaskId();
    const task = {
      id: taskId,
      status: 'pending',
      progress: 0,
      data: taskData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.tasks.set(taskId, task);
    return taskId;
  }

  async getTask(taskId) {
    return this.tasks.get(taskId) || null;
  }

  async updateTask(taskId, updates) {
    const task = this.tasks.get(taskId);
    if (!task) return false;
    
    Object.assign(task, updates, { updatedAt: new Date().toISOString() });
    this.tasks.set(taskId, task);
    return true;
  }

  async deleteTask(taskId) {
    return this.tasks.delete(taskId);
  }

  async getActiveTasks() {
    return Array.from(this.tasks.values())
      .filter(task => ['pending', 'running'].includes(task.status));
  }

  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 清理完成的任务
  async cleanup() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24小时前
    for (const [taskId, task] of this.tasks) {
      const taskTime = new Date(task.createdAt).getTime();
      if (taskTime < cutoff && ['completed', 'failed', 'cancelled'].includes(task.status)) {
        this.tasks.delete(taskId);
      }
    }
  }
}

module.exports = { TaskManager };