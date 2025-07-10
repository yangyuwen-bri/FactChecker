const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test data
const testContent = "The Eiffel Tower was built in 1889 and stands 324 meters tall. It was designed by Gustave Eiffel and is located in Paris, France.";

const testClaim = "The Eiffel Tower was built in 1889";

const testSources = [
  {
    text: "The Eiffel Tower was constructed from 1887 to 1889 by the French engineer Gustave Eiffel and his team. It stands 324 meters (1,063 feet) tall and was the tallest man-made structure in the world until 1930.",
    url: "https://en.wikipedia.org/wiki/Eiffel_Tower",
    title: "Eiffel Tower - Wikipedia"
  }
];

async function testHealthCheck() {
  console.log('🔍 Testing Health Check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health Check failed:', error.message);
    return false;
  }
}

async function testExtractClaims() {
  console.log('\n🔍 Testing Extract Claims...');
  try {
    const response = await axios.post(`${BASE_URL}/api/claims/extract`, {
      content: testContent
    });
    console.log('✅ Extract Claims:', {
      success: response.data.success,
      claims_count: response.data.claims_count,
      claims: response.data.data.claims
    });
    return response.data.data.claims;
  } catch (error) {
    console.error('❌ Extract Claims failed:', error.response?.data || error.message);
    return null;
  }
}

async function testSearchSources(claim) {
  console.log('\n🔍 Testing Search Sources...');
  try {
    const response = await axios.post(`${BASE_URL}/api/search/exa`, {
      claim: claim
    });
    console.log('✅ Search Sources:', {
      success: response.data.success,
      total_results: response.data.data.total_results,
      results: response.data.data.results.slice(0, 2) // Show first 2 results
    });
    return response.data.data.results;
  } catch (error) {
    console.error('❌ Search Sources failed:', error.response?.data || error.message);
    return null;
  }
}

async function testVerifyClaim(claim, originalText, sources) {
  console.log('\n🔍 Testing Verify Claim...');
  try {
    const response = await axios.post(`${BASE_URL}/api/verify/claims`, {
      claim: claim,
      original_text: originalText,
      exasources: sources
    });
    console.log('✅ Verify Claim:', {
      success: response.data.success,
      assessment: response.data.data.assessment,
      confidence_score: response.data.data.confidence_score,
      summary: response.data.data.summary
    });
    return response.data.data;
  } catch (error) {
    console.error('❌ Verify Claim failed:', error.response?.data || error.message);
    return null;
  }
}

async function testBatchVerify() {
  console.log('\n🔍 Testing Batch Verify...');
  try {
    const response = await axios.post(`${BASE_URL}/api/verify/batch`, {
      claims: [
        {
          claim: "The Eiffel Tower was built in 1889",
          original_text: "The Eiffel Tower was built in 1889",
          exasources: testSources
        },
        {
          claim: "The Great Wall of China is visible from space",
          original_text: "The Great Wall of China is visible from space",
          exasources: [{
            text: "The Great Wall of China is not visible from space with the naked eye. This is a common misconception.",
            url: "https://example.com/great-wall",
            title: "Great Wall Visibility"
          }]
        }
      ]
    });
    console.log('✅ Batch Verify:', {
      success: response.data.success,
      total_processed: response.data.data.total_processed,
      successful: response.data.data.successful,
      failed: response.data.data.failed
    });
    return response.data.data;
  } catch (error) {
    console.error('❌ Batch Verify failed:', error.response?.data || error.message);
    return null;
  }
}

async function runAllTests() {
  console.log('🚀 Starting API Tests...\n');
  
  // Test 1: Health Check
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('\n❌ Health check failed. Make sure the API server is running on port 3001');
    return;
  }
  
  // Test 2: Extract Claims
  const claims = await testExtractClaims();
  if (!claims || claims.length === 0) {
    console.log('\n❌ No claims extracted. Stopping tests.');
    return;
  }
  
  // Test 3: Search Sources (using first claim)
  const firstClaim = claims[0];
  const sources = await testSearchSources(firstClaim.claim);
  if (!sources || sources.length === 0) {
    console.log('\n❌ No sources found. Using test sources for verification.');
  }
  
  // Test 4: Verify Claim (using limited sources like client)
  const maxSearchResults = 3; // 🎯 与客户端保持一致
  const sourcesToUse = sources && sources.length > 0 ? sources.slice(0, maxSearchResults) : testSources;
  console.log(`📊 使用前 ${Math.min(maxSearchResults, sourcesToUse.length)} 个信息源进行验证`);
  await testVerifyClaim(firstClaim.claim, firstClaim.original_text, sourcesToUse);
  
  // Test 5: Batch Verify
  await testBatchVerify();
  
  console.log('\n🎉 All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testHealthCheck,
  testExtractClaims,
  testSearchSources,
  testVerifyClaim,
  testBatchVerify,
  runAllTests
}; 