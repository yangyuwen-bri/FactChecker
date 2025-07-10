const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3001';

// 🧪 边界情况和问题案例测试
console.log('🧪 事实核查 API - 边界情况测试');
console.log(`🌐 测试目标: ${BASE_URL}\n`);

// 测试案例数据
const edgeCases = {
  // 问题案例1: 复杂历史声明
  complexHistorical: {
    name: "复杂历史声明（周瑜案例）",
    content: "周瑜是被诸葛亮气死的",
    description: "涉及历史真实性vs文学虚构的复杂判断",
    expectedIssue: "HTTP 500 Overloaded 错误",
    category: "历史文化"
  },
  
  // 测试案例2: 超长文本
  longContent: {
    name: "超长文本处理",
    content: "人工智能".repeat(1000) + "是未来科技发展的重要方向",
    description: "测试极长文本的处理能力",
    expectedIssue: "可能的token超限",
    category: "文本长度"
  },
  
  // 测试案例3: 多层嵌套复杂声明
  nestedComplex: {
    name: "多层嵌套复杂声明",
    content: "根据2023年的研究报告，基于深度学习的大语言模型在某些特定任务上的表现超过了人类专家，但在需要常识推理的复杂场景中仍然存在幻觉问题，特别是当涉及到跨领域知识整合时，模型往往会产生看似合理但实际错误的输出。",
    description: "包含多个可验证声明的复杂句子",
    expectedIssue: "声明提取和验证的复杂性",
    category: "技术复杂"
  },
  
  // 测试案例4: 敏感历史话题
  sensitiveHistorical: {
    name: "敏感历史话题",
    content: "第二次世界大战期间发生了很多重大事件",
    description: "测试历史敏感内容的处理",
    expectedIssue: "可能的内容安全检查",
    category: "内容安全"
  }
};

// 🔧 工具函数
function logTest(testName, status, details = '') {
  const symbols = {
    start: '🔍',
    success: '✅',
    failure: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  console.log(`${symbols[status]} ${testName}${details ? ': ' + details : ''}`);
}

function measureTime(startTime) {
  return Date.now() - startTime;
}

// 📊 性能监控
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
  }
  
  startTimer(operation) {
    this.metrics[operation] = { startTime: Date.now() };
  }
  
  endTimer(operation, success = true, error = null) {
    if (this.metrics[operation]) {
      this.metrics[operation].duration = Date.now() - this.metrics[operation].startTime;
      this.metrics[operation].success = success;
      this.metrics[operation].error = error;
    }
  }
  
  getReport() {
    return this.metrics;
  }
}

const monitor = new PerformanceMonitor();

// 🧪 测试函数

async function testHealthCheck() {
  logTest('健康检查', 'start');
  monitor.startTimer('health_check');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    monitor.endTimer('health_check', true);
    logTest('健康检查', 'success', `${response.status} - ${response.data.status}`);
    return true;
  } catch (error) {
    monitor.endTimer('health_check', false, error.message);
    logTest('健康检查', 'failure', error.message);
    return false;
  }
}

async function testComplexClaim(testCase) {
  const startTime = Date.now();
  logTest(`测试: ${testCase.name}`, 'start', testCase.description);
  
  // 添加与客户端一致的配置
  const maxSearchResults = 3; // 🎯 与客户端保持一致
  
  monitor.startTimer(`extract_${testCase.category}`);
  
  try {
    // 第一步: 提取声明
    logTest('  → 提取声明', 'start');
    const claimsResponse = await axios.post(`${BASE_URL}/api/claims/extract`, {
      content: testCase.content
    }, { timeout: 30000 });
    
    monitor.endTimer(`extract_${testCase.category}`, true);
    const claims = claimsResponse.data.data.claims;
    
    if (claims.length === 0) {
      logTest('  → 提取声明', 'warning', '未提取到声明');
      return { success: false, reason: 'no_claims' };
    }
    
    const firstClaim = claims[0];
    logTest('  → 提取声明', 'success', 
      `提取到 ${claims.length} 个声明，测试第一个: "${firstClaim.claim.substring(0, 50)}..."`);
    
    // 第二步: 搜索信息源
    logTest('  → 搜索信息源', 'start');
    monitor.startTimer(`search_${testCase.category}`);
    
    const searchResponse = await axios.post(`${BASE_URL}/api/search/exa`, {
      claim: firstClaim.claim
    }, { timeout: 30000 });
    
    monitor.endTimer(`search_${testCase.category}`, true);
    const sources = searchResponse.data.data.results;
    
    const totalTextLength = sources.reduce((sum, source) => 
      sum + (source.text ? source.text.length : 0), 0);
    
    logTest('  → 搜索信息源', 'success', 
      `找到 ${sources.length} 个源，总长度: ${totalTextLength.toLocaleString()} 字符`);
    
    // 🎯 应用与客户端一致的源数量限制
    const limitedSources = sources.slice(0, maxSearchResults);
    const limitedTextLength = limitedSources.reduce((sum, source) => 
      sum + (source.text ? source.text.length : 0), 0);
    
    logTest('  → 应用源限制', 'info', 
      `限制为前 ${maxSearchResults} 个源，长度: ${limitedTextLength.toLocaleString()} 字符 (减少 ${((totalTextLength - limitedTextLength) / totalTextLength * 100).toFixed(1)}%)`);
    
    // 第三步: 验证声明（关键测试点）
    logTest('  → 验证声明', 'start', '这是关键测试点');
    monitor.startTimer(`verify_${testCase.category}`);
    
    const verifyResponse = await axios.post(`${BASE_URL}/api/verify/claims`, {
      claim: firstClaim.claim,
      original_text: firstClaim.original_text,
      exasources: limitedSources // 🎯 使用限制后的源数量
    }, { timeout: 60000 }); // 更长的超时时间
    
    monitor.endTimer(`verify_${testCase.category}`, true);
    const verification = verifyResponse.data.data;
    
    logTest('  → 验证声明', 'success', 
      `评估: ${verification.assessment}, 置信度: ${verification.confidence_score}%`);
    
    const totalTime = measureTime(startTime);
    logTest(`测试: ${testCase.name}`, 'success', `总耗时: ${totalTime}ms`);
    
    return {
      success: true,
      claims: claims.length,
      totalSources: sources.length,
      usedSources: limitedSources.length,
      totalTextLength,
      usedTextLength: limitedTextLength,
      reductionPercentage: ((totalTextLength - limitedTextLength) / totalTextLength * 100).toFixed(1),
      verification: verification.assessment,
      confidence: verification.confidence_score,
      totalTime
    };
    
  } catch (error) {
    monitor.endTimer(`verify_${testCase.category}`, false, error.message);
    
    // 详细错误分析
    const errorInfo = {
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
      code: error.code
    };
    
    if (error.response?.status === 500 && error.response?.data?.error?.includes('Overloaded')) {
      logTest(`测试: ${testCase.name}`, 'failure', 
        `🎯 仍然出现问题: Claude API Overloaded (${measureTime(startTime)}ms) - 即使限制为${maxSearchResults}个源`);
      
      return {
        success: false,
        reproduced: true,
        expectedIssue: testCase.expectedIssue,
        actualError: errorInfo,
        usedSources: maxSearchResults,
        totalTime: measureTime(startTime)
      };
    } else {
      logTest(`测试: ${testCase.name}`, 'failure', 
        `意外错误: ${errorInfo.status} - ${errorInfo.message}`);
      
      return {
        success: false,
        reproduced: false,
        unexpectedError: errorInfo,
        totalTime: measureTime(startTime)
      };
    }
  }
}

async function testAPILimits() {
  logTest('API 限制测试', 'start');
  
  // 测试空请求
  try {
    await axios.post(`${BASE_URL}/api/claims/extract`, {});
  } catch (error) {
    logTest('  → 空内容验证', 'success', `正确拒绝: ${error.response?.data?.error}`);
  }
  
  // 测试超长单次请求
  try {
    const hugeClaim = 'A'.repeat(100000);
    await axios.post(`${BASE_URL}/api/claims/extract`, {
      content: hugeClaim
    }, { timeout: 10000 });
    logTest('  → 超长内容处理', 'success', '成功处理超长内容');
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      logTest('  → 超长内容处理', 'info', '请求超时（预期行为）');
    } else {
      logTest('  → 超长内容处理', 'warning', `限制生效: ${error.message}`);
    }
  }
}

async function runEdgeCaseTests() {
  console.log('🚀 开始边界情况测试...\n');
  
  // 健康检查
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('\n❌ API 服务不可用，停止测试');
    return;
  }
  
  console.log('\n📋 测试案例列表:');
  Object.values(edgeCases).forEach((testCase, index) => {
    console.log(`  ${index + 1}. ${testCase.name} (${testCase.category})`);
    console.log(`     预期问题: ${testCase.expectedIssue}`);
  });
  
  console.log('\n🧪 开始执行测试...\n');
  
  const results = {};
  
  // 执行所有测试案例
  for (const [key, testCase] of Object.entries(edgeCases)) {
    console.log(`\n${'='.repeat(60)}`);
    results[key] = await testComplexClaim(testCase);
    console.log(`${'='.repeat(60)}`);
    
    // 测试之间稍作停顿，避免频率限制
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // API 限制测试
  console.log(`\n${'='.repeat(60)}`);
  await testAPILimits();
  console.log(`${'='.repeat(60)}`);
  
  // 生成测试报告
  console.log('\n📊 测试报告\n');
  
  let successCount = 0;
  let reproduceCount = 0;
  let errorCount = 0;
  
  for (const [key, result] of Object.entries(results)) {
    const testCase = edgeCases[key];
    console.log(`📋 ${testCase.name}:`);
    
    if (result.success) {
      successCount++;
      console.log(`   ✅ 成功完成 (${result.totalTime}ms)`);
      console.log(`   📊 声明: ${result.claims}, 总源: ${result.totalSources}, 使用源: ${result.usedSources}, 文本长度: ${result.totalTextLength}`);
      if (result.verification) {
        console.log(`   🎯 验证结果: ${result.verification} (${result.confidence}%)`);
      }
    } else if (result.reproduced) {
      reproduceCount++;
      console.log(`   🎯 成功复现预期问题 (${result.totalTime}ms)`);
      console.log(`   ⚠️ 预期: ${result.expectedIssue}`);
      console.log(`   🔍 实际: ${result.actualError.message}`);
    } else {
      errorCount++;
      console.log(`   ❌ 意外错误 (${result.totalTime}ms)`);
      console.log(`   🚨 错误: ${result.unexpectedError.message}`);
    }
    console.log('');
  }
  
  // 性能监控报告
  console.log('⏱️ 性能监控报告:');
  const performanceReport = monitor.getReport();
  for (const [operation, metrics] of Object.entries(performanceReport)) {
    const status = metrics.success ? '✅' : '❌';
    console.log(`   ${status} ${operation}: ${metrics.duration}ms`);
    if (!metrics.success && metrics.error) {
      console.log(`      错误: ${metrics.error}`);
    }
  }
  
  console.log('\n📈 总结统计:');
  console.log(`   ✅ 成功测试: ${successCount}`);
  console.log(`   🎯 问题复现: ${reproduceCount}`);
  console.log(`   ❌ 意外错误: ${errorCount}`);
  console.log(`   📊 总测试数: ${Object.keys(results).length}`);
  
  // 给出建议
  if (reproduceCount > 0) {
    console.log('\n💡 发现的问题和建议:');
    console.log('   1. 考虑为复杂声明实现内容预处理');
    console.log('   2. 添加智能内容长度检查和截取');
    console.log('   3. 为历史文化类内容使用专门的处理策略');
    console.log('   4. 实现更robust的错误重试机制');
  }
  
  console.log('\n🎉 边界情况测试完成！');
}

// 支持命令行参数
const args = process.argv.slice(2);
if (args.includes('--case=zhou-yu')) {
  // 只运行周瑜案例
  testComplexClaim(edgeCases.complexHistorical).then(() => {
    console.log('\n🎯 周瑜案例测试完成');
  });
} else if (require.main === module) {
  // 运行完整测试套件
  runEdgeCaseTests().catch(console.error);
}

module.exports = {
  testComplexClaim,
  testAPILimits,
  runEdgeCaseTests,
  edgeCases
}; 