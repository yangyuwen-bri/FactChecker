# 🔍 事实核查 API

一个基于 AI 的智能事实验证服务，可以检测文本内容中的虚假信息。支持 AI 生成内容幻觉检测、新闻真实性验证、学术内容审核等多种应用场景。

## ✨ 功能特性

- 🔍 **声明提取**: 从文本中自动提取可验证的声明
- 🌐 **信息搜索**: 使用 Exa.ai 搜索相关信息源
- ✅ **事实验证**: 使用 Anthropic Claude 验证声明真实性
- 🌍 **多语言支持**: 支持中文和英文内容
- 🚀 **快速部署**: 一键部署到 Vercel
- 📊 **详细报告**: 提供置信度和验证摘要

## 🚀 快速开始

### API 地址
```
https://hallubacken-5t6wwxo9o-fraps-projects.vercel.app
```

### 简单示例

```bash
# 获取 API 信息
curl https://hallubacken-5t6wwxo9o-fraps-projects.vercel.app/

# 提取声明
curl -X POST https://hallubacken-5t6wwxo9o-fraps-projects.vercel.app/api/claims/extract \
  -H "Content-Type: application/json" \
  -d '{"content": "中国的长城是世界上最长的城墙，全长超过两万公里。"}'
```

## 📡 API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/` | GET | 获取 API 信息 |
| `/api/claims/extract` | POST | 提取声明 |
| `/api/search/exa` | POST | 搜索信息源 |
| `/api/verify/claims` | POST | 验证单个声明 |
| `/api/verify/claims/batch` | POST | 批量验证声明 |

## 💻 使用示例

### JavaScript/Node.js

```javascript
const axios = require('axios');

const API_BASE = 'https://hallubacken-5t6wwxo9o-fraps-projects.vercel.app';

async function detectHallucinations(text) {
  // 1. 提取声明
  const claimsResponse = await axios.post(`${API_BASE}/api/claims/extract`, {
    content: text
  });
  
  const claims = claimsResponse.data.claims;
  
  // 2. 验证每个声明
  for (const claim of claims) {
    const searchResponse = await axios.post(`${API_BASE}/api/search/exa`, {
      query: claim
    });
    
    const verifyResponse = await axios.post(`${API_BASE}/api/verify/claims`, {
      claim: claim,
      original_text: text,
      exasources: searchResponse.data.results.slice(0, 3)
    });
    
    console.log(`声明: ${claim}`);
    console.log(`评估: ${verifyResponse.data.assessment}`);
    console.log(`置信度: ${verifyResponse.data.confidence_score}%`);
  }
}

detectHallucinations('中国的长城是世界上最长的城墙，全长超过两万公里。');
```

### Python

```python
import requests

API_BASE = 'https://hallubacken-5t6wwxo9o-fraps-projects.vercel.app'

def detect_hallucinations(text):
    # 1. 提取声明
    claims_response = requests.post(
        f'{API_BASE}/api/claims/extract',
        json={'content': text}
    )
    claims = claims_response.json()['claims']
    
    # 2. 验证每个声明
    for claim in claims:
        search_response = requests.post(
            f'{API_BASE}/api/search/exa',
            json={'query': claim}
        )
        
        verify_response = requests.post(
            f'{API_BASE}/api/verify/claims',
            json={
                'claim': claim,
                'original_text': text,
                'exasources': search_response.json()['results'][:3]
            }
        )
        
        result = verify_response.json()
        print(f'声明: {claim}')
        print(f'评估: {result["assessment"]}')
        print(f'置信度: {result["confidence_score"]}%')

detect_hallucinations('中国的长城是世界上最长的城墙，全长超过两万公里。')
```

## 🛠️ 本地开发

### 环境要求
- Node.js >= 18.0.0
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 环境变量
创建 `.env` 文件：
```env
EXA_API_KEY=your_exa_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
NODE_ENV=development
PORT=3000
```

### 启动开发服务器
```bash
npm run dev
```

### 运行测试
```bash
npm test
npm run test-api
npm run test-chinese
```

## 🚀 部署

### Vercel 部署（推荐）
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

### 设置环境变量
在 Vercel 控制台中设置：
- `EXA_API_KEY` - Exa API 密钥 ([获取地址](https://dashboard.exa.ai/api-keys))
- `ANTHROPIC_API_KEY` - Anthropic API 密钥 ([获取地址](https://console.anthropic.com))
- `NODE_ENV` - 设置为 `production`

### 其他部署选项

#### Railway 部署
```bash
npm i -g @railway/cli
railway login
railway up
```

#### Docker 部署
```bash
docker build -t fact-checker .
docker run -p 3000:3000 \
  -e EXA_API_KEY=your_key \
  -e ANTHROPIC_API_KEY=your_key \
  fact-checker
```

### Docker 部署
```bash
# 构建镜像
docker build -t hallucination-detector-api .

# 运行容器
docker run -p 3000:3000 \
  -e EXA_API_KEY=your_key \
  -e ANTHROPIC_API_KEY=your_key \
  hallucination-detector-api
```

## 📁 项目结构

```
hallucination-detector-api/
├── src/
│   ├── routes/
│   │   ├── claims.js      # 声明提取路由
│   │   ├── search.js      # 搜索路由
│   │   └── verify.js      # 验证路由
│   ├── middleware/
│   │   ├── rateLimit.js   # 限流中间件
│   │   └── cors.js        # CORS 中间件
│   └── server.js          # 主服务器文件
├── client-examples/       # 客户端示例
│   ├── hallucination-detector-client.js
│   └── demo.html
├── test-api.js           # API 测试脚本
├── test-chinese-api.js   # 中文 API 测试脚本
├── package.json
├── vercel.json           # Vercel 配置
└── README.md
```

## 🔧 配置选项

### 环境变量

| 变量名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| `EXA_API_KEY` | ✅ | - | Exa API 密钥 |
| `ANTHROPIC_API_KEY` | ✅ | - | Anthropic API 密钥 |
| `NODE_ENV` | ❌ | development | 运行环境 |
| `PORT` | ❌ | 3000 | 服务器端口 |
| `RATE_LIMIT_WINDOW_MS` | ❌ | 900000 | 限流窗口时间（毫秒） |
| `RATE_LIMIT_MAX_REQUESTS` | ❌ | 100 | 限流最大请求数 |
| `ALLOWED_ORIGINS` | ❌ | * | 允许的 CORS 域名 |

## 📊 API 响应格式

### 成功响应
```json
{
  "success": true,
  "data": {...}
}
```

### 错误响应
```json
{
  "success": false,
  "error": "错误描述"
}
```

## 🎯 使用场景

- **AI 幻觉检测**: 检测 AI 生成内容中的虚假信息
- **新闻事实核查**: 验证新闻报道的真实性
- **学术内容审核**: 检查研究论文中的事实准确性
- **社交媒体监管**: 识别社交媒体上的虚假信息
- **教育内容验证**: 确保教育材料的准确性
- **内容创作辅助**: 帮助内容创作者验证引用事实

## 🚀 快速集成

### JavaScript/Node.js 示例
```javascript
const axios = require('axios');
const API_BASE = 'https://hallubacken.vercel.app';

async function verifyContent(text) {
  try {
    // 1. 提取声明
    const claimsResponse = await axios.post(`${API_BASE}/api/claims/extract`, {
      content: text
    });
    
    // 2. 验证每个声明
    const verifications = [];
    for (const claim of claimsResponse.data.data.claims) {
      // 搜索信息源
      const searchResponse = await axios.post(`${API_BASE}/api/search/exa`, {
        claim: claim.claim
      });
      
      // 验证声明
      const verifyResponse = await axios.post(`${API_BASE}/api/verify/claims`, {
        claim: claim.claim,
        original_text: claim.original_text,
        exasources: searchResponse.data.data.results
      });
      
      verifications.push(verifyResponse.data);
    }
    
    return verifications;
  } catch (error) {
    console.error('验证失败:', error);
  }
}
```

### 前端集成
```html
<script src="hallucination-detector-client.js"></script>
<script>
const client = new HallucinationDetectorClient('https://hallubacken.vercel.app');

async function checkFacts() {
  const text = document.getElementById('textInput').value;
  
  try {
    const result = await client.detectHallucinations(text, {
      maxSearchResults: 3,
      confidenceThreshold: 80,
      includeSources: true
    });
    
    console.log('验证结果:', result);
  } catch (error) {
    console.error('验证失败:', error);
  }
}
</script>
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发流程
1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。

## 📞 支持

- 📧 邮箱: [项目维护者邮箱]
- 🐛 Issues: [GitHub Issues]
- 📖 文档: [API 使用指南](API_USAGE_GUIDE.md)

## 🙏 致谢

- [Exa.ai](https://exa.ai) - 提供搜索 API
- [Anthropic](https://anthropic.com) - 提供 Claude AI 模型
- [Vercel](https://vercel.com) - 提供部署平台

---

⭐ 如果这个项目对你有帮助，请给它一个星标！ 