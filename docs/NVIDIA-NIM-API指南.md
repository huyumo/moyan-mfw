# NVIDIA NIM API 接入指南

## 一、基本信息

| 项目 | 内容 |
|------|------|
| **API端点** | `https://integrate.api.nvidia.com/v1` |
| **API格式** | 完全兼容 OpenAI API 格式 |
| **免费额度** | 开发者验证后：每月 5000次 + 2000万 tokens |
| **速率限制** | 每分钟40次请求（40 RPM） |
| **数据安全** | NVIDIA承诺数据不会被用于模型训练 |
| **国内访问** | 无需代理，国内可直接访问 |

## 二、获取 API Key

1. 访问 https://build.nvidia.com
2. 点击右上角 "Log In"（可用 Google/GitHub/邮箱注册）
3. 进行手机号验证（选择 China +86）
4. 进入任意模型页面，点击 "Get API Key" 生成密钥
5. 复制保存（格式为 `nvapi-xxxxx`）

> **注意**：建议选择 "Never Expire"（永不过期），Key 只显示一次，务必保存。

## 三、可用模型列表（API实时查询）

> **查询时间**：2026-05-01
> **模型总数**：约 140+ 个

### Meta Llama 系列

| Model ID | 说明 |
|----------|------|
| `meta/llama-3.1-405b-instruct` | Llama 3.1 405B - 最大参数版本 |
| `meta/llama-3.1-70b-instruct` | Llama 3.1 70B - 高性能通用模型 |
| `meta/llama-3.1-8b-instruct` | Llama 3.1 8B - 轻量级版本 |
| `meta/llama-3.2-1b-instruct` | Llama 3.2 1B - 最小版本 |
| `meta/llama-3.2-3b-instruct` | Llama 3.2 3B - 小型模型 |
| `meta/llama-3.2-11b-vision-instruct` | Llama 3.2 11B 视觉版 |
| `meta/llama-3.2-90b-vision-instruct` | Llama 3.2 90B 视觉版 |
| `meta/llama-3.3-70b-instruct` | Llama 3.3 70B - 最新版本 |
| `meta/llama-4-maverick-17b-128e-instruct` | Llama 4 Maverick - 最新一代 |
| `meta/llama-guard-4-12b` | Llama Guard 4 - 安全防护模型 |
| `meta/llama2-70b` | Llama 2 70B - 上一代模型 |
| `meta/codellama-70b` | Code Llama 70B - 代码生成专用 |

### DeepSeek 系列

| Model ID | 说明 |
|----------|------|
| `deepseek-ai/deepseek-coder-6.7b-instruct` | DeepSeek Coder 6.7B - 代码模型 |
| `deepseek-ai/deepseek-v3.1-terminus` | DeepSeek V3.1 - 最新通用模型 |
| `deepseek-ai/deepseek-v3.2` | DeepSeek V3.2 |
| `deepseek-ai/deepseek-v4-flash` | DeepSeek V4 Flash - 快速版本 |
| `deepseek-ai/deepseek-v4-pro` | DeepSeek V4 Pro - 专业版本 |

### Qwen 通义千问系列

| Model ID | 说明 |
|----------|------|
| `qwen/qwen2.5-coder-32b-instruct` | Qwen 2.5 Coder - 代码模型 |
| `qwen/qwen3.5-122b-a10b` | Qwen 3.5 122B - 大参数版本 |
| `qwen/qwen3.5-397b-a17b` | Qwen 3.5 397B - 最大版本 |
| `qwen/qwen3-coder-480b-a35b-instruct` | Qwen 3 Coder 480B - 代码模型 |
| `qwen/qwen3-next-80b-a3b-instruct` | Qwen 3 Next 80B |
| `qwen/qwen3-next-80b-a3b-thinking` | Qwen 3 Next Thinking - 推理版 |

### 智谱 GLM 系列

| Model ID | 说明 |
|----------|------|
| `z-ai/glm4.7` | GLM 4.7 - 中文能力强 |
| `z-ai/glm5` | GLM 5 - 最新版本 |
| `z-ai/glm-5.1` | GLM 5.1 - 增强版本 |

### MiniMax 系列

| Model ID | 说明 |
|----------|------|
| `minimaxai/minimax-m2.5` | MiniMax M2.5 |
| `minimaxai/minimax-m2.7` | MiniMax M2.7 - 最新版本 |

### Moonshot Kimi 系列

| Model ID | 说明 |
|----------|------|
| `moonshotai/kimi-k2-instruct` | Kimi K2 |
| `moonshotai/kimi-k2-instruct-0905` | Kimi K2 (0905版本) |
| `moonshotai/kimi-k2.6` | Kimi K2.6 - 最新版本 |
| `moonshotai/kimi-k2-thinking` | Kimi K2 Thinking - 推理版 |

### Mistral 系列

| Model ID | 说明 |
|----------|------|
| `mistralai/mistral-large` | Mistral Large - 大参数版本 |
| `mistralai/mistral-large-2-instruct` | Mistral Large 2 |
| `mistralai/mistral-large-3-675b-instruct-2512` | Mistral Large 3 675B - 最新最大 |
| `mistralai/mistral-medium-3-instruct` | Mistral Medium 3 |
| `mistralai/mistral-medium-3.5-128b` | Mistral Medium 3.5 |
| `mistralai/mistral-small-4-119b-2603` | Mistral Small 4 |
| `mistralai/mistral-7b-instruct-v0.3` | Mistral 7B |
| `mistralai/ministral-14b-instruct-2512` | Ministral 14B |
| `mistralai/mixtral-8x7b-instruct-v0.1` | Mixtral 8x7B |
| `mistralai/mixtral-8x22b-instruct-v0.1` | Mixtral 8x22B |
| `mistralai/mixtral-8x22b-v0.1` | Mixtral 8x22B Base |
| `mistralai/codestral-22b-instruct-v0.1` | Codestral 22B - 代码模型 |
| `mistralai/devstral-2-123b-instruct-2512` | Devstral 2 - 开发者模型 |
| `mistralai/magistral-small-2506` | Magistral Small |
| `mistralai/mistral-nemotron` | Mistral Nemotron |

### Google Gemma 系列

| Model ID | 说明 |
|----------|------|
| `google/gemma-2-2b-it` | Gemma 2 2B |
| `google/gemma-2b` | Gemma 2B Base |
| `google/gemma-3-4b-it` | Gemma 3 4B |
| `google/gemma-3-12b-it` | Gemma 3 12B |
| `google/gemma-3-27b-it` | Gemma 3 27B |
| `google/gemma-3n-e2b-it` | Gemma 3n E2B |
| `google/gemma-3n-e4b-it` | Gemma 3n E4B |
| `google/gemma-4-31b-it` | Gemma 4 31B - 最新版本 |
| `google/codegemma-7b` | CodeGemma 7B - 代码模型 |
| `google/codegemma-1.1-7b` | CodeGemma 1.1 7B |
| `google/recurrentgemma-2b` | Recurrent Gemma 2B |
| `google/deplot` | Deplot - 图表理解模型 |

### Microsoft Phi 系列

| Model ID | 说明 |
|----------|------|
| `microsoft/phi-3.5-moe-instruct` | Phi 3.5 MoE |
| `microsoft/phi-3-vision-128k-instruct` | Phi 3 Vision - 视觉模型 |
| `microsoft/phi-4-mini-instruct` | Phi 4 Mini |
| `microsoft/phi-4-multimodal-instruct` | Phi 4 Multimodal - 多模态 |
| `microsoft/kosmos-2` | Kosmos 2 - 多模态模型 |

### IBM Granite 系列

| Model ID | 说明 |
|----------|------|
| `ibm/granite-3.0-3b-a800m-instruct` | Granite 3.0 3B |
| `ibm/granite-3.0-8b-instruct` | Granite 3.0 8B |
| `ibm/granite-34b-code-instruct` | Granite 34B Code |
| `ibm/granite-8b-code-instruct` | Granite 8B Code |

### NVIDIA Nemotron 系列

| Model ID | 说明 |
|----------|------|
| `nvidia/llama-3.1-nemotron-70b-instruct` | Nemotron 70B - NVIDIA优化版 |
| `nvidia/llama-3.1-nemotron-51b-instruct` | Nemotron 51B |
| `nvidia/llama-3.1-nemotron-nano-8b-v1` | Nemotron Nano 8B |
| `nvidia/llama-3.1-nemotron-ultra-253b-v1` | Nemotron Ultra 253B |
| `nvidia/llama-3.3-nemotron-super-49b-v1` | Nemotron Super 49B |
| `nvidia/llama-3.3-nemotron-super-49b-v1.5` | Nemotron Super 49B v1.5 |
| `nvidia/nemotron-4-340b-instruct` | Nemotron 4 340B |
| `nvidia/nemotron-4-340b-reward` | Nemotron 4 Reward |
| `nvidia/nemotron-3-nano-30b-a3b` | Nemotron 3 Nano 30B |
| `nvidia/nemotron-3-super-120b-a12b` | Nemotron 3 Super 120B |
| `nvidia/nemotron-mini-4b-instruct` | Nemotron Mini 4B |
| `nvidia/nemotron-nano-12b-v2-vl` | Nemotron Nano 12B VL |
| `nvidia/nvidia-nemotron-nano-9b-v2` | Nemotron Nano 9B v2 |

### NVIDIA 专用功能模型

| Model ID | 功能 |
|----------|------|
| `nvidia/llama-3.1-nemoguard-8b-content-safety` | 内容安全检测 |
| `nvidia/llama-3.1-nemoguard-8b-topic-control` | 话题控制 |
| `nvidia/llama-3.1-nemotron-safety-guard-8b-v3` | 安全防护 |
| `nvidia/nemotron-3-content-safety` | 内容安全 |
| `nvidia/nemotron-content-safety-reasoning-4b` | 安全推理 |
| `nvidia/ai-synthetic-video-detector` | AI视频检测 |
| `nvidia/gliner-pii` | PII个人信息检测 |
| `nvidia/cosmos-reason2-8b` | Cosmos推理模型 |
| `nvidia/riva-translate-4b-instruct` | 翻译模型 |
| `nvidia/riva-translate-4b-instruct-v1.1` | 翻译模型v1.1 |
| `nvidia/nemoretriever-parse` | 文档解析 |
| `nvidia/nemotron-parse` | 解析模型 |

### NVIDIA 嵌入模型

| Model ID | 功能 |
|----------|------|
| `nvidia/nv-embed-v1` | 通用嵌入 |
| `nvidia/nv-embedqa-e5-v5` | QA嵌入 |
| `nvidia/nv-embedqa-mistral-7b-v2` | Mistral嵌入 |
| `nvidia/nv-embedcode-7b-v1` | 代码嵌入 |
| `nvidia/embed-qa-4` | QA嵌入4B |
| `nvidia/llama-nemotron-embed-1b-v2` | Llama嵌入 |
| `nvidia/llama-nemotron-embed-vl-1b-v2` | 视觉嵌入 |
| `nvidia/llama-3.2-nv-embedqa-1b-v1` | Llama 3.2嵌入 |
| `nvidia/llama-3.2-nv-embedqa-1b-v2` | Llama 3.2嵌入v2 |
| `nvidia/llama-3.2-nemoretriever-300m-embed-v1` | 检索嵌入 |
| `nvidia/llama-3.2-nemoretriever-1b-vlm-embed-v1` | 视觉检索嵌入 |
| `nvidia/nvclip` | NVCLIP多模态 |
| `nvidia/neva-22b` | Neva 22B视觉语言 |
| `nvidia/vila` | VILA视觉语言 |

### OpenAI GPT-OSS 系列

| Model ID | 说明 |
|----------|------|
| `openai/gpt-oss-20b` | GPT-OSS 20B |
| `openai/gpt-oss-120b` | GPT-OSS 120B |

### 其他模型

| Model ID | 组织/说明 |
|----------|----------|
| `01-ai/yi-large` | 01.AI Yi Large |
| `ai21labs/jamba-1.5-large-instruct` | AI21 Jamba |
| `aisingapore/sea-lion-7b-instruct` | SEA-LION东南亚语言 |
| `baai/bge-m3` | BGE-M3嵌入模型 |
| `bigcode/starcoder2-15b` | StarCoder2代码模型 |
| `bytedance/seed-oss-36b-instruct` | 字节跳动Seed |
| `databricks/dbrx-instruct` | Databricks DBRX |
| `snowflake/arctic-embed-l` | Snowflake Arctic嵌入 |
| `stepfun-ai/step-3.5-flash` | StepFun Step 3.5 |
| `stockmark/stockmark-2-100b-instruct` | Stockmark金融 |
| `upstage/solar-10.7b-instruct` | Upstage Solar |
| `writer/palmyra-creative-122b` | Writer Palmyra创意 |
| `writer/palmyra-fin-70b-32k` | Writer Palmyra金融 |
| `writer/palmyra-med-70b` | Writer Palmyra医疗 |
| `writer/palmyra-med-70b-32k` | Writer Palmyra医疗32K |
| `sarvamai/sarvam-m` | Sarvam印度语言 |
| `zyphra/zamba2-7b-instruct` | Zamba2 |
| `nv-mistralai/mistral-nemo-12b-instruct` | NV Mistral Nemo |
| `adept/fuyu-8b` | Adept Fuyu多模态 |
| `abacusai/dracarys-llama-3.1-70b-instruct` | Dracarys Llama |
| `nvidia/ising-calibration-1-35b-a3b` | Ising校准模型 |

## 四、API 调用示例

### Python 调用

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key="nvapi-your-api-key-here"
)

# 非流式调用
response = client.chat.completions.create(
    model="meta/llama-3.3-70b-instruct",
    messages=[{"role": "user", "content": "你好，请介绍一下你自己"}],
    max_tokens=1024,
    temperature=0.7
)
print(response.choices[0].message.content)

# 流式调用
response = client.chat.completions.create(
    model="meta/llama-3.3-70b-instruct",
    messages=[{"role": "user", "content": "写一首关于春天的诗"}],
    max_tokens=1024,
    temperature=0.7,
    stream=True
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

### cURL 调用

```bash
curl -X POST "https://integrate.api.nvidia.com/v1/chat/completions" \
  -H "Authorization: Bearer nvapi-your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta/llama-3.3-70b-instruct",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 1024,
    "temperature": 0.7
  }'
```

### JavaScript/TypeScript 调用

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: 'nvapi-your-api-key-here'
});

const response = await client.chat.completions.create({
  model: 'meta/llama-3.3-70b-instruct',
  messages: [{ role: 'user', content: '你好' }],
  max_tokens: 1024
});

console.log(response.choices[0].message.content);
```

## 五、模型选择建议

| 使用场景 | 推荐模型 | 备选模型 |
|----------|----------|----------|
| **中文对话** | `z-ai/glm4.7` | `qwen/qwen2.5-72b-instruct` |
| **代码编程** | `deepseek-ai/deepseek-v3` | `meta/codellama-70b-instruct` |
| **英文通用** | `meta/llama-3.3-70b-instruct` | `mistralai/mistral-large` |
| **长文本处理** | `moonshotai/kimi-k2-instruct-0905` | - |
| **推理任务** | `deepseek-ai/deepseek-r1` | - |
| **快速响应** | `meta/llama-3.1-8b-instruct` | `minimaxai/minimax-m2.5` |
| **边缘设备** | `meta/llama-3.2-1b-instruct` | `google/gemma-2-2b-it` |

## 六、工具调用（Tool Calling）

部分模型支持工具调用功能：

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "获取指定城市的天气信息",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "城市名称"}
                },
                "required": ["city"]
            }
        }
    }
]

response = client.chat.completions.create(
    model="meta/llama-3.1-70b-instruct",  # 支持工具调用
    messages=[{"role": "user", "content": "北京今天天气怎么样？"}],
    tools=tools,
    tool_choice="auto"
)
```

支持工具调用的模型：
- `meta/llama-3.1-70b-instruct`
- `meta/llama-3.1-8b-instruct`
- `mistralai/mistral-large`
- `google/gemma-3-27b-it`

## 七、Trae IDE 接入配置

### 前置条件

- 使用 **Trae CN版**（国内版），下载地址：https://www.trae.cn/ide/download
- 海外版不支持自定义API配置

### 配置步骤

#### 步骤1：打开模型设置

**方法A：通过对话输入框**
1. 打开 Trae IDE
2. 在对话输入框的右下角，点击当前模型名称
3. 点击 **"+ 添加模型"** 按钮

**方法B：通过设置菜单**
1. 点击右上角头像 → **"设置"**
2. 左侧导航选择 **"模型"**
3. 点击 **"+ 添加模型"** 按钮

#### 步骤2：填写配置信息

在"添加模型"对话框中填写：

| 配置项 | 值 |
|--------|-----|
| **服务商** | `OpenAI` |
| **模型** | 点击"使用其他模型"，填写：`z-ai/glm-5.1` |
| **API 密钥** | `nvapi-your-api-key-here`（替换为你自己的 Key） |
| **自定义请求地址** | `https://integrate.api.nvidia.com/v1` |

#### 步骤3：保存并测试

1. 点击 **"添加模型"** 按钮
2. 等待验证连接成功
3. 在对话面板的模型下拉列表中选择 `z-ai/glm-5.1`
4. 发送测试消息验证

### 配置示意图

```
┌─────────────────────────────────────────┐
│           添加模型                       │
├─────────────────────────────────────────┤
│ 服务商:        [OpenAI            ▼]    │
│                                         │
│ 模型:          [使用其他模型...]         │
│               → z-ai/glm-5.1           │
│                                         │
│ API 密钥:      nvapi-your-api-key...  │
│                                         │
│ 自定义请求地址:                          │
│               https://integrate.api.    │
│               nvidia.com/v1             │
│                                         │
│           [添加模型]                     │
└─────────────────────────────────────────┘
```

### 常见问题排查

| 问题 | 解决方案 |
|------|----------|
| **连接失败** | 请求地址必须以 `/v1` 结尾，末尾不要加斜杠 |
| **API密钥无效** | 确认Key完整复制，无多余空格 |
| **模型不存在** | 确认模型ID为 `z-ai/glm-5.1`，大小写敏感 |
| **网络超时** | NVIDIA API国内直连，检查网络连接 |

### 其他推荐模型

| 用途 | 模型ID | 说明 |
|------|--------|------|
| 中文对话 | `z-ai/glm5` | GLM最新版本 |
| 代码编程 | `deepseek-ai/deepseek-v4-pro` | 编程能力强 |
| 英文通用 | `meta/llama-3.3-70b-instruct` | Llama最新 |
| 快速响应 | `meta/llama-3.2-1b-instruct` | 轻量级 |
| 最强性能 | `mistralai/mistral-large-3-675b-instruct-2512` | 675B参数 |

## 八、注意事项

1. **免费政策**：目前免费额度主要用于开发测试，生产环境建议评估付费方案
2. **数据安全**：NVIDIA承诺你的数据不会被用于模型训练
3. **API Key安全**：请妥善保管你的API Key，不要泄露给他人
4. **速率限制**：每分钟40次请求，超出会返回错误
5. **模型可用性**：免费额度和可用模型可能会随时间调整，请以官网最新信息为准

## 八、相关链接

- **官方文档**：https://docs.nvidia.com/nim/
- **模型目录**：https://build.nvidia.com/models
- **API参考**：https://docs.nvidia.com/nim/large-language-models/latest/
- **开发者计划**：https://developer.nvidia.com/nim

---

> 文档创建日期：2026-05-01
> 信息来源：NVIDIA官方文档及社区资料