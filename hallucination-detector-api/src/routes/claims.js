const express = require('express');
const { anthropic } = require("@ai-sdk/anthropic");
const { generateObject } = require('ai');
const { z } = require('zod');

const router = express.Router();

// Schema for verifiable claim extraction
const claimsSchema = z.object({
  claims: z.array(z.object({
    claim: z.string().describe("提取的可验证声明"),
    original_text: z.string().describe("包含该声明的原始文本片段"),
  })).describe("从文本中提取的所有可验证声明数组"),
});

/**
 * POST /api/claims/extract
 * Extract verifiable claims from provided text content
 */
router.post('/extract', async (req, res, next) => {
  try {
    const { content, anthropic_api_key } = req.body;
    
    if (!content) {
      return res.status(400).json({ 
        error: '内容不能为空',
        timestamp: new Date().toISOString()
      });
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ 
        error: '内容必须是非空字符串',
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

    let object;

    try {
      // Debug: log API key info for claims extraction
      console.log('声明提取 API Key 调试信息:', {
        hasKey: !!anthropic_api_key,
        keyLength: anthropic_api_key?.length,
        keyPrefix: anthropic_api_key?.substring(0, 10)
      });

      // Attempt to generate object using AI
      const result = await generateObject({
        model: anthropic('claude-3-5-haiku-20241022', {
          apiKey: anthropic_api_key,
        }),
        schema: claimsSchema, 
        prompt: `你是一个专业的声明提取专家，专门识别可以通过外部信息源验证或反驳的声明。

        **提取原则**：
        重点关注那些读者可能质疑"这是真的吗？"的声明，包括：
        
        1. **具体事实声明**：数据、日期、地点、人物关系、事件描述
        2. **可验证的描述**：技术特性、研究结果、市场表现、政策内容
        3. **引用和归属**：谁说了什么、来源信息、统计数据
        4. **因果关系**：X导致Y、A影响B的声明
        5. **比较性声明**：更快、更好、第一个、最大的等可比较的描述

        **判断标准**：
        - 能否通过搜索找到证据支持或反驳？
        - 是否存在客观的判断标准？
        - 不同的人看到这个声明会有争议吗？

        **避免提取**：
        - 纯粹的个人感受和美学评价
        - 明显的修辞表达和比喻
        - 常识性的、无争议的描述
        - 定义性或解释性的内容

        **处理灰色地带**：
        - 如果一个声明包含可验证元素，提取可验证的部分
        - 当不确定时，倾向于提取（让验证阶段来判断）
        - 根据文本类型调整：新闻偏向事件，技术文档偏向功能，学术文本偏向发现

        如果输入内容很长，请选择最重要和最可能引起质疑的声明。
        不要重复相同的声明。
        对于每个声明，请提供包含该声明的原始文本片段。
        请严格按照提供的schema格式以JSON对象形式呈现声明。
        
        重要：请保持声明的原始语言。如果原文是中文，声明也应该是中文；如果原文是英文，声明也应该是英文。
        
        以下是需要分析的内容：${content}`,
      });
      object = result.object;

    } catch (error) {
      // Handle type validation errors from Vercel AI SDK
      const validationError = error;
      if (validationError.name === 'AI_TypeValidationError' && validationError.value) {
        
        console.warn("AI_TypeValidationError caught. Attempting manual correction.");
        const receivedValue = validationError.value;

        // Check if this is the expected "stringified array" error
        if (typeof receivedValue.claims === 'string') {
          console.log("Correcting stringified 'claims' array.");
          try {
            // Manually fix: parse the incorrectly stringified claims
            const claimsArray = JSON.parse(receivedValue.claims);
            // Reconstruct the correct object
            object = { claims: claimsArray };
          } catch (jsonError) {
            console.error("Manual JSON parsing also failed.", jsonError);
            throw error; // If manual correction fails, throw original error
          }
        } else {
          throw error; // If it's another type of validation error, throw it
        }
      } else {
        throw error; // If it's not the expected validation error, throw it
      }
    }

    res.json({
      success: true,
      data: object,
      timestamp: new Date().toISOString(),
      claims_count: object.claims ? object.claims.length : 0
    });

  } catch (error) {
    console.error('Extract claims API error:', error);
    
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
    
    next(error);
  }
});

module.exports = router; 