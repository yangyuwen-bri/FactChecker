const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// 中文测试数据
const chineseTestContent = "中国的长城是世界上最长的城墙，全长超过两万公里。它始建于公元前7世纪，最著名的部分建于明朝。长城不仅是军事防御工程，也是中国古代劳动人民智慧的结晶。很多人认为长城是唯一能从太空肉眼可见的人造建筑，但实际上宇航员表示用肉眼无法从太空看到长城。此外，长城已被联合国教科文组织列为世界文化遗产。";

const chineseTestClaim = "埃菲尔铁塔建于1889年";

const chineseTestSources = [
  {
    text: "埃菲尔铁塔于1887年开始建造，1889年完工，是为了纪念法国大革命100周年而建造的。它由古斯塔夫·埃菲尔设计，高度为324米（1,063英尺）。",
    url: "https://zh.wikipedia.org/wiki/埃菲尔铁塔",
    title: "埃菲尔铁塔 - 维基百科"
  }
];

async function testHealthCheck() {
  console.log('🔍 测试健康检查...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ 健康检查:', response.data);
    return true;
  } catch (error) {
    console.error('❌ 健康检查失败:', error.message);
    return false;
  }
}

async function testExtractChineseClaims() {
  console.log('\n🔍 测试中文声明提取...');
  try {
    const response = await axios.post(`${BASE_URL}/api/claims/extract`, {
      content: chineseTestContent
    });
    console.log('✅ 中文声明提取:', {
      success: response.data.success,
      claims_count: response.data.claims_count,
      claims: response.data.data.claims
    });
    return response.data.data.claims;
  } catch (error) {
    console.error('❌ 中文声明提取失败:', error.response?.data || error.message);
    return null;
  }
}

async function testSearchChineseSources(claim) {
  console.log('\n🔍 测试中文信息源搜索...');
  try {
    const response = await axios.post(`${BASE_URL}/api/search/exa`, {
      claim: claim
    });
    console.log('✅ 中文信息源搜索:', {
      success: response.data.success,
      total_results: response.data.data.total_results,
      results: response.data.data.results.slice(0, 2) // 显示前2个结果
    });
    return response.data.data.results;
  } catch (error) {
    console.error('❌ 中文信息源搜索失败:', error.response?.data || error.message);
    return null;
  }
}

async function testVerifyChineseClaim(claim, originalText, sources) {
  console.log('\n🔍 测试中文声明验证...');
  try {
    const response = await axios.post(`${BASE_URL}/api/verify/claims`, {
      claim: claim,
      original_text: originalText,
      exasources: sources
    });
    console.log('✅ 中文声明验证:', {
      success: response.data.success,
      assessment: response.data.data.assessment,
      confidence_score: response.data.data.confidence_score,
      summary: response.data.data.summary,
      fixed_original_text: response.data.data.fixed_original_text
    });
    return response.data.data;
  } catch (error) {
    console.error('❌ 中文声明验证失败:', error.response?.data || error.message);
    return null;
  }
}

async function testBatchChineseVerify() {
  console.log('\n🔍 测试中文批量验证...');
  try {
    const response = await axios.post(`${BASE_URL}/api/verify/batch`, {
      claims: [
        {
          claim: "埃菲尔铁塔建于1889年",
          original_text: "埃菲尔铁塔建于1889年",
          exasources: chineseTestSources
        },
        {
          claim: "长城可以从太空看到",
          original_text: "长城可以从太空看到",
          exasources: [{
            text: "长城无法用肉眼从太空看到，这是一个常见的误解。",
            url: "https://example.com/great-wall",
            title: "长城可见性"
          }]
        }
      ]
    });
    console.log('✅ 中文批量验证:', {
      success: response.data.success,
      total_processed: response.data.data.total_processed,
      successful: response.data.data.successful,
      failed: response.data.data.failed,
      results: response.data.data.results
    });
    return response.data.data;
  } catch (error) {
    console.error('❌ 中文批量验证失败:', error.response?.data || error.message);
    return null;
  }
}

async function testErrorMessages() {
  console.log('\n🔍 测试中文错误信息...');
  
  // 测试空内容
  try {
    await axios.post(`${BASE_URL}/api/claims/extract`, {});
  } catch (error) {
    console.log('✅ 空内容错误信息:', error.response.data.error);
  }
  
  // 测试空声明
  try {
    await axios.post(`${BASE_URL}/api/search/exa`, {});
  } catch (error) {
    console.log('✅ 空声明错误信息:', error.response.data.error);
  }
  
  // 测试验证缺少参数
  try {
    await axios.post(`${BASE_URL}/api/verify/claims`, {
      claim: "测试声明"
    });
  } catch (error) {
    console.log('✅ 缺少参数错误信息:', error.response.data.error);
  }
}

async function runChineseTests() {
  console.log('🚀 开始中文 API 测试...\n');
  
  // 测试1: 健康检查
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('\n❌ 健康检查失败。请确保 API 服务器在端口 3001 上运行');
    return;
  }
  
  // 测试2: 提取中文声明
  const claims = await testExtractChineseClaims();
  if (!claims || claims.length === 0) {
    console.log('\n❌ 未提取到中文声明。停止测试。');
    return;
  }
  
  // 测试3: 搜索中文信息源（使用第一个声明）
  const firstClaim = claims[0];
  const sources = await testSearchChineseSources(firstClaim.claim);
  if (!sources || sources.length === 0) {
    console.log('\n❌ 未找到中文信息源。使用测试信息源进行验证。');
  }
  
  // 测试4: 验证中文声明
  const sourcesToUse = sources && sources.length > 0 ? sources.slice(0, 2) : chineseTestSources;
  await testVerifyChineseClaim(firstClaim.claim, firstClaim.original_text, sourcesToUse);
  
  // 测试5: 中文批量验证
  await testBatchChineseVerify();
  
  // 测试6: 中文错误信息
  await testErrorMessages();
  
  console.log('\n🎉 所有中文测试完成！');
}

// 如果直接运行此文件则执行测试
if (require.main === module) {
  runChineseTests().catch(console.error);
}

module.exports = {
  testHealthCheck,
  testExtractChineseClaims,
  testSearchChineseSources,
  testVerifyChineseClaim,
  testBatchChineseVerify,
  testErrorMessages,
  runChineseTests
}; 