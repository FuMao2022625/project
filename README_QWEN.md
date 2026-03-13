# Qwen大语言模型集成文档

## 项目概述

本项目集成了Qwen大语言模型，提供了与模型交互的功能。通过HTTP API接口，项目其他模块可以方便地调用Qwen模型服务，实现智能问答、文本生成等功能。

## 安装和配置

### 1. 安装依赖

```bash
npm install axios
```

### 2. 配置API密钥

在`config.js`文件中配置Qwen模型的API密钥：

```javascript
// config.js
module.exports = {
  qwen: {
    // API密钥，实际使用时应从环境变量获取
    apiKey: process.env.QWEN_API_KEY || 'your-api-key-here',
    // 模型名称
    modelName: 'qwen-turbo',
    // API基础URL
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    // 默认请求参数
    defaultOptions: {
      temperature: 0.7,
      maxTokens: 1024,
      topP: 0.95,
      stream: false
    }
  }
};
```

**注意**：为了安全起见，建议将API密钥存储在环境变量中，而不是直接硬编码在配置文件中。

## API接口说明

### 1. 健康检查接口

**URL**: `/qwen/health`
**方法**: GET
**描述**: 检查Qwen模型服务是否健康

**响应示例**:
```json
{
  "success": true,
  "message": "Qwen model service is healthy",
  "timestamp": "2026-03-13T06:17:53.761Z",
  "metrics": {
    "totalRequests": 0,
    "totalErrors": 0,
    "avgResponseTime": "0.00",
    "errorRate": "0.00",
    "responseTimes": []
  }
}
```

### 2. 模型调用接口

**URL**: `/qwen/chat`
**方法**: POST
**描述**: 调用Qwen模型生成文本

**请求参数**:
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| prompt | string | 是 | 模型输入的提示文本 |
| options | object | 否 | 模型调用选项 |

**options参数说明**:
| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| temperature | number | 0.7 | 生成文本的随机性，值越大越随机 |
| maxTokens | number | 1024 | 生成文本的最大长度 |
| topP | number | 0.95 | 采样策略的参数 |
| stream | boolean | false | 是否使用流式响应 |

**请求示例**:
```json
{
  "prompt": "Hello, Qwen!",
  "options": {
    "maxTokens": 100
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "content": "Hello! I'm Qwen, an AI assistant developed by Alibaba. How can I help you today?",
  "usage": {
    "prompt_tokens": 5,
    "completion_tokens": 20,
    "total_tokens": 25
  },
  "model": "qwen-turbo",
  "id": "chatcmpl-123"
}
```

### 3. 性能指标接口

**URL**: `/qwen/metrics`
**方法**: GET
**描述**: 获取Qwen模型服务的性能指标

**响应示例**:
```json
{
  "success": true,
  "metrics": {
    "totalRequests": 10,
    "totalErrors": 2,
    "avgResponseTime": "500.50",
    "errorRate": "20.00",
    "responseTimes": [450, 520, 480, 510, 490, 530, 470, 500, 520, 510]
  },
  "timestamp": "2026-03-13T06:17:53.761Z"
}
```

### 4. 重置性能指标接口

**URL**: `/qwen/metrics/reset`
**方法**: POST
**描述**: 重置Qwen模型服务的性能指标

**响应示例**:
```json
{
  "success": true,
  "message": "Metrics reset successfully",
  "timestamp": "2026-03-13T06:17:53.761Z"
}
```

## 使用示例

### 1. 通过HTTP API调用

**使用curl**:
```bash
curl -X POST http://localhost:3000/qwen/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, Qwen!", "options": {"maxTokens": 100}}'
```

**使用PowerShell**:
```powershell
$body = @{prompt='Hello, Qwen!'; options=@{maxTokens=100}} | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:3000/qwen/chat -Method POST -Body $body -ContentType 'application/json'
```

### 2. 在项目中直接调用

```javascript
const QwenModel = require('./qwen-model');
const config = require('./config');

// 初始化Qwen模型实例
const qwenModel = new QwenModel(
  config.qwen.apiKey,
  config.qwen.modelName,
  config.qwen.baseURL
);

// 调用模型
async function callQwen() {
  try {
    const response = await qwenModel.sendRequest('Hello, Qwen!');
    console.log('Qwen response:', response.content);
  } catch (error) {
    console.error('Error calling Qwen:', error);
  }
}

callQwen();
```

## 错误处理

Qwen模型服务会处理以下类型的错误：

1. **API错误**：服务器返回错误状态码，如401（未授权）、404（未找到）等
2. **网络错误**：请求已发送但没有收到响应
3. **请求错误**：请求配置出错

错误响应格式：
```json
{
  "success": false,
  "error": "错误信息",
  "details": "错误详情"
}
```

## 性能监控

Qwen模型服务提供了性能监控功能，记录以下指标：

- **总请求数**：已处理的请求总数
- **总错误数**：处理失败的请求总数
- **平均响应时间**：所有请求的平均响应时间（毫秒）
- **错误率**：错误请求占总请求的百分比
- **响应时间列表**：所有请求的响应时间（毫秒）

可以通过`/qwen/metrics`接口获取这些指标，通过`/qwen/metrics/reset`接口重置这些指标。

## 日志记录

Qwen模型服务会将日志记录到以下位置：

1. **控制台**：实时输出日志信息
2. **日志文件**：存储在`./logs`目录下，按日期命名，如`qwen-model_2026-03-13.log`

日志级别包括：
- **info**：一般信息，如请求发送、响应成功等
- **error**：错误信息，如API调用失败、网络错误等
- **warn**：警告信息

## 注意事项

1. **API密钥安全**：请妥善保管API密钥，避免泄露
2. **请求频率限制**：Qwen模型API可能有请求频率限制，请合理控制调用频率
3. **错误处理**：在调用Qwen模型时，请确保添加适当的错误处理逻辑
4. **性能优化**：对于频繁调用的场景，考虑添加缓存机制，减少API调用次数

## 故障排除

### 常见错误

1. **401 Unauthorized**：API密钥格式不正确或无效
   - 解决方案：检查API密钥是否正确，确保在config.js中配置了正确的API密钥

2. **网络错误**：无法连接到Qwen模型API
   - 解决方案：检查网络连接，确保可以访问`https://ark.cn-beijing.volces.com/api/v3`

3. **请求超时**：API响应超时
   - 解决方案：检查网络连接，或调整请求超时设置

### 日志查看

如果遇到问题，可以查看日志文件了解详细信息：

```bash
cat ./logs/qwen-model_$(date +%Y-%m-%d).log
```

## 总结

本项目成功集成了Qwen大语言模型，提供了简洁易用的API接口，支持模型调用、性能监控和日志记录等功能。通过本集成，项目其他模块可以方便地使用Qwen模型的能力，实现智能问答、文本生成等功能。