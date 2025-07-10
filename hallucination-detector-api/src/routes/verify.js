const express = require('express');
const { anthropic } = require("@ai-sdk/anthropic");
const { generateObject } = require('ai');
const { z } = require('zod');

const router = express.Router();

// Schema for fact checking response
const factCheckSchema = z.object({
  claim: z.string(),
  assessment: z.enum(["True", "False", "Insufficient Information"]),
  summary: z.string(),
  fixed_original_text: z.string(),
  confidence_score: z.number().min(0).max(100)
});

/**
 * POST /api/verify/claims
 * Verify claims against provided sources using AI analysis
 */
router.post('/claims', async (req, res, next) => {
  try {
    const { claim, original_text, exasources } = req.body;

    // Validation
    if (!claim || !original_text || !exasources) {
      return res.status(400).json({ 
        error: '声明、原始文本和信息源都是必需的',
        timestamp: new Date().toISOString()
      });
    }

    if (typeof claim !== 'string' || claim.trim().length === 0) {
      return res.status(400).json({ 
        error: '声明必须是非空字符串',
        timestamp: new Date().toISOString()
      });
    }

    if (typeof original_text !== 'string' || original_text.trim().length === 0) {
      return res.status(400).json({ 
        error: '原始文本必须是非空字符串',
        timestamp: new Date().toISOString()
      });
    }

    if (!Array.isArray(exasources) || exasources.length === 0) {
      return res.status(400).json({ 
        error: '信息源必须是非空数组',
        timestamp: new Date().toISOString()
      });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ 
        error: 'ANTHROPIC_API_KEY 未配置',
        timestamp: new Date().toISOString()
      });
    }

    const { object } = await generateObject({
      model: anthropic('claude-3-5-sonnet-20241022'), // Using a more available model
      schema: factCheckSchema,
      output: 'object',
      prompt: `你是一个专业的事实核查专家。给定一个声明和一组信息源，根据信息源中的文本判断该声明是真是假（或者信息不足）。

      请综合分析所有信息源。

      以下是信息源：
      ${exasources.map((source, index) => `信息源 ${index + 1}：
      文本：${source.text || '无文本内容'}
      URL：${source.url || '无URL'}
      标题：${source.title || '无标题'}
      `).join('\n')}

      原始文本部分：${original_text}

      需要验证的声明：${claim}

      请以JSON对象格式提供答案，结构如下：

      claim: "声明内容",
      assessment: "True" 或 "False" 或 "Insufficient Information",
      summary: "为什么这个声明正确，如果不正确，那么什么是正确的。请用中文详细说明原因。",
      fixed_original_text: "如果评估为False，请修正原始文本（保持其他内容不变，只修正事实错误的部分）",
      confidence_score: 0到100之间的百分比数字（100表示对你做出的决定完全有信心，0表示你完全不确定），

      重要：请始终用中文回复summary和fixed_original_text字段，无论信息源是中文还是英文。
      请保持JSON格式和assessment字段的英文值不变。
      `
    });

    console.log('LLM response:', object);
    
    res.json({
      success: true,
      data: object,
      timestamp: new Date().toISOString(),
      sources_analyzed: exasources.length
    });

  } catch (error) {
    console.error('Verify claims API error:', error);
    
    // Handle specific Anthropic API errors
    if (error.message && error.message.includes('API key')) {
      return res.status(401).json({ 
        error: 'Anthropic API 密钥无效或缺失',
        timestamp: new Date().toISOString()
      });
    }
    
    if (error.message && error.message.includes('rate limit')) {
      return res.status(429).json({ 
        error: 'Anthropic API 请求频率超限',
        timestamp: new Date().toISOString()
      });
    }

    next(error);
  }
});

/**
 * POST /api/verify/batch
 * Verify multiple claims in a single request
 */
router.post('/batch', async (req, res, next) => {
  try {
    const { claims } = req.body;

    if (!Array.isArray(claims) || claims.length === 0) {
      return res.status(400).json({ 
        error: '声明数组不能为空',
        timestamp: new Date().toISOString()
      });
    }

    if (claims.length > 10) {
      return res.status(400).json({ 
        error: '批量请求最多允许10个声明',
        timestamp: new Date().toISOString()
      });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < claims.length; i++) {
      const claimData = claims[i];
      try {
        // Validate each claim structure
        if (!claimData.claim || !claimData.original_text || !claimData.exasources) {
          errors.push({
            index: i,
            error: '每个声明必须包含claim、original_text和exasources属性'
          });
          continue;
        }

        // Process the claim (reuse the logic from single claim verification)
        const { object } = await generateObject({
          model: anthropic('claude-3-5-sonnet-20241022'),
          schema: factCheckSchema,
          output: 'object',
          prompt: `你是一个专业的事实核查专家。给定一个声明和一组信息源，根据信息源中的文本判断该声明是真是假（或者信息不足）。
        
          请综合分析所有信息源。

          以下是信息源：
          ${claimData.exasources.map((source, index) => `信息源 ${index + 1}：
          文本：${source.text || '无文本内容'}
          URL：${source.url || '无URL'}
          标题：${source.title || '无标题'}
          `).join('\n')}

          原始文本部分：${claimData.original_text}

          需要验证的声明：${claimData.claim}

          请以JSON对象格式提供答案，结构如下：

          claim: "声明内容",
          assessment: "True" 或 "False" 或 "Insufficient Information",
          summary: "为什么这个声明正确，如果不正确，那么什么是正确的。请用一句话说明。",
          fixed_original_text: "如果评估为False，请修正原始文本（保持其他内容不变，只修正事实错误的部分）",
          confidence_score: 0到100之间的百分比数字（100表示对你做出的决定完全有信心，0表示你完全不确定），

          请用中文回复，但保持JSON格式和assessment字段的英文值不变。
          `
        });

        results.push({
          index: i,
          ...object
        });

      } catch (error) {
        console.error(`Error verifying claim ${i}:`, error);
        errors.push({
          index: i,
          error: error.message || 'Unknown error occurred'
        });
      }
    }

    res.json({
      success: true,
      data: {
        results,
        errors,
        total_processed: claims.length,
        successful: results.length,
        failed: errors.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch verify claims API error:', error);
    next(error);
  }
});

module.exports = router; 