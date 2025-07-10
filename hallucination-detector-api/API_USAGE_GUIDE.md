# 🚀 Hallucination Detector API 使用指南

## 📋 概述

Hallucination Detector API 是一个基于 AI 的事实核查服务，可以：
- 从文本中提取声明
- 搜索相关信息源
- 验证声明的真实性

**API 地址**: `https://hallubacken-5t6wwxo9o-fraps-projects.vercel.app`

## 🔑 认证

目前 API 无需认证即可使用，但建议在生产环境中添加适当的认证机制。

## 📡 API 端点

### 1. 获取 API 信息
```http
GET /
```

**响应示例**:
```json
{
  "name": "Hallucination Detector API",
  "version": "1.0.0",
  "description": "API service for detecting hallucinations in AI-generated content",
  "endpoints": {
    "health": "GET /health",
    "extractClaims": "POST /api/claims/extract",
    "searchSources": "POST /api/search/exa",
    "verifyClaims": "POST /api/verify/claims"
  }
}
```

### 2. 提取声明
```http
POST /api/claims/extract
Content-Type: application/json

{
  "content": "要分析的文本内容"
}
```

**请求示例**:
```bash
curl -X POST "https://hallubacken-5t6wwxo9o-fraps-projects.vercel.app/api/claims/extract" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "中国的长城是世界上最长的城墙，全长超过两万公里。埃菲尔铁塔建于1889年。"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "claims": [
    "中国的长城是世界上最长的城墙，全长超过两万公里",
    "埃菲尔铁塔建于1889年"
  ]
}
```

### 3. 搜索信息源
```http
POST /api/search/exa
Content-Type: application/json

{
  "query": "搜索查询"
}
```

**请求示例**:
```bash
curl -X POST "https://hallubacken-5t6wwxo9o-fraps-projects.vercel.app/api/search/exa" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "长城长度 中国"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "results": [
    {
      "text": "搜索结果内容...",
      "url": "https://example.com",
      "title": "页面标题",
      "publishedDate": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### 4. 验证声明
```http
POST /api/verify/claims
Content-Type: application/json

{
  "claim": "要验证的声明",
  "original_text": "原始文本",
  "exasources": [
    {
      "text": "源文本内容",
      "url": "https://example.com",
      "title": "页面标题"
    }
  ]
}
```

**请求示例**:
```bash
curl -X POST "https://hallubacken-5t6wwxo9o-fraps-projects.vercel.app/api/verify/claims" \
  -H "Content-Type: application/json" \
  -d '{
    "claim": "中国的长城是世界上最长的城墙，全长超过两万公里",
    "original_text": "中国的长城是世界上最长的城墙，全长超过两万公里。",
    "exasources": [
      {
        "text": "根据2012年调查，长城总长度为21,196.18公里...",
        "url": "https://example.com",
        "title": "长城长度调查"
      }
    ]
  }'
```

**响应示例**:
```json
{
  "success": true,
  "assessment": "True",
  "confidence_score": 95,
  "summary": "根据来源，长城确实超过两万公里...",
  "fixed_original_text": "中国的长城是世界上最长的城墙，全长超过两万公里。"
}
```

## 💻 编程语言示例

### JavaScript/Node.js
```javascript
const axios = require('axios');

const API_BASE = 'https://hallubacken-5t6wwxo9o-fraps-projects.vercel.app';

async function detectHallucinations(text) {
  try {
    // 1. 提取声明
    const claimsResponse = await axios.post(`${API_BASE}/api/claims/extract`, {
      content: text
    });
    
    const claims = claimsResponse.data.claims;
    console.log('提取的声明:', claims);
    
    // 2. 对每个声明进行验证
    for (const claim of claims) {
      // 搜索相关信息
      const searchResponse = await axios.post(`${API_BASE}/api/search/exa`, {
        query: claim
      });
      
      // 验证声明
      const verifyResponse = await axios.post(`${API_BASE}/api/verify/claims`, {
        claim: claim,
        original_text: text,
        exasources: searchResponse.data.results.slice(0, 3) // 使用前3个结果
      });
      
      console.log(`声明: ${claim}`);
      console.log(`评估: ${verifyResponse.data.assessment}`);
      console.log(`置信度: ${verifyResponse.data.confidence_score}%`);
      console.log(`摘要: ${verifyResponse.data.summary}`);
      console.log('---');
    }
  } catch (error) {
    console.error('错误:', error.response?.data || error.message);
  }
}

// 使用示例
detectHallucinations('中国的长城是世界上最长的城墙，全长超过两万公里。');
```

### Python
```python
import requests
import json

API_BASE = 'https://hallubacken-5t6wwxo9o-fraps-projects.vercel.app'

def detect_hallucinations(text):
    try:
        # 1. 提取声明
        claims_response = requests.post(
            f'{API_BASE}/api/claims/extract',
            json={'content': text},
            headers={'Content-Type': 'application/json'}
        )
        claims_response.raise_for_status()
        claims = claims_response.json()['claims']
        print('提取的声明:', claims)
        
        # 2. 对每个声明进行验证
        for claim in claims:
            # 搜索相关信息
            search_response = requests.post(
                f'{API_BASE}/api/search/exa',
                json={'query': claim},
                headers={'Content-Type': 'application/json'}
            )
            search_response.raise_for_status()
            
            # 验证声明
            verify_response = requests.post(
                f'{API_BASE}/api/verify/claims',
                json={
                    'claim': claim,
                    'original_text': text,
                    'exasources': search_response.json()['results'][:3]
                },
                headers={'Content-Type': 'application/json'}
            )
            verify_response.raise_for_status()
            
            result = verify_response.json()
            print(f'声明: {claim}')
            print(f'评估: {result["assessment"]}')
            print(f'置信度: {result["confidence_score"]}%')
            print(f'摘要: {result["summary"]}')
            print('---')
            
    except requests.exceptions.RequestException as e:
        print(f'错误: {e}')

# 使用示例
detect_hallucinations('中国的长城是世界上最长的城墙，全长超过两万公里。')
```

### Java
```java
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import com.google.gson.Gson;
import com.google.gson.JsonObject;

public class HallucinationDetector {
    private static final String API_BASE = "https://hallubacken-5t6wwxo9o-fraps-projects.vercel.app";
    private static final HttpClient client = HttpClient.newHttpClient();
    private static final Gson gson = new Gson();
    
    public static void detectHallucinations(String text) {
        try {
            // 1. 提取声明
            JsonObject claimsRequest = new JsonObject();
            claimsRequest.addProperty("content", text);
            
            HttpRequest claimsReq = HttpRequest.newBuilder()
                .uri(URI.create(API_BASE + "/api/claims/extract"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(claimsRequest)))
                .build();
            
            HttpResponse<String> claimsResponse = client.send(claimsReq, 
                HttpResponse.BodyHandlers.ofString());
            
            JsonObject claimsResult = gson.fromJson(claimsResponse.body(), JsonObject.class);
            // 处理声明...
            
        } catch (Exception e) {
            System.err.println("错误: " + e.getMessage());
        }
    }
}
```

## 🔧 错误处理

### 常见错误码
- `400` - 请求参数错误
- `500` - 服务器内部错误

### 错误响应格式
```json
{
  "error": "错误描述",
  "success": false
}
```

## 📊 使用建议

### 1. 批量处理
对于大量文本，建议：
- 分批处理，避免单次请求过大
- 实现重试机制
- 添加请求间隔，避免频率限制

### 2. 缓存策略
- 缓存搜索结果，避免重复搜索
- 缓存验证结果，提高响应速度

### 3. 错误处理
- 实现完善的错误处理机制
- 记录错误日志，便于调试

## 🚀 集成示例

### 前端集成 (React)
```jsx
import React, { useState } from 'react';
import axios from 'axios';

function HallucinationChecker() {
  const [text, setText] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const checkHallucinations = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        'https://hallubacken-5t6wwxo9o-fraps-projects.vercel.app/api/claims/extract',
        { content: text }
      );
      setResults(response.data.claims);
    } catch (error) {
      console.error('检查失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <textarea 
        value={text} 
        onChange={(e) => setText(e.target.value)}
        placeholder="输入要检查的文本..."
      />
      <button onClick={checkHallucinations} disabled={loading}>
        {loading ? '检查中...' : '检查幻觉'}
      </button>
      <div>
        {results.map((claim, index) => (
          <div key={index}>{claim}</div>
        ))}
      </div>
    </div>
  );
}
```

## 📞 支持

如有问题或建议，请通过以下方式联系：
- 创建 GitHub Issue
- 发送邮件至项目维护者

## 📄 许可证

本项目采用 MIT 许可证。 