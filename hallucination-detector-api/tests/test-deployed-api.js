const axios = require('axios');

const BASE_URL = 'https://hallubacken.vercel.app';

async function testDeployedAPI() {
  console.log('🚀 测试部署的 API...\n');
  
  try {
    // 测试 API 信息
    console.log('🔍 测试 API 信息...');
    const infoResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ API 信息:', infoResponse.data);
    
    // 测试声明提取
    console.log('\n🔍 测试声明提取...');
    const extractResponse = await axios.post(`${BASE_URL}/api/claims/extract`, {
      content: '中国的长城是世界上最长的城墙，全长超过两万公里。埃菲尔铁塔建于1889年。'
    });
    console.log('✅ 声明提取:', extractResponse.data);
    
    // 测试搜索
    console.log('\n🔍 测试搜索...');
    const searchResponse = await axios.post(`${BASE_URL}/api/search/exa`, {
      claim: '中国的长城是世界上最长的城墙，全长超过两万公里'
    });
    console.log('✅ 搜索结果:', {
      success: searchResponse.data.success,
      results_count: searchResponse.data.results?.length || 0
    });
    
    console.log('\n🎉 所有测试通过！API 部署成功！');
    console.log(`📱 API 地址: ${BASE_URL}`);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('状态码:', error.response.status);
    }
  }
}

testDeployedAPI(); 