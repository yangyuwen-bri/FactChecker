/**
 * Hallucination Detector API Client
 * 一个简单的 JavaScript 客户端库，用于调用 Hallucination Detector API
 * 增强版本：支持进度回调和透明度信息
 * 版本：v2.1.0 - 修复搜索结果计数解析问题
 */

class HallucinationDetectorClient {
  constructor(baseUrl = 'https://hallubacken.vercel.app') {
    this.baseUrl = baseUrl;
  }

  /**
   * 获取 API 信息
   */
  async getInfo() {
    try {
      const response = await fetch(this.baseUrl);
      return await response.json();
    } catch (error) {
      throw new Error(`获取 API 信息失败: ${error.message}`);
    }
  }

  /**
   * 从文本中提取声明
   * @param {string} content - 要分析的文本内容
   * @param {string} anthropicApiKey - Anthropic API Key
   */
  async extractClaims(content, anthropicApiKey) {
    try {
      console.log('🔍 调用提取声明API...', `${this.baseUrl}/api/claims/extract`);
      
      const response = await fetch(`${this.baseUrl}/api/claims/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content,
          anthropic_api_key: anthropicApiKey
        }),
      });

      console.log('📡 API响应状态:', response.status, response.statusText);

      if (!response.ok) {
        // 尝试获取错误详情
        let errorDetail = '';
        try {
          const errorData = await response.json();
          errorDetail = errorData.error || errorData.message || '未知错误';
        } catch {
          errorDetail = response.statusText || '服务器错误';
        }
        
        console.error('❌ API错误:', {
          status: response.status,
          statusText: response.statusText,
          detail: errorDetail
        });
        
        throw new Error(`HTTP ${response.status}: ${errorDetail}`);
      }

      const result = await response.json();
      console.log('✅ 提取声明成功:', result);
      return result;
    } catch (error) {
      console.error('❌ 提取声明异常:', error);
      throw new Error(`提取声明失败: ${error.message}`);
    }
  }

  /**
   * 搜索相关信息源
   * @param {string} query - 搜索查询
   * @param {string} exaApiKey - Exa API Key
   */
  async searchSources(query, exaApiKey) {
    try {
      console.log('🌐 调用搜索API...', query);
      
      const response = await fetch(`${this.baseUrl}/api/search/exa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          claim: query,
          exa_api_key: exaApiKey
        }),
      });

      console.log('📡 搜索API响应状态:', response.status);

      if (!response.ok) {
        let errorDetail = '';
        try {
          const errorData = await response.json();
          errorDetail = errorData.error || errorData.message || '未知错误';
        } catch {
          errorDetail = response.statusText || '服务器错误';
        }
        
        throw new Error(`HTTP ${response.status}: ${errorDetail}`);
      }

      const result = await response.json();
      
      // 🎯 修复：正确解析搜索结果数量
      let actualResultsCount = 0;
      if (result.results) {
        actualResultsCount = result.results.length;
      } else if (result.data?.results) {
        actualResultsCount = result.data.results.length;
      } else if (Array.isArray(result)) {
        actualResultsCount = result.length;
      }
      
      console.log('✅ 搜索成功，找到', actualResultsCount, '个结果');
      return result;
    } catch (error) {
      console.error('❌ 搜索失败:', error);
      throw new Error(`搜索源失败: ${error.message}`);
    }
  }

  /**
   * 验证单个声明
   * @param {string} claim - 要验证的声明
   * @param {string} originalText - 原始文本
   * @param {Array} exaSources - 相关信息源
   * @param {string} anthropicApiKey - Anthropic API Key
   */
  async verifyClaim(claim, originalText, exaSources, anthropicApiKey) {
    try {
      console.log('🧠 调用验证API...', claim.substring(0, 50) + '...');
      
      const response = await fetch(`${this.baseUrl}/api/verify/claims`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claim,
          original_text: originalText,
          exasources: exaSources,
          anthropic_api_key: anthropicApiKey,
        }),
      });

      console.log('📡 验证API响应状态:', response.status);

      if (!response.ok) {
        let errorDetail = '';
        try {
          const errorData = await response.json();
          errorDetail = errorData.error || errorData.message || '未知错误';
        } catch {
          errorDetail = response.statusText || '服务器错误';
        }
        
        throw new Error(`HTTP ${response.status}: ${errorDetail}`);
      }

      const result = await response.json();

      console.log('✅ 验证完成:', result.data?.assessment);
      // 返回正确的数据格式给前端
      return result.data || result;
    } catch (error) {
      console.error('❌ 验证失败:', error);
      throw new Error(`验证声明失败: ${error.message}`);
    }
  }

  /**
   * 批量验证声明
   * @param {Array} claims - 声明数组
   * @param {string} originalText - 原始文本
   * @param {Array} exaSources - 相关信息源
   */
  async verifyClaimsBatch(claims, originalText, exaSources) {
    try {
      const response = await fetch(`${this.baseUrl}/api/verify/claims/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claims,
          original_text: originalText,
          exasources: exaSources,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`批量验证声明失败: ${error.message}`);
    }
  }

  /**
   * 完整的幻觉检测流程 (增强版 - 支持进度回调和透明度)
   * @param {string} text - 要检测的文本
   * @param {Object} options - 选项
   * @param {Function} onProgress - 进度回调函数 (step, info) => void
   */
  async detectHallucinations(text, options = {}, onProgress = null) {
    const {
      maxSearchResults = 3,
      confidenceThreshold = 80,
      includeSources = true,
      includeTransparency = true, // 新增：是否包含透明度信息
      anthropicApiKey = null, // 新增：Anthropic API Key
      exaApiKey = null, // 新增：Exa API Key
    } = options;

    // 验证API Key
    if (!anthropicApiKey) {
      throw new Error('缺少 Anthropic API Key');
    }
    if (!exaApiKey) {
      throw new Error('缺少 Exa API Key');
    }

    // 进度回调辅助函数
    const callProgress = (step, info) => {
      if (typeof onProgress === 'function') {
        onProgress(step, info);
      }
    };

    try {
      callProgress('start', {
        message: '开始幻觉检测流程',
        timestamp: new Date().toISOString(),
        inputLength: text.length
      });

      // 1. 提取声明
      callProgress('extracting_claims', {
        message: '正在分析文本，提取可验证的声明...',
        progress: 10
      });

      const claimsResult = await this.extractClaims(text, anthropicApiKey);
      console.log('🔍 提取声明原始响应:', claimsResult);
      
      // 处理不同的API响应格式
      let claims = [];
      if (claimsResult.claims) {
        // 直接格式: {claims: [...]}
        claims = claimsResult.claims;
      } else if (claimsResult.data?.claims) {
        // 嵌套格式: {data: {claims: [...]}}
        claims = claimsResult.data.claims;
      } else if (Array.isArray(claimsResult)) {
        // 数组格式: [...]
        claims = claimsResult;
      } else {
        console.warn('⚠️ 无法解析声明数据格式:', claimsResult);
        claims = [];
      }
      
      callProgress('claims_extracted', {
        message: `成功提取 ${claims.length} 个声明`,
        claims: claims,
        claimsCount: claims.length,
        progress: 25
      });

      if (claims.length === 0) {
        callProgress('completed', {
          message: '检测完成：未发现可验证的声明',
          progress: 100
        });
        
        return {
          success: true,
          claims: [],
          verifications: [],
          transparency: {
            totalSteps: 2,
            completedSteps: 2,
            processingTime: new Date().toISOString(),
          },
          summary: '未发现可验证的声明',
        };
      }

      // 2. 对每个声明进行验证
      const verifications = [];
      const transparencyLog = [];
      
      for (let i = 0; i < claims.length; i++) {
        const claim = claims[i];
        const currentClaim = i + 1;
        
        // 进度计算：25% (提取完成) + 70% * (当前声明/总声明数)
        const currentProgress = 25 + Math.floor(70 * (i / claims.length));
        
        callProgress('verifying_claim', {
          message: `正在验证声明 ${currentClaim}/${claims.length}`,
          claim: claim.claim,
          currentClaim,
          totalClaims: claims.length,
          progress: currentProgress
        });

        const claimProcessLog = {
          claimIndex: i,
          claim: claim.claim,
          startTime: new Date().toISOString(),
          steps: []
        };

        // 搜索相关信息
        callProgress('searching_sources', {
          message: `为声明 ${currentClaim} 搜索相关信息源...`,
          claim: claim.claim,
          searchEngine: 'Exa.ai'
        });

        claimProcessLog.steps.push({
          step: 'search_sources',
          status: 'started',
          timestamp: new Date().toISOString()
        });

        try {
          const searchResult = await this.searchSources(claim.claim, exaApiKey);
          console.log('🌐 搜索原始响应:', searchResult);
          
          // 处理不同的搜索响应格式
          let sources = [];
          if (searchResult.results) {
            sources = searchResult.results;
          } else if (searchResult.data?.results) {
            sources = searchResult.data.results;
          } else if (Array.isArray(searchResult)) {
            sources = searchResult;
          } else {
            console.warn('⚠️ 无法解析搜索结果格式:', searchResult);
            sources = [];
          }

          claimProcessLog.steps.push({
            step: 'search_sources',
            status: 'completed',
            timestamp: new Date().toISOString(),
            sourcesFound: sources.length,
            sources: includeTransparency ? sources.slice(0, maxSearchResults).map(s => ({
              title: s.title,
              url: s.url,
              score: s.score,
              snippet: s.text?.substring(0, 150) + '...'
            })) : []
          });

          callProgress('sources_found', {
            message: `找到 ${sources.length} 个相关信息源`,
            sourcesCount: sources.length,
            sources: sources.slice(0, maxSearchResults),
            claim: claim.claim
          });

          if (sources.length === 0) {
            callProgress('sources_insufficient', {
              message: `声明 ${currentClaim}: 未找到足够的信息源`,
              claim: claim.claim
            });

            verifications.push({
              claim: claim.claim,
              original_text: claim.original_text,
              assessment: 'Insufficient Information',
              confidence_score: 0,
              summary: '未找到相关信息源进行验证',
              sources: [],
              transparency: claimProcessLog
            });
            
            transparencyLog.push(claimProcessLog);
            continue;
          }

          // 验证声明
          callProgress('analyzing_claim', {
            message: `正在使用 AI 分析声明 ${currentClaim}...`,
            claim: claim.claim,
            aiModel: 'Claude 3.5',
            sourcesUsed: Math.min(sources.length, maxSearchResults)
          });

          claimProcessLog.steps.push({
            step: 'ai_analysis',
            status: 'started',
            timestamp: new Date().toISOString(),
            model: 'Claude 3.5 Haiku',
            sourcesUsed: Math.min(sources.length, maxSearchResults)
          });

          const verificationResult = await this.verifyClaim(
            claim.claim,
            claim.original_text,
            sources.slice(0, maxSearchResults),
            anthropicApiKey
          );

          console.log('🧠 验证原始响应:', verificationResult);
          
          // 处理不同的验证响应格式
          let verificationData = verificationResult;
          if (verificationResult.claims) {
            verificationData = verificationResult.claims;
          } else if (verificationResult.data) {
            verificationData = verificationResult.data;
          }

          const verification = {
            claim: claim.claim,
            original_text: claim.original_text,
            assessment: verificationData.assessment || 'Unknown',
            confidence_score: verificationData.confidence_score || 0,
            summary: verificationData.summary || '无法验证',
            sources: includeSources ? sources.slice(0, maxSearchResults) : [],
            transparency: includeTransparency ? claimProcessLog : undefined
          };

          claimProcessLog.steps.push({
            step: 'ai_analysis',
            status: 'completed',
            timestamp: new Date().toISOString(),
            result: {
              assessment: verification.assessment,
              confidence: verification.confidence_score,
              reasoning: verification.summary
            }
          });

          claimProcessLog.endTime = new Date().toISOString();
          verifications.push(verification);
          transparencyLog.push(claimProcessLog);

          callProgress('claim_verified', {
            message: `声明 ${currentClaim} 验证完成: ${verification.assessment} (${verification.confidence_score}%)`,
            claim: claim.claim,
            assessment: verification.assessment,
            confidence: verification.confidence_score,
            summary: verification.summary
          });

        } catch (error) {
          claimProcessLog.steps.push({
            step: 'verification_error',
            status: 'failed',
            timestamp: new Date().toISOString(),
            error: error.message
          });

          callProgress('claim_error', {
            message: `声明 ${currentClaim} 验证失败: ${error.message}`,
            claim: claim.claim,
            error: error.message
          });

          verifications.push({
            claim: claim.claim,
            original_text: claim.original_text,
            assessment: 'Error',
            confidence_score: 0,
            summary: `验证过程中出现错误: ${error.message}`,
            sources: [],
            transparency: includeTransparency ? claimProcessLog : undefined
          });
          
          transparencyLog.push(claimProcessLog);
        }
      }

      // 统计结果
      const trueCount = verifications.filter(v => v.assessment === 'True').length;
      const falseCount = verifications.filter(v => v.assessment === 'False').length;
      const partiallyTrueCount = verifications.filter(v => v.assessment === 'Partially True').length;
      const insufficientCount = verifications.filter(v => v.assessment === 'Insufficient Information').length;
      const unknownCount = verifications.filter(v => 
        !['True', 'False', 'Partially True', 'Insufficient Information'].includes(v.assessment)
      ).length;
      
      callProgress('completed', {
        message: '幻觉检测完成！',
        progress: 100,
        summary: {
          totalClaims: claims.length,
          trueClaims: trueCount,
          falseClaims: falseCount,
          partiallyTrueClaims: partiallyTrueCount,
          insufficientClaims: insufficientCount,
          unknownClaims: unknownCount
        }
      });

      return {
        success: true,
        claims,
        verifications,
        transparency: includeTransparency ? {
          totalSteps: claims.length * 3 + 2, // 提取声明 + 每个声明(搜索+验证+分析) + 总结
          completedSteps: claims.length * 3 + 2,
          processingTime: new Date().toISOString(),
          detailedLog: transparencyLog,
          searchEngine: 'Exa.ai',
          aiModel: 'Claude 3.5 Haiku',
          apiCalls: claims.length * 2 + 1 // 1次提取 + 每个声明2次调用
        } : undefined,
        summary: {
          total_claims: claims.length,
          true_claims: trueCount,
          false_claims: falseCount,
          partially_true_claims: partiallyTrueCount,
          insufficient_claims: insufficientCount,
          unknown_claims: unknownCount,
          accuracy_rate: claims.length > 0 ? (trueCount / claims.length * 100).toFixed(1) : 0,
          high_confidence_claims: verifications.filter(v => v.confidence_score >= confidenceThreshold).length,
        },
      };
    } catch (error) {
      callProgress('error', {
        message: `幻觉检测失败: ${error.message}`,
        error: error.message,
        progress: 0
      });
      
      throw error;
    }
  }
}

// 导出客户端类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HallucinationDetectorClient;
} else if (typeof window !== 'undefined') {
  window.HallucinationDetectorClient = HallucinationDetectorClient;
}

// 使用示例（仅在 Node.js 环境下运行）
if (typeof window === 'undefined' && typeof module !== 'undefined') {
  // Node.js 环境下的使用示例
  const client = new HallucinationDetectorClient();
  
  // 示例：检测文本中的幻觉
  const exampleText = '中国的长城是世界上最长的城墙，全长超过两万公里。埃菲尔铁塔建于1889年。';
  
  // 使用进度回调
  client.detectHallucinations(exampleText, {
    maxSearchResults: 3,
    confidenceThreshold: 80,
    includeSources: true,
    includeTransparency: true,
  }, (step, info) => {
    console.log(`[${step}] ${info.message}`);
  }).then(result => {
    console.log('检测结果:', result);
  }).catch(error => {
    console.error('检测失败:', error);
  });
} 