const express = require('express');
const { Exa } = require("exa-js");

const router = express.Router();

/**
 * POST /api/search/exa
 * Search for content related to a claim using Exa API
 */
router.post('/exa', async (req, res, next) => {
  try {
    const { claim, exa_api_key } = req.body;
    
    if (!claim) {
      return res.status(400).json({ 
        error: '声明不能为空',
        timestamp: new Date().toISOString()
      });
    }

    if (typeof claim !== 'string' || claim.trim().length === 0) {
      return res.status(400).json({ 
        error: '声明必须是非空字符串',
        timestamp: new Date().toISOString()
      });
    }

    if (!exa_api_key) {
      return res.status(400).json({ 
        error: 'Exa API Key 是必需的',
        timestamp: new Date().toISOString()
      });
    }

    // 严格验证 Exa API Key (UUID v4格式)
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (typeof exa_api_key !== 'string' || !uuidV4Regex.test(exa_api_key)) {
      return res.status(400).json({ 
        error: 'Exa API Key 格式无效（应为标准UUID v4格式）',
        timestamp: new Date().toISOString()
      });
    }

    // Create Exa client with user's API key
    const userExa = new Exa(exa_api_key);

    // Use Exa to search for content related to the claim
    // 优化搜索查询，添加中文关键词以提高搜索效果
    const searchQuery = claim.includes('的') || claim.includes('是') || claim.includes('在') 
      ? `${claim} 事实 真相 验证`
      : `${claim} facts verification truth`;
      
    const result = await userExa.searchAndContents(
      `${searchQuery} \n\n这是一个帮助验证此内容的网页：`,
      {
        type: "auto",
        numResults: 10,
        // livecrawl: 'always', // Disabled for stable search results
        text: true,
      }
    );

    // Extract only url and text from each result and reverse the order
    const simplifiedResults = result.results.map((item) => ({
      text: item.text,
      url: item.url,
      title: item.title || '无标题',
      publishedDate: item.publishedDate || null
    })).reverse();

    res.json({
      success: true,
      data: {
        results: simplifiedResults,
        query: claim,
        total_results: simplifiedResults.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Exa search API error:', error);
    
    // Handle specific Exa API errors
    if (error.message && error.message.includes('API key')) {
      return res.status(401).json({ 
        error: 'Exa API 密钥无效或缺失',
        timestamp: new Date().toISOString()
      });
    }
    
    if (error.message && error.message.includes('rate limit')) {
      return res.status(429).json({ 
        error: 'Exa API 请求频率超限',
        timestamp: new Date().toISOString()
      });
    }

    if (error.message && error.message.includes('insufficient_quota')) {
      return res.status(402).json({ 
        error: 'Exa API 配额不足',
        timestamp: new Date().toISOString()
      });
    }

    if (error.message && error.message.includes('unauthorized')) {
      return res.status(401).json({ 
        error: 'Exa API 密钥无权限',
        timestamp: new Date().toISOString()
      });
    }

    next(error);
  }
});

module.exports = router; 