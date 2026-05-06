# MiniMind SFT 训练方案设计

## 1. 背景与目标

### 1.1 现状

moyan-mfw 训练数据提取系统已完成 v1 建设：
- 10 个维度自动提取 + 2 个手动补充 + 开发经验捕获
- 输出 2,383 条训练数据 + 125 条测试数据（`all-train.jsonl`, ~1.2MB）
- 数据格式：`{"conversations": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}`

### 1.2 目标

将提取的领域数据与 MiniMind 通用 SFT 数据混合，在阿里云 PAI-DSW 上完成 SFT 训练，产出 moyan-mfw 专属模型。

### 1.3 关键约束

| 约束项 | 值 | 说明 |
|--------|---|------|
| 本地设备 | Intel Ultra 9 185H + 32GB RAM | 无 NVIDIA GPU，无法本地训练 |
| 训练平台 | 阿里云 PAI-DSW | 750 计算时免费额度 |
| 基座模型 | MiniMind-3 (64M Dense) | 8层768维，6400词表 |
| max_seq_len | 2048 | 需降低 batch_size |
| 数据策略 | 自然混合比例 | 通用:领域 ≈ 100:1 |

---

## 2. 架构设计

### 2.1 整体架构

```
E:\Moyan\moyan\minimind\              ← MiniMind 仓库（已克隆）
├── test/                               ← MiniMind 主代码
│   ├── dataset/
│   │   ├── sft_t2t_mini.jsonl          ← 通用 SFT 数据（需下载）
│   │   ├── sft_moyan_mfw.jsonl         ← 领域数据（桥接脚本生成）
│   │   └── lm_dataset.py
│   ├── model/
│   │   ├── model_minimind.py
│   │   ├── tokenizer.json
│   │   └── tokenizer_config.json
│   ├── trainer/
│   │   └── train_full_sft.py
│   └── scripts/
│       ├── bridge_data.py              ← [新建] 数据桥接脚本
│       └── train_moyan_sft.sh          ← [新建] 训练启动脚本
└── moyan-mfw/                          ← moyan-mfw 快捷引用（已存在）
```

### 2.2 数据流

```
moyan-mfw/scripts/training-data/
  ├── output/all-train.jsonl (2,383条) ──┐
  └── data/test-set/test-set.jsonl (125条)│
                                           │ bridge_data.py
                                           ├── 复制 + token过滤 + 混合
                                           │
minimind/test/dataset/                     │
  ├── sft_t2t_mini.jsonl (~160万条) ──────┘
  └── sft_moyan_mfw.jsonl (生成) ← 过滤后的领域数据
      sft_mixed.jsonl (生成)      ← 通用+领域混合数据
```

### 2.3 训练流

```
PAI-DSW 实例
  ├── 1. git clone minimind
  ├── 2. 上传 sft_moyan_mfw.jsonl
  ├── 3. 下载 sft_t2t_mini.jsonl + 预训练权重
  ├── 4. bridge_data.py 生成混合数据集
  ├── 5. train_full_sft.py --data_path sft_mixed.jsonl
  └── 6. eval_llm.py 验证模型效果
```

---

## 3. 核心组件设计

### 3.1 数据桥接脚本 `bridge_data.py`

**职责**：将 moyan-mfw 训练数据适配到 MiniMind 训练环境。

**功能清单**：

1. **数据复制** — 从 moyan-mfw 输出目录复制 `all-train.jsonl` 到 `dataset/sft_moyan_mfw.jsonl`
2. **Token 长度过滤** — 使用 MiniMind tokenizer 重新编码，过滤超过 max_seq_len 的条目
3. **数据混合** — 将通用 SFT 数据与领域数据合并为 `sft_mixed.jsonl`
4. **统计报告** — 输出数据量、过滤率、混合比例等统计

**关键实现**：

```python
def filter_by_token_length(data, tokenizer, max_len):
    """过滤超过 max_len token 的条目"""
    filtered = []
    for item in data:
        total_tokens = 0
        for msg in item["conversations"]:
            tokens = tokenizer.encode(msg["content"])
            total_tokens += len(tokens)
        # 加上角色标记开销 (每条消息约3-5个特殊token)
        overhead = len(item["conversations"]) * 5
        if total_tokens + overhead <= max_len:
            filtered.append(item)
    return filtered
```

**命令行接口**：

```bash
# 完整流程：复制+过滤+混合
python bridge_data.py --source ../../../moyan-mfw/scripts/training-data/output/all-train.jsonl \
                      --general_sft dataset/sft_t2t_mini.jsonl \
                      --max_seq_len 2048 \
                      --output_dir dataset/

# 仅过滤+统计（不混合）
python bridge_data.py --source ../output/all-train.jsonl \
                      --max_seq_len 2048 \
                      --filter_only
```

### 3.2 训练启动脚本 `train_moyan_sft.sh`

封装 MiniMind SFT 训练命令，配置领域适配参数：

```bash
#!/bin/bash
cd trainer
python train_full_sft.py \
    --data_path ../dataset/sft_mixed.jsonl \
    --max_seq_len 2048 \
    --batch_size 4 \
    --accumulation_steps 4 \
    --learning_rate 5e-6 \
    --epochs 3 \
    --hidden_size 768 \
    --from_weight pretrain \
    --save_dir ../out \
    --save_weight moyan_sft
```

**参数调整说明**：

| 参数 | 默认值 | 调整值 | 原因 |
|------|--------|--------|------|
| `max_seq_len` | 768 | 2048 | 覆盖更多领域数据 |
| `batch_size` | 16 | 4 | 2048序列长度显存翻倍，需降低batch |
| `accumulation_steps` | 1 | 4 | 等效batch=16，保持训练稳定性 |
| `learning_rate` | 1e-5 | 5e-6 | 混合数据中领域数据少，用更低学习率防遗忘 |
| `epochs` | 2 | 3 | 数据量大（160万+），2轮足够，但领域数据少，多1轮强化 |

### 3.3 预训练权重下载

MiniMind SFT 需要基于预训练权重继续训练。下载方式：

```bash
# 从 ModelScope 下载预训练权重
# https://www.modelscope.cn/models/gongjy/MiniMind2
# 文件: pretrain_768.pth → 放入 model/ 目录
```

### 3.4 通用 SFT 数据下载

```bash
# 从 ModelScope 下载
# https://www.modelscope.cn/datasets/gongjy/minimind_dataset
# 文件: sft_t2t_mini.jsonl → 放入 dataset/ 目录
```

---

## 4. PAI-DSW 训练环境配置

### 4.1 实例选择

| 配置项 | 值 |
|--------|---|
| 实例类型 | GPU: T4 (16GB) 或 A10 (24GB) |
| 镜像 | PyTorch 2.0 + Python 3.10 |
| 存储 | 50GB ESSD |

### 4.2 环境搭建步骤

```bash
# 1. 克隆代码
cd /mnt/workspace
git clone https://gitee.com/glowfish/minimind.git
cd minimind

# 2. 安装依赖
pip install -r requirements.txt

# 3. 上传领域数据（从本地上传 sft_moyan_mfw.jsonl）
# 使用 PAI-DSW 的 Jupyter 文件上传功能

# 4. 下载预训练权重和通用数据
# 使用 modelscope 或 huggingface 下载

# 5. 运行桥接脚本
python scripts/bridge_data.py --source dataset/sft_moyan_mfw.jsonl \
                              --general_sft dataset/sft_t2t_mini.jsonl \
                              --max_seq_len 2048

# 6. 启动训练
bash scripts/train_moyan_sft.sh
```

### 4.3 训练时间与成本估算

| 模型 | 数据量 | GPU | 预估时间 | 计算时消耗 | 费用 |
|------|--------|-----|---------|-----------|------|
| minimind-3 (64M) | 160万+2千 | T4 | ~2-3小时 | ~10计算时 | 免费额度内 |
| minimind-3 (64M) | 160万+2千 | A10 | ~1-1.5小时 | ~6计算时 | 免费额度内 |

---

## 5. 模型评估

### 5.1 自动评估

```bash
# 使用 MiniMind 内置评估
python eval_llm.py --weight moyan_sft --max_seq_len 2048
```

### 5.2 领域专项评估

手动验证模型对以下问题的回答质量：
1. 权限系统：位运算权限值、装饰器用法
2. 后端模块：Controller/Service 开发规范
3. 前端组件：MfwPopup、MfwFormat 使用方式
4. 代码审查：红线规则、命名规范
5. 架构知识：项目结构、模块职责

### 5.3 通用能力评估

对比 SFT 前后模型在通用对话、常识问答上的表现，确认未发生严重遗忘。

---

## 6. 风险与应对

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| 2千条领域数据在160万通用数据中被淹没 | 高 | 领域知识注入不足 | 后续迭代可上采样领域数据或用两阶段训练 |
| max_seq_len=2048 导致 OOM | 中 | 训练中断 | 降低 batch_size 到 2，增加 accumulation_steps |
| 预训练权重下载失败 | 低 | 无法训练 | 备用源：HuggingFace / 本地传输 |
| PAI-DSW 免费额度不足 | 低 | 需付费 | 750计算时足够训练多次 |
| 模型效果不理想 | 中 | 需要迭代 | 增加领域数据量、调整混合比例、尝试 LoRA |

---

## 7. 后续迭代方向

1. **数据量提升** — 通过深度提取将领域数据从 2千 → 1万+，上采样到与通用数据 10:1
2. **两阶段训练** — 先用通用数据 SFT，再用领域数据二次 SFT（更可控）
3. **LoRA 微调** — 在已 SFT 的模型基础上用 LoRA 注入领域知识，减少遗忘
4. **持续学习** — 每周运行 `pnpm extract` + `bridge_data.py` + 增量训练
5. **模型升级** — 从 64M 升级到 MoE (198M)，提升模型容量
