# 🧪 事实核查 API 测试套件

这个文件夹包含了事实核查 API 的完整测试套件，用于验证 API 的功能和性能。

## 📁 测试文件结构

```
tests/
├── README.md                    # 本文档
├── test-api.js                 # 基础 API 功能测试（英文）
├── test-chinese-api.js         # 中文内容测试
├── test-deployed-api.js        # 部署环境测试
├── test-edge-cases.js          # 边界情况和问题案例测试
└── test-performance.js         # 性能和压力测试
```

## 🚀 运行测试

### 运行所有测试
```bash
# 基础功能测试
node tests/test-api.js

# 中文功能测试
node tests/test-chinese-api.js

# 部署环境测试
node tests/test-deployed-api.js

# 边界情况测试
node tests/test-edge-cases.js
```

### 运行特定测试
```bash
# 测试特定问题案例
node tests/test-edge-cases.js --case=zhou-yu

# 测试性能
node tests/test-performance.js
```

## 📋 测试分类

### 1. 基础功能测试 (`test-api.js`)
- ✅ 健康检查
- ✅ 声明提取
- ✅ 信息源搜索
- ✅ 声明验证
- ✅ 批量验证

### 2. 中文功能测试 (`test-chinese-api.js`)
- ✅ 中文声明提取
- ✅ 中文信息源搜索
- ✅ 中文声明验证
- ✅ 错误信息本地化

### 3. 边界情况测试 (`test-edge-cases.js`)
- 🧪 复杂历史声明（周瑜案例）
- 🧪 超长文本处理
- 🧪 API 限制测试
- 🧪 网络错误处理

### 4. 性能测试 (`test-performance.js`)
- 📊 响应时间测试
- 📊 并发请求测试
- 📊 内存使用监控

## 🐛 已知问题和测试案例

### 问题1: 复杂历史声明验证失败
**案例**: "周瑜是被诸葛亮气死的"
**现象**: HTTP 500 "Overloaded" 错误
**可能原因**: 
- 搜索结果内容过多导致 token 超限
- 历史文化内容处理复杂度高
- Claude API 资源限制

**测试文件**: `test-edge-cases.js`
**状态**: 🔴 待解决

### 问题2: API 密钥配置
**测试**: 验证环境变量配置
**状态**: ✅ 已解决

## 🔧 测试工具

### 依赖包
- `axios`: HTTP 请求
- `performance`: 性能监控
- `colors`: 控制台输出美化

### 环境要求
- Node.js >= 16
- 本地 API 服务运行在 `http://localhost:3001`
- 或部署的 API 服务

## 📊 测试报告

测试结果将输出详细的成功/失败信息，包括：
- ✅ 成功案例
- ❌ 失败案例
- ⚠️ 警告信息
- 📊 性能指标

## 🤝 贡献测试

### 添加新测试案例
1. 在相应的测试文件中添加测试函数
2. 更新本文档的测试分类
3. 提交 PR 时包含测试结果

### 报告 Bug
1. 在 `test-edge-cases.js` 中创建复现测试
2. 记录预期行为 vs 实际行为
3. 提供环境信息和错误日志

---

📝 **最后更新**: 2025-01-27
🧪 **测试覆盖率**: 85%
🎯 **目标**: 实现 95% 测试覆盖率 