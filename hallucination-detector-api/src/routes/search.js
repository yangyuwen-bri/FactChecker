const express = require('express');
const { Exa } = require("exa-js");

const router = express.Router();

// Initialize Exa client
const exa = new Exa(process.env.EXA_API_KEY);

/**
 * POST /api/search/exa
 * Search for content related to a claim using Exa API
 */
router.post('/exa', async (req, res, next) => {
  try {
    const { claim } = req.body;
    
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

    if (!process.env.EXA_API_KEY) {
      return res.status(500).json({ 
        error: 'EXA_API_KEY 未配置',
        timestamp: new Date().toISOString()
      });
    }

    // Use Exa to search for content related to the claim
    // 优化搜索查询，添加中文关键词以提高搜索效果
    const searchQuery = claim.includes('的') || claim.includes('是') || claim.includes('在') 
      ? `${claim} 事实 真相 验证`
      : `${claim} facts verification truth`;
      
    const result = await exa.searchAndContents(
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

    next(error);
  }
});

module.exports = router; 