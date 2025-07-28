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
  confidence_score: z.number().min(0).max(100),
  time_sensitivity_note: z.string().nullable()
});

/**
 * POST /api/verify/claims
 * Verify claims against provided sources using AI analysis
 */
router.post('/claims', async (req, res, next) => {
  try {
    const { claim, original_text, exasources, anthropic_api_key } = req.body;

    // Validation
    if (!claim || !original_text || !exasources) {
      return res.status(400).json({ 
        error: '声明、原始文本和信息源都是必需的',
        timestamp: new Date().toISOString()
      });
    }

    if (!anthropic_api_key) {
      return res.status(400).json({ 
        error: 'Anthropic API Key 是必需的',
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

    // 严格验证 Anthropic API Key
    if (typeof anthropic_api_key !== 'string' || 
        !anthropic_api_key.startsWith('sk-ant-') ||
        anthropic_api_key.length < 50 ||
        !/^[a-zA-Z0-9\-_]+$/.test(anthropic_api_key)) {
      return res.status(400).json({ 
        error: 'Anthropic API Key 格式无效或不完整',
        timestamp: new Date().toISOString()
      });
    }

    const { object } = await generateObject({
      model: anthropic('claude-3-5-haiku-20241022', {
        apiKey: anthropic_api_key,
      }),
      schema: factCheckSchema,
      output: 'object',
      prompt: `你是一个专业的事实核查专家。请注意以下重要限制和指导原则：

**⚠️ 重要：时间限制声明**
我的训练数据截止到2024年4月，对于2024年4月之后的事件和信息，我的内置知识可能不完整或过时。

**📋 验证原则（按优先级排序）：**
1. **搜索结果优先**：主要基于提供的外部信息源进行判断，这些是最新的可靠数据
2. **时间敏感性判断**：
   - 如果声明涉及2024年4月后的事件→高度依赖搜索结果
   - 如果声明涉及股价、新闻、政策等时效性强的信息→以搜索结果为准
   - 如果声明涉及历史事实、科学定律等相对稳定的信息→可结合内置知识
3. **不确定性诚实表达**：如果搜索结果不足且涉及较新信息，坦诚说明限制

**📊 分析流程：**
给定一个声明和一组信息源，请按以下步骤进行：

1. 首先识别声明是否涉及时间敏感信息
2. 综合分析所有提供的信息源
3. 基于信息源内容（而非我的训练知识）做出判断
4. 如果涉及较新信息且搜索结果不充分，在总结中明确说明

**📚 信息源：**
${exasources.map((source, index) => `信息源 ${index + 1}：
文本：${source.text || '无文本内容'}
URL：${source.url || '无URL'}
标题：${source.title || '无标题'}
`).join('\n')}

**📄 原始文本：** ${original_text}

**🎯 需要验证的声明：** ${claim}

**📋 输出要求：**
请以JSON对象格式提供答案，结构如下：

{
  "claim": "声明内容",
  "assessment": "True" 或 "False" 或 "Insufficient Information",
  "summary": "基于搜索结果的判断理由。如果涉及2024年4月后的信息，请明确说明'此判断主要基于搜索结果，因为该信息可能超出我的训练数据范围'。请用中文详细说明。",
  "fixed_original_text": "如果评估为False，请修正原始文本（保持其他内容不变，只修正事实错误的部分）",
  "confidence_score": 0到100之间的数字,
  "time_sensitivity_note": "⚠️重要：如果声明涉及以下情况MUST填写：1)2024年4月后事件 2)未来事件 3)股价金融 4)实时新闻 5)最新政策。内容为'⚠️ 时效性提醒：此判断主要基于当前搜索结果，建议关注信息更新'"
}

**🔄 重要提醒：**
- 优先相信搜索结果而非我的内置知识
- 对于时效性强的声明，即使搜索结果有限，也要诚实说明局限性
- **🚨 时效性字段强制要求**：如果声明涉及2025年、2024年下半年等时间，无论assessment是True/False/Insufficient Information，都必须填写time_sensitivity_note字段！！！
- 用中文回答，但保持JSON格式和assessment字段的英文值

**⚠️ 特别检查清单：**
声明中是否包含：2025年？2024年下半年？股价？最新政策？如果是，time_sensitivity_note字段不能为空！

**🔒 最终提交前检查（必须执行）：**
1. 检查声明文本："${claim}"
2. 问自己：这个声明是否涉及2024年4月后的时间？
3. 如果答案是"是"，time_sensitivity_note字段必须填写为："⚠️ 时效性提醒：此判断主要基于当前搜索结果，建议关注信息更新"
4. 如果答案是"否"，time_sensitivity_note可以为null

当前声明明确包含"2025年"，因此time_sensitivity_note必须填写！
      `
    });

    console.log('LLM response:', object);
    
    // 强制检查和添加时效性注释
    if (!object.time_sensitivity_note) {
      // 检查声明是否涉及时效性内容
      const claimText = claim.toLowerCase();
      const hasTimeRelevantContent = 
        claimText.includes('2025') || 
        claimText.includes('2024年下半年') || 
        claimText.includes('2024年8月') || 
        claimText.includes('2024年9月') || 
        claimText.includes('2024年10月') || 
        claimText.includes('2024年11月') || 
        claimText.includes('2024年12月') ||
        claimText.includes('股价') ||
        claimText.includes('最新') ||
        claimText.includes('实时');
        
      if (hasTimeRelevantContent) {
        object.time_sensitivity_note = '⚠️ 时效性提醒：此判断主要基于当前搜索结果，建议关注信息更新';
        console.log('🔧 自动添加时效性注释:', object.time_sensitivity_note);
      }
    }
    
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

    if (error.message && error.message.includes('insufficient_quota')) {
      return res.status(402).json({ 
        error: 'Anthropic API 配额不足',
        timestamp: new Date().toISOString()
      });
    }

    if (error.message && error.message.includes('unauthorized')) {
      return res.status(401).json({ 
        error: 'Anthropic API 密钥无权限',
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
    const { claims, anthropic_api_key } = req.body;

    if (!Array.isArray(claims) || claims.length === 0) {
      return res.status(400).json({ 
        error: '声明数组不能为空',
        timestamp: new Date().toISOString()
      });
    }

    if (!anthropic_api_key) {
      return res.status(400).json({ 
        error: 'Anthropic API Key 是必需的',
        timestamp: new Date().toISOString()
      });
    }

    // 严格验证 Anthropic API Key
    if (typeof anthropic_api_key !== 'string' || 
        !anthropic_api_key.startsWith('sk-ant-') ||
        anthropic_api_key.length < 50 ||
        !/^[a-zA-Z0-9\-_]+$/.test(anthropic_api_key)) {
      return res.status(400).json({ 
        error: 'Anthropic API Key 格式无效或不完整',
        timestamp: new Date().toISOString()
      });
    }

    if (claims.length > 10) {
      return res.status(400).json({ 
        error: '批量请求最多允许10个声明',
        timestamp: new Date().toISOString()
      });
    }

    // Create anthropic client with user's API key
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
          model: anthropic('claude-3-5-haiku-20241022', {
            apiKey: anthropic_api_key,
          }),
          schema: factCheckSchema,
          output: 'object',
          prompt: `你是一个专业的事实核查专家。请注意以下重要限制和指导原则：

**⚠️ 重要：时间限制声明**
我的训练数据截止到2024年4月，对于2024年4月之后的事件和信息，我的内置知识可能不完整或过时。

**📋 验证原则（按优先级排序）：**
1. **搜索结果优先**：主要基于提供的外部信息源进行判断，这些是最新的可靠数据
2. **时间敏感性判断**：
   - 如果声明涉及2024年4月后的事件→高度依赖搜索结果
   - 如果声明涉及股价、新闻、政策等时效性强的信息→以搜索结果为准
   - 如果声明涉及历史事实、科学定律等相对稳定的信息→可结合内置知识
3. **不确定性诚实表达**：如果搜索结果不足且涉及较新信息，坦诚说明限制

**📚 信息源：**
${claimData.exasources.map((source, index) => `信息源 ${index + 1}：
文本：${source.text || '无文本内容'}
URL：${source.url || '无URL'}
标题：${source.title || '无标题'}
`).join('\n')}

**📄 原始文本：** ${claimData.original_text}

**🎯 需要验证的声明：** ${claimData.claim}

**📋 输出要求：**
请以JSON对象格式提供答案，结构如下：

{
  "claim": "声明内容",
  "assessment": "True" 或 "False" 或 "Insufficient Information",
  "summary": "基于搜索结果的判断理由。如果涉及2024年4月后的信息，请明确说明'此判断主要基于搜索结果，因为该信息可能超出我的训练数据范围'。请用中文详细说明。",
  "fixed_original_text": "如果评估为False，请修正原始文本（保持其他内容不变，只修正事实错误的部分）",
  "confidence_score": 0到100之间的数字,
  "time_sensitivity_note": "⚠️重要：如果声明涉及以下情况MUST填写：1)2024年4月后事件 2)未来事件 3)股价金融 4)实时新闻 5)最新政策。内容为'⚠️ 时效性提醒：此判断主要基于当前搜索结果，建议关注信息更新'"
}

**🔄 重要提醒：**
- 优先相信搜索结果而非我的内置知识
- 对于时效性强的声明，即使搜索结果有限，也要诚实说明局限性
- **🚨 时效性字段强制要求**：如果声明涉及2025年、2024年下半年等时间，无论assessment是True/False/Insufficient Information，都必须填写time_sensitivity_note字段！！！
- 用中文回答，但保持JSON格式和assessment字段的英文值

**⚠️ 特别检查清单：**
声明中是否包含：2025年？2024年下半年？股价？最新政策？如果是，time_sensitivity_note字段不能为空！

**🔒 最终提交前检查（必须执行）：**
1. 检查声明文本："${claimData.claim}"
2. 问自己：这个声明是否涉及2024年4月后的时间？
3. 如果答案是"是"，time_sensitivity_note字段必须填写为："⚠️ 时效性提醒：此判断主要基于当前搜索结果，建议关注信息更新"
4. 如果答案是"否"，time_sensitivity_note可以为null

如果声明包含"2025年"或"2024年下半年"等时间，time_sensitivity_note必须填写！
          `
        });

        // 强制检查和添加时效性注释
        if (!object.time_sensitivity_note) {
          // 检查声明是否涉及时效性内容
          const claimText = claimData.claim.toLowerCase();
          const hasTimeRelevantContent = 
            claimText.includes('2025') || 
            claimText.includes('2024年下半年') || 
            claimText.includes('2024年8月') || 
            claimText.includes('2024年9月') || 
            claimText.includes('2024年10月') || 
            claimText.includes('2024年11月') || 
            claimText.includes('2024年12月') ||
            claimText.includes('股价') ||
            claimText.includes('最新') ||
            claimText.includes('实时');
            
          if (hasTimeRelevantContent) {
            object.time_sensitivity_note = '⚠️ 时效性提醒：此判断主要基于当前搜索结果，建议关注信息更新';
            console.log(`🔧 批量验证 - 自动添加时效性注释 [${i}]:`, object.time_sensitivity_note);
          }
        }

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

    if (error.message && error.message.includes('insufficient_quota')) {
      return res.status(402).json({ 
        error: 'Anthropic API 配额不足',
        timestamp: new Date().toISOString()
      });
    }

    if (error.message && error.message.includes('unauthorized')) {
      return res.status(401).json({ 
        error: 'Anthropic API 密钥无权限',
        timestamp: new Date().toISOString()
      });
    }
    
    next(error);
  }
});

module.exports = router; 