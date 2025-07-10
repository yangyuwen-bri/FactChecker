# Fact Checker

智能内容事实验证平台 - 基于AI的实时事实检查工具

## 🎯 项目简介

Fact Checker是一个智能的内容事实验证平台，能够帮助用户验证文本内容的准确性。系统通过AI技术自动提取文本中的可验证声明，并通过网络搜索找到相关证据进行事实核查，最终给出验证结果和置信度评分。

### ✨ 主要功能

- 🔍 **智能声明提取**: 自动识别文本中的可验证事实声明
- 🌐 **实时网络验证**: 基于Exa.ai搜索引擎获取相关证据
- 🤖 **AI分析判断**: 使用Claude 3.5 Sonnet分析证据可信度
- 📊 **详细结果展示**: 提供置信度评分和证据来源
- 🌏 **中文界面优化**: 针对中文用户的界面和交互优化

## 📂 项目结构

```
├── README.md                              # 项目说明文档
├── hallucination-detector-api/            # 后端API服务
│   ├── src/                               # 核心源代码
│   ├── client-examples/                   # 前端Demo文件
│   │   ├── demo.html                      # Web演示页面
│   │   └── hallucination-detector-client.js # 客户端库
│   ├── README.md                          # API详细文档
│   └── package.json                       # 依赖配置
└── docs/                                  # 文档目录 (GitHub Pages)
```

## 🚀 快速开始

### 在线体验
- **演示网页**: [GitHub Pages链接](https://yangyuwen-bri.github.io/FactChecker/) (即将上线)
- **API服务**: [https://hallubacken.vercel.app](https://hallubacken.vercel.app)

### 本地运行
```bash
# 启动后端API
cd hallucination-detector-api
npm install
npm start

# 启动前端Demo (新终端)
cd hallucination-detector-api/client-examples
python3 -m http.server 8080
# 访问 http://localhost:8080/demo.html
```

### API使用示例
```javascript
// 使用我们的JavaScript客户端库
const client = new HallucinationDetectorClient('https://hallubacken.vercel.app');

const result = await client.checkText('巴黎是法国的首都');
console.log(result); // 获取验证结果
```

详细的API文档请查看: [`hallucination-detector-api/README.md`](./hallucination-detector-api/README.md)

## 🛠️ 技术栈

- **后端**: Node.js, Express.js
- **AI服务**: Anthropic Claude 3.5 Sonnet
- **搜索引擎**: Exa.ai (专为AI设计的搜索引擎)
- **前端**: 原生JavaScript, HTML5, CSS3
- **部署**: Vercel (后端), GitHub Pages (前端)

## 📄 开源声明与致谢

### 基于开源项目

本项目基于以下优秀的开源项目开发：

**原始项目**: [exa-labs/exa-hallucination-detector](https://github.com/exa-labs/exa-hallucination-detector)
- **描述**: Hallucination Detector - 免费开源的LLM内容准确性验证工具
- **作者**: [Exa Labs团队](https://github.com/exa-labs)
- **技术**: Next.js, TypeScript, Anthropic Claude, Exa.ai
- **许可**: 开源项目 (Free and Open Source)

### 我们的贡献与改进

在原项目基础上，我们进行了以下主要改进：

1. **🌏 完整中文化**
   - 界面语言本地化
   - 中文提示词优化
   - 中文内容处理增强

2. **🎨 产品体验优化**
   - 从"幻觉检测"重新定位为"事实检查"
   - 更直观的用户界面设计
   - 详细模式和简洁模式切换

3. **⚡ 功能增强**
   - 改进的声明提取算法
   - 更精准的可验证性判断
   - 透明度信息展示优化

4. **📚 文档重构**
   - 完整的中文API文档
   - 简化的部署指南
   - 实用的使用示例

5. **🔧 架构调整**
   - 后端API独立部署
   - 静态前端与API分离
   - 更好的错误处理机制

### 感谢

- 感谢 [Exa Labs](https://exa.ai/) 提供强大的AI搜索引擎API
- 感谢 [Anthropic](https://www.anthropic.com/) 提供Claude AI服务
- 感谢原项目作者的开源贡献，为AI事实检查领域提供了宝贵的基础

## 📝 许可证

本项目遵循原项目的开源精神，采用 MIT 许可证。

## 🤝 贡献指南

欢迎提交Issue和Pull Request来帮助改进项目！

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交GitHub Issue
- 项目讨论: [Discussions](https://github.com/yangyuwen-bri/FactChecker/discussions)

---

**Built with ❤️ | 基于开源精神构建** 