import { OptimizationConstraints } from './types';

export const DEFAULT_CONSTRAINTS: OptimizationConstraints = {
  wasteThreshold: 600,        // 废料阈值 (mm)
  targetLossRate: 5,          // 目标损耗率 (%)
  timeLimit: 300,           // 计算时间限制 (秒)
  maxWeldingSegments: 1,      // 最大焊接次数 (次) - 对应后端2段，允许1次焊接
};

// API配置 - 根据环境自动选择正确的API路径
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/.netlify/functions' 
  : '/api';

// 具体的API端点
export const API_ENDPOINTS = {
  OPTIMIZE: `${API_BASE_URL}/optimize`,
  UPLOAD_DESIGN_STEELS: `${API_BASE_URL}/upload-design-steels`,
  EXPORT_EXCEL: `${API_BASE_URL}/export`,
  EXPORT_PDF: `${API_BASE_URL}/export`,
  HEALTH: `${API_BASE_URL}/health`,
  STATS: `${API_BASE_URL}/stats`,
  HISTORY: `${API_BASE_URL}/history`
};