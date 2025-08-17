// 全面诊断工具 - 检查API调用和数据流程
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 配置项
const CONFIG = {
  API_BASE_URL: 'http://localhost:5000',
  OUTPUT_DIR: path.join(__dirname, 'diagnostic-output'),
  TEST_ID: uuidv4().substring(0, 8), // 生成短ID用于标识测试
};

// 确保输出目录存在
if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
  fs.mkdirSync(CONFIG.OUTPUT_DIR);
}

// 日志函数
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}
`;
  console.log(logMessage);
  fs.appendFileSync(path.join(CONFIG.OUTPUT_DIR, 'diagnostic.log'), logMessage);
}

// 保存数据到文件
function saveData(filename, data) {
  const filePath = path.join(CONFIG.OUTPUT_DIR, `${CONFIG.TEST_ID}-${filename}`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  log(`数据已保存到: ${filePath}`);
  return filePath;
}

// 模拟用户数据
const testData = {
  solutions: {
    "320*320*12-12000mm模数钢材": {
      cuttingPlans: [{
        sourceType: "module",
        moduleType: "320*320*12-12000mm模数钢材",
        moduleLength: 12000,
        cuts: [
          { length: 3000, quantity: 4 },
          { length: 2000, quantity: 3 }
        ],
        waste: 600,
        newRemainders: [{ length: 400 }]
      }]
    },
    "[150*5-12000mm模数钢材": {
      cuttingPlans: [{
        sourceType: "module",
        moduleType: "[150*5-12000mm模数钢材",
        moduleLength: 12000,
        cuts: [
          { length: 2500, quantity: 4 },
          { length: 1800, quantity: 2 }
        ],
        waste: 400,
        newRemainders: [{ length: 600 }]
      }]
    }
  },
  specificationStats: {
    "320*320*12-12000mm模数钢材": {
      lossRate: 5.0,
      utilization: 95.0,
      totalMaterial: 144000
    },
    "[150*5-12000mm模数钢材": {
      lossRate: 3.3,
      utilization: 96.7,
      totalMaterial: 120000
    }
  },
  totalLossRate: 4.2
};

// 检查API可用性
async function checkApiHealth() {
  log('开始检查API健康状态');
  try {
    const response = await axios.get(`${CONFIG.API_BASE_URL}/api/health`);
    log(`API健康状态: ${response.status} ${response.data.status}`);
    return response.status === 200;
  } catch (error) {
    log(`API健康检查失败: ${error.message}`, 'error');
    return false;
  }
}

// 跟踪数据流向和API调用
async function trackDataFlow() {
  log('开始跟踪数据流向和API调用');

  // 保存初始测试数据
  const testDataPath = saveData('initial-test-data.json', testData);
  log(`初始测试数据: ${JSON.stringify(testData).substring(0, 100)}...`);

  try {
    // 1. 调用优化API
    log('调用优化API');
    const optimizeResponse = await axios.post(
      `${CONFIG.API_BASE_URL}/api/optimize`,
      { design: testData }
    );
    log(`优化API响应: ${optimizeResponse.status}`);
    saveData('optimize-response.json', optimizeResponse.data);

    // 2. 调用导出Excel API
    log('调用导出Excel API');
    const exportResponse = await axios.post(
      `${CONFIG.API_BASE_URL}/api/export/excel`,
      { optimizationResult: testData, exportOptions: {} },
      { responseType: 'arraybuffer' }
    );
    log(`导出Excel API响应: ${exportResponse.status}`);

    // 保存Excel文件
    const excelPath = path.join(CONFIG.OUTPUT_DIR, `${CONFIG.TEST_ID}-export-result.xlsx`);
    fs.writeFileSync(excelPath, Buffer.from(exportResponse.data, 'binary'));
    log(`Excel文件已保存到: ${excelPath}`);

    // 3. 检查约束验证
    log('调用约束验证API');
    const validateResponse = await axios.post(
      `${CONFIG.API_BASE_URL}/api/validate-constraints`,
      { design: testData }
    );
    log(`约束验证API响应: ${validateResponse.status}`);
    saveData('validate-response.json', validateResponse.data);

    log('数据流向跟踪完成');
    return true;

  } catch (error) {
    log(`数据流向跟踪失败: ${error.message}`, 'error');
    log(`错误详情: ${JSON.stringify(error.response?.data || {})}`, 'error');
    return false;
  }
}

// 检查数据是否被覆盖
async function checkDataOverwrite() {
  log('开始检查数据是否被覆盖');

  // 创建唯一标识的数据
  const uniqueData = {
    testId: CONFIG.TEST_ID,
    timestamp: new Date().toISOString(),
    randomValue: Math.random()
  };

  // 保存到临时文件
  const tempFilePath = path.join(CONFIG.OUTPUT_DIR, 'temp-data.json');
  fs.writeFileSync(tempFilePath, JSON.stringify(uniqueData));
  log(`已创建临时数据文件: ${tempFilePath}`);

  // 等待一段时间
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 读取文件检查是否变化
  const fileContent = fs.readFileSync(tempFilePath, 'utf8');
  const currentData = JSON.parse(fileContent);

  if (currentData.testId === CONFIG.TEST_ID && currentData.randomValue === uniqueData.randomValue) {
    log('数据未被覆盖，验证通过');
    return true;
  } else {
    log('数据可能已被覆盖，验证失败', 'warning');
    log(`原始数据: ${JSON.stringify(uniqueData)}`);
    log(`当前数据: ${JSON.stringify(currentData)}`);
    return false;
  }
}

// 检查API路由是否正确
async function checkApiRoutes() {
  log('开始检查API路由是否正确');

  const routesToCheck = [
    { path: '/api/health', method: 'get' },
    { path: '/api/optimize', method: 'post' },
    { path: '/api/export/excel', method: 'post' },
    { path: '/api/validate-constraints', method: 'post' },
    { path: '/api/stats', method: 'get' }
  ];

  const results = [];

  for (const route of routesToCheck) {
    try {
      let response;
      if (route.method === 'get') {
        response = await axios.get(`${CONFIG.API_BASE_URL}${route.path}`);
      } else {
        response = await axios[route.method](`${CONFIG.API_BASE_URL}${route.path}`, {});
      }
      results.push({
        route: route.path,
        method: route.method,
        status: response.status,
        success: response.status >= 200 && response.status < 300
      });
      log(`路由检查 ${route.method.toUpperCase()} ${route.path}: ${response.status}`);
    } catch (error) {
      results.push({
        route: route.path,
        method: route.method,
        status: error.response?.status || 500,
        success: false
      });
      log(`路由检查失败 ${route.method.toUpperCase()} ${route.path}: ${error.message}`, 'error');
    }
  }

  saveData('api-routes-check.json', results);
  return results.every(r => r.success);
}

// 主函数
async function runDiagnostic() {
  log(`===== 诊断开始 (测试ID: ${CONFIG.TEST_ID}) =====`);

  // 1. 检查API健康状态
  const isApiHealthy = await checkApiHealth();
  if (!isApiHealthy) {
    log('API不健康，诊断终止', 'error');
    return;
  }

  // 2. 检查API路由
  await checkApiRoutes();

  // 3. 跟踪数据流向
  await trackDataFlow();

  // 4. 检查数据是否被覆盖
  await checkDataOverwrite();

  log(`===== 诊断完成 (测试ID: ${CONFIG.TEST_ID}) =====`);
  log(`诊断报告已保存到: ${CONFIG.OUTPUT_DIR}`);
}

// 运行诊断
runDiagnostic().catch(error => {
  log(`诊断过程中发生错误: ${error.message}`, 'error');
  log(`错误堆栈: ${error.stack}`, 'error');
});