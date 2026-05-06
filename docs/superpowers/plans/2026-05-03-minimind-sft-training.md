# MiniMind SFT 训练实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在阿里云 PAI-DSW 上用 MiniMind-3 (64M) 对 moyan-mfw 领域数据进行 SFT 混合训练

**Architecture:** 训练数据提取脚本保留在 moyan-mfw 中（依赖源码），通过桥接脚本将数据适配到 MiniMind 训练环境。MiniMind 仓库已克隆在 `E:\Moyan\moyan\minimind\test`，领域数据从 `all-train.jsonl` 复制到 `dataset/` 目录并与通用 SFT 数据自然混合后训练。

**Tech Stack:** MiniMind (PyTorch + transformers)、阿里云 PAI-DSW (T4/A10 GPU)、modelscope (数据/权重下载)

---

## 文件结构

| 操作 | 文件路径 | 职责 |
|------|---------|------|
| 新建 | `E:\Moyan\moyan\minimind\test\scripts\bridge_data.py` | 数据桥接：复制+token过滤+混合+统计 |
| 新建 | `E:\Moyan\moyan\minimind\test\scripts\train_moyan_sft.sh` | 训练启动脚本（封装训练参数） |
| 新建 | `E:\Moyan\moyan\minimind\test\scripts\pAI_dsw_setup.sh` | PAI-DSW 环境搭建脚本 |
| 新建 | `E:\Moyan\moyan\minimind\test\scripts\eval_moyan.py` | 领域专项评估脚本 |
| 已有 | `E:\Moyan\moyan\minimind\test\dataset\lm_dataset.py` | SFTDataset（不修改，直接使用） |
| 已有 | `E:\Moyan\moyan\minimind\test\trainer\train_full_sft.py` | SFT 训练入口（不修改，通过参数配置） |
| 已有 | `E:\Moyan\moyan\moyan-mfw-workspace\workspace04\moyan-mfw\scripts\training-data\output\all-train.jsonl` | 领域训练数据源（只读） |
| 已有 | `E:\Moyan\moyan\minimind\test\scripts\prepare_sft_data.py` | 旧的简单数据准备脚本（保留但不使用） |

---

### Task 1: 创建数据桥接脚本 `bridge_data.py`

**Files:**
- Create: `E:\Moyan\moyan\minimind\test\scripts\bridge_data.py`

- [ ] **Step 1: 创建 bridge_data.py**

```python
import os
import sys
import json
import argparse
import random

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from transformers import AutoTokenizer

DEFAULT_MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'model')


def count_tokens(conversations, tokenizer):
    total = 0
    for msg in conversations:
        total += len(tokenizer.encode(msg.get("content", "")))
    total += len(conversations) * 5
    return total


def filter_by_token_length(data, tokenizer, max_len):
    filtered = []
    over_length = 0
    for item in data:
        if count_tokens(item["conversations"], tokenizer) <= max_len:
            filtered.append(item)
        else:
            over_length += 1
    return filtered, over_length


def validate_format(item):
    if "conversations" not in item:
        return False
    convs = item["conversations"]
    if not isinstance(convs, list) or len(convs) < 2:
        return False
    for msg in convs:
        if "role" not in msg or "content" not in msg:
            return False
        if msg["role"] not in ("system", "user", "assistant", "tool"):
            return False
    if convs[0]["role"] not in ("system", "user"):
        return False
    return True


def load_jsonl(path):
    data = []
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            item = json.loads(line)
            if validate_format(item):
                data.append(item)
    return data


def count_jsonl_lines(path):
    count = 0
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                count += 1
    return count


def write_jsonl(data, path):
    with open(path, 'w', encoding='utf-8') as f:
        for item in data:
            f.write(json.dumps(item, ensure_ascii=False) + '\n')


def mix_datasets_streaming(domain_data, general_sft_path, output_path, seed=42):
    random.seed(seed)
    general_count = count_jsonl_lines(general_sft_path)
    total = len(domain_data) + general_count
    positions = list(range(total))
    random.shuffle(positions)
    domain_positions = set(i for i, p in enumerate(positions) if p < len(domain_data))

    domain_idx = 0
    with open(output_path, 'w', encoding='utf-8') as out_f:
        with open(general_sft_path, 'r', encoding='utf-8') as gen_f:
            for out_idx in range(total):
                if out_idx in domain_positions:
                    out_f.write(json.dumps(domain_data[domain_idx], ensure_ascii=False) + '\n')
                    domain_idx += 1
                else:
                    line = gen_f.readline()
                    if line.strip():
                        out_f.write(line)
    return general_count


def print_stats(domain_count, general_count, filtered_count, over_length, max_len, mixed_count, output_dir):
    print("=" * 60)
    print("  moyan-mfw SFT 数据桥接报告")
    print("=" * 60)
    print(f"  领域数据输入:       {domain_count} 条")
    print(f"  领域数据过滤(>{max_len} tokens): {over_length} 条")
    print(f"  领域数据保留:       {filtered_count} 条")
    if general_count > 0:
        print(f"  通用SFT数据:        {general_count} 条")
        ratio = general_count / max(filtered_count, 1)
        print(f"  混合比例(通用:领域): {ratio:.1f}:1")
    print(f"  混合数据总量:       {mixed_count} 条")
    print(f"  输出目录:           {output_dir}")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(description="moyan-mfw SFT 数据桥接脚本")
    parser.add_argument("--source", type=str, required=True, help="领域数据JSONL路径")
    parser.add_argument("--general_sft", type=str, default="", help="通用SFT数据JSONL路径(留空则仅过滤)")
    parser.add_argument("--max_seq_len", type=int, default=2048, help="最大token长度")
    parser.add_argument("--output_dir", type=str, default="", help="输出目录(默认dataset/)")
    parser.add_argument("--model_dir", type=str, default=DEFAULT_MODEL_DIR, help="tokenizer目录")
    parser.add_argument("--seed", type=int, default=42, help="随机种子")
    parser.add_argument("--filter_only", action="store_true", help="仅过滤+统计，不混合")
    args = parser.parse_args()

    if not args.output_dir:
        args.output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dataset'))
    os.makedirs(args.output_dir, exist_ok=True)

    print(f"加载 tokenizer: {args.model_dir}")
    try:
        tokenizer = AutoTokenizer.from_pretrained(args.model_dir)
    except Exception as e:
        print(f"ERROR: 无法加载tokenizer: {e}")
        print(f"  请确保 {args.model_dir}/tokenizer.json 存在")
        sys.exit(1)

    print(f"加载领域数据: {args.source}")
    if not os.path.exists(args.source):
        print(f"ERROR: 文件不存在: {args.source}")
        sys.exit(1)
    domain_data = load_jsonl(args.source)
    print(f"  领域数据: {len(domain_data)} 条")

    print(f"过滤超过 {args.max_seq_len} tokens 的条目...")
    filtered_data, over_length = filter_by_token_length(domain_data, tokenizer, args.max_seq_len)
    print(f"  保留: {len(filtered_data)} 条, 过滤: {over_length} 条")

    domain_output = os.path.join(args.output_dir, "sft_moyan_mfw.jsonl")
    write_jsonl(filtered_data, domain_output)
    print(f"领域数据已保存: {domain_output}")

    general_count = 0
    mixed_count = len(filtered_data)

    if args.general_sft and not args.filter_only:
        print(f"混合通用SFT数据: {args.general_sft} (流式处理，避免OOM)")
        mixed_output = os.path.join(args.output_dir, "sft_mixed.jsonl")
        general_count = mix_datasets_streaming(filtered_data, args.general_sft, mixed_output, seed=args.seed)
        mixed_count = len(filtered_data) + general_count
        print(f"混合数据已保存: {mixed_output}")

    print_stats(len(domain_data), general_count, len(filtered_data), over_length, args.max_seq_len, mixed_count, args.output_dir)

    token_lengths = [count_tokens(item["conversations"], tokenizer) for item in filtered_data[:200]]
    if token_lengths:
        avg_tokens = sum(token_lengths) / len(token_lengths)
        max_tokens = max(token_lengths)
        print(f"\n  前200条领域数据 token 统计:")
        print(f"  平均: {avg_tokens:.0f} tokens, 最大: {max_tokens} tokens")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: 本地测试 bridge_data.py（仅过滤+统计模式）**

```bash
cd E:\Moyan\moyan\minimind\test
python scripts/bridge_data.py --source "E:\Moyan\moyan\moyan-mfw-workspace\workspace04\moyan-mfw\scripts\training-data\output\all-train.jsonl" --filter_only --max_seq_len 2048
```

预期：输出领域数据统计报告，生成 `dataset/sft_moyan_mfw.jsonl`

---

### Task 2: 创建训练启动脚本 `train_moyan_sft.sh`

**Files:**
- Create: `E:\Moyan\moyan\minimind\test\scripts\train_moyan_sft.sh`

- [ ] **Step 1: 创建训练启动脚本**

```bash
#!/bin/bash
# moyan-mfw SFT 训练启动脚本
# 使用方法: bash scripts/train_moyan_sft.sh [mixed|moyan_only]

MODE=${1:-mixed}

cd "$(dirname "$0")/../trainer"

if [ "$MODE" = "mixed" ]; then
    DATA_PATH="../dataset/sft_mixed.jsonl"
    EPOCHS=2
    LR=1e-5
    echo "训练模式: 混合训练 (通用+领域)"
elif [ "$MODE" = "moyan_only" ]; then
    DATA_PATH="../dataset/sft_moyan_mfw.jsonl"
    EPOCHS=5
    LR=5e-6
    echo "训练模式: 纯领域数据"
else
    echo "用法: bash scripts/train_moyan_sft.sh [mixed|moyan_only]"
    exit 1
fi

echo "数据路径: $DATA_PATH"
echo "训练开始..."

python train_full_sft.py \
    --data_path "$DATA_PATH" \
    --max_seq_len 2048 \
    --batch_size 4 \
    --accumulation_steps 4 \
    --learning_rate $LR \
    --epochs $EPOCHS \
    --hidden_size 768 \
    --num_hidden_layers 8 \
    --from_weight pretrain \
    --save_dir ../out \
    --save_weight moyan_sft \
    --grad_clip 1.0 \
    --log_interval 50 \
    --save_interval 500 \
    --num_workers 4

echo "训练完成！"
echo "模型权重: ../out/moyan_sft_768.pth"
echo ""
echo "评估模型:"
echo "  cd .. && python eval_llm.py --weight moyan_sft --max_seq_len 2048"
```

- [ ] **Step 2: 验证脚本语法**

```bash
bash -n E:\Moyan\moyan\minimind\test\scripts\train_moyan_sft.sh
```

预期：无输出（语法正确）

---

### Task 3: 创建 PAI-DSW 环境搭建脚本 `pAI_dsw_setup.sh`

**Files:**
- Create: `E:\Moyan\moyan\minimind\test\scripts\pAI_dsw_setup.sh`

- [ ] **Step 1: 创建 PAI-DSW 搭建脚本**

```bash
#!/bin/bash
# PAI-DSW 环境搭建脚本
# 在 PAI-DSW Terminal 中运行此脚本

set -e

echo "========================================="
echo "  moyan-mfw MiniMind SFT 训练环境搭建"
echo "========================================="

WORKSPACE=/mnt/workspace
MINIMIND_DIR=$WORKSPACE/minimind

# 1. 克隆 MiniMind
if [ ! -d "$MINIMIND_DIR" ]; then
    echo "[1/6] 克隆 MiniMind..."
    cd $WORKSPACE
    git clone https://gitee.com/glowfish/minimind.git
    cd minimind
else
    echo "[1/6] MiniMind 已存在，跳过克隆"
    cd $MINIMIND_DIR
fi

# 2. 安装 PyTorch + CUDA
echo "[2/6] 安装 PyTorch..."
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121 2>/dev/null || \
pip install torch torchvision

# 3. 安装 MiniMind 依赖
echo "[3/6] 安装 MiniMind 依赖..."
pip install -r requirements.txt

# 4. 下载预训练权重
echo "[4/6] 下载预训练权重..."
python -c "
from modelscope import snapshot_download
snapshot_download('gongjy/MiniMind2', local_dir='model', ignore_patterns=['*.md'])
" 2>/dev/null || echo "  请手动下载预训练权重: https://www.modelscope.cn/models/gongjy/MiniMind2"

# 5. 下载通用 SFT 数据
echo "[5/6] 下载通用 SFT 数据..."
python -c "
from modelscope.msdatasets import MsDataset
ds = MsDataset.load('gongjy/minimind_dataset', subset_name='sft_t2t_mini', split='train')
ds.to_json('dataset/sft_t2t_mini.jsonl')
" 2>/dev/null || echo "  请手动下载数据: https://www.modelscope.cn/datasets/gongjy/minimind_dataset"

# 6. 提示上传领域数据
echo "[6/6] 请上传领域数据到 dataset/ 目录:"
echo "  - 从本地上传 sft_moyan_mfw.jsonl (或通过 bridge_data.py 生成)"
echo "  - 或直接上传 all-train.jsonl 并运行 bridge_data.py"
echo ""
echo "环境搭建完成！"
echo ""
echo "下一步操作:"
echo "  1. 上传领域数据到 dataset/ 目录"
echo "  2. 运行桥接脚本:  python scripts/bridge_data.py --source dataset/sft_moyan_mfw.jsonl --general_sft dataset/sft_t2t_mini.jsonl --max_seq_len 2048"
echo "  3. 启动训练:      bash scripts/train_moyan_sft.sh mixed"
echo "  4. 评估模型:      python eval_llm.py --weight moyan_sft --max_seq_len 2048"
```

- [ ] **Step 2: 验证脚本语法**

```bash
bash -n E:\Moyan\moyan\minimind\test\scripts\pAI_dsw_setup.sh
```

---

### Task 4: 创建领域专项评估脚本 `eval_moyan.py`

**Files:**
- Create: `E:\Moyan\moyan\minimind\test\scripts\eval_moyan.py`

- [ ] **Step 1: 创建评估脚本**

```python
import os
import sys
import torch

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

MOYAN_QUESTIONS = [
    {
        "category": "权限系统",
        "question": "moyan-mfw 的权限值有哪些？分别代表什么操作？",
        "keywords": ["添加", "编辑", "删除", "导出", "导入", "审批", "拒绝", "发布", "归档", "1", "2", "4", "8", "16", "32", "64", "128", "256"]
    },
    {
        "category": "权限系统",
        "question": "如何在 NestJS Controller 中使用权限装饰器？",
        "keywords": ["RequirePermission", "装饰器", "权限", "controller"]
    },
    {
        "category": "架构知识",
        "question": "moyan-mfw 的项目结构是怎样的？",
        "keywords": ["base-backend", "base-frontend", "backend", "frontend", "packages"]
    },
    {
        "category": "后端模块",
        "question": "moyan-mfw 的分页查询规范是什么？",
        "keywords": ["PaginationX", "分页", "page", "pageSize"]
    },
    {
        "category": "前端组件",
        "question": "MfwPopup 组件怎么使用？",
        "keywords": ["Popup", "弹窗", "confirm", "alert"]
    },
    {
        "category": "代码审查",
        "question": "moyan-mfw 的代码审查红线规则有哪些？",
        "keywords": ["红线", "禁止", "apis", "any", "console"]
    },
    {
        "category": "部署运维",
        "question": "moyan-mfw 如何部署？",
        "keywords": ["Docker", "docker-compose", "部署"]
    },
    {
        "category": "通用能力",
        "question": "你好，请介绍一下你自己",
        "keywords": []
    },
    {
        "category": "通用能力",
        "question": "1+1等于几？",
        "keywords": ["2"]
    },
    {
        "category": "通用能力",
        "question": "中国的首都是哪里？",
        "keywords": ["北京"]
    }
]


def eval_moyan(model, tokenizer, device, max_seq_len=2048):
    print("=" * 60)
    print("  moyan-mfw 领域专项评估")
    print("=" * 60)

    results = []
    for item in MOYAN_QUESTIONS:
        messages = [{"role": "user", "content": item["question"]}]
        prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        input_ids = tokenizer(prompt).input_ids[:max_seq_len]
        input_ids = torch.tensor([input_ids], dtype=torch.long).to(device)

        with torch.no_grad():
            output_ids = model.generate(input_ids, max_new_tokens=256, temperature=0.7, top_p=0.9, do_sample=True)

        response = tokenizer.decode(output_ids[0][len(input_ids[0]):], skip_special_tokens=True)

        hit = False
        if item["keywords"]:
            hit = any(kw in response for kw in item["keywords"])

        results.append({
            "category": item["category"],
            "question": item["question"],
            "response": response[:200],
            "keyword_hit": hit
        })

        status = "PASS" if hit else "SKIP"
        print(f"\n[{item['category']}] {status} Q: {item['question']}")
        print(f"  A: {response[:200]}")

    domain_results = [r for r in results if r["category"] != "通用能力"]
    domain_hits = sum(1 for r in domain_results if r["keyword_hit"])
    general_results = [r for r in results if r["category"] == "通用能力"]

    print("\n" + "=" * 60)
    print(f"  领域问题: {domain_hits}/{len(domain_results)} 命中关键词")
    print(f"  通用问题: {len(general_results)} 条 (需人工评估)")
    print("=" * 60)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--weight", type=str, default="moyan_sft")
    parser.add_argument("--max_seq_len", type=int, default=2048)
    parser.add_argument("--device", type=str, default="cuda:0")
    args = parser.parse_args()

    from model.model_minimind import MiniMindConfig, MiniMindForCausalLM
    from transformers import AutoTokenizer

    lm_config = MiniMindConfig(hidden_size=768, num_hidden_layers=8)
    model_dir = os.path.join(os.path.dirname(__file__), '..', 'model')
    tokenizer = AutoTokenizer.from_pretrained(model_dir)

    weight_path = os.path.join(os.path.dirname(__file__), '..', 'out', f'{args.weight}_768.pth')
    if not os.path.exists(weight_path):
        print(f"权重文件不存在: {weight_path}")
        sys.exit(1)

    model = MiniMindForCausalLM(lm_config).to(args.device)
    state_dict = torch.load(weight_path, map_location=args.device, weights_only=True)
    model.load_state_dict(state_dict)
    model.eval()

    eval_moyan(model, tokenizer, args.device, args.max_seq_len)
```

---

### Task 5: 本地运行 bridge_data.py 验证数据适配

**Files:**
- Modify: 无（只运行验证）

- [ ] **Step 1: 安装 Python 依赖（如需要）**

检查本地是否已有 transformers 和 torch：

```bash
python -c "import transformers; print(transformers.__version__)" 2>$null; python -c "import torch; print(torch.__version__)" 2>$null
```

如果缺少依赖：

```bash
pip install transformers torch
```

- [ ] **Step 2: 运行 bridge_data.py 过滤+统计模式**

```bash
cd E:\Moyan\moyan\minimind\test
python scripts/bridge_data.py --source "E:\Moyan\moyan\moyan-mfw-workspace\workspace04\moyan-mfw\scripts\training-data\output\all-train.jsonl" --filter_only --max_seq_len 2048
```

预期输出：
- 领域数据输入: 2383 条
- 过滤掉的超长条目数量
- 保留的条目数量
- 保存到 `dataset/sft_moyan_mfw.jsonl`

- [ ] **Step 3: 验证输出文件**

```bash
python -c "import json; lines=open('E:/Moyan/moyan/minimind/test/dataset/sft_moyan_mfw.jsonl','r',encoding='utf-8').readlines(); print(f'Lines: {len(lines)}'); print(f'First: {lines[0][:200]}')"
```

预期：与过滤后保留数量一致，格式为标准 JSONL

---

### Task 6: 创建本地一键训练脚本（CPU 验证模式）

**Files:**
- Create: `E:\Moyan\moyan\minimind\test\scripts\local_verify.bat`

- [ ] **Step 1: 创建 Windows 本地验证脚本**

```bat
@echo off
echo ========================================
echo   moyan-mfw SFT 本地验证 (CPU模式)
echo   仅用于验证数据和环境，不用于实际训练
echo ========================================

cd /d E:\Moyan\moyan\minimind\test

echo [1/2] 运行数据桥接...
python scripts/bridge_data.py --source "E:\Moyan\moyan\moyan-mfw-workspace\workspace04\moyan-mfw\scripts\training-data\output\all-train.jsonl" --filter_only --max_seq_len 2048

echo.
echo [2/2] 验证 SFTDataset 可加载数据...
python -c "import sys; sys.path.insert(0,'.'); from dataset.lm_dataset import SFTDataset; from transformers import AutoTokenizer; t=AutoTokenizer.from_pretrained('./model'); ds=SFTDataset('./dataset/sft_moyan_mfw.jsonl',t,max_length=2048); print(f'SFTDataset loaded: {len(ds)} samples'); s=ds[0]; print(f'Sample shape: input_ids={s[0].shape}, labels={s[1].shape}')"

echo.
echo 本地验证完成！实际训练请在 PAI-DSW 上执行。
pause
```

- [ ] **Step 2: 运行本地验证**

```bash
E:\Moyan\moyan\minimind\test\scripts\local_verify.bat
```

预期：SFTDataset 成功加载数据，输出 sample shape

---

### Task 7: 编写 PAI-DSW 训练操作文档

**Files:**
- Create: `E:\Moyan\moyan\minimind\test\scripts\PAI_DSW_GUIDE.md`

- [ ] **Step 1: 创建操作文档**

内容涵盖：
1. PAI-DSW 实例创建步骤（选 GPU 实例，T4 或 A10）
2. 环境搭建（运行 `pAI_dsw_setup.sh`）
3. 数据准备（上传 + bridge_data.py 混合）
4. 训练启动（`train_moyan_sft.sh`）
5. 模型评估（`eval_moyan.py`）
6. 模型下载（训练完成后下载 `.pth` 文件）
7. 常见问题排查

- [ ] **Step 2: 验证文档可读性**

通读文档，确保步骤清晰、命令可复制执行。

---

### Task 8: 端到端验证 — 模拟训练流程

**Files:**
- 无新文件（运行已有脚本验证）

- [ ] **Step 1: 本地 CPU 微型训练验证（1 step）**

在本地 CPU 上用 10 条数据运行 1 step，验证训练流程可走通：

```bash
cd E:\Moyan\moyan\minimind\test
python -c "
import sys; sys.path.insert(0,'.')
from trainer.train_full_sft import *
from model.model_minimind import MiniMindConfig, MiniMindForCausalLM
from transformers import AutoTokenizer
import torch

# 创建微型数据集
import json
data = []
with open('dataset/sft_moyan_mfw.jsonl','r',encoding='utf-8') as f:
    for i,line in enumerate(f):
        if i >= 10: break
        data.append(json.loads(line))
with open('dataset/sft_tiny_test.jsonl','w',encoding='utf-8') as f:
    for item in data:
        f.write(json.dumps(item,ensure_ascii=False)+'\n')

print('微型数据集创建完成: 10 条')
print('准备运行 1 step 训练验证...')

# 模拟训练 1 step
class Args:
    save_dir='../out'; save_weight='test'; epochs=1; batch_size=1
    learning_rate=1e-5; device='cpu'; dtype='float16'; num_workers=0
    accumulation_steps=1; grad_clip=1.0; log_interval=1; save_interval=999
    hidden_size=512; num_hidden_layers=2; max_seq_len=512; use_moe=0
    data_path='dataset/sft_tiny_test.jsonl'; from_weight='none'
    from_resume=0; use_wandb=False; wandb_project='test'; use_compile=0

args = Args()
lm_config = MiniMindConfig(hidden_size=512, num_hidden_layers=2)
model, tokenizer = init_model(lm_config, 'none', device='cpu')
train_ds = SFTDataset(args.data_path, tokenizer, max_length=args.max_seq_len)
loader = DataLoader(train_ds, batch_size=1, num_workers=0)
optimizer = optim.AdamW(model.parameters(), lr=args.learning_rate)

input_ids, labels = next(iter(loader))
input_ids = input_ids.to('cpu')
labels = labels.to('cpu')

res = model(input_ids, labels=labels)
loss = res.loss
loss.backward()
optimizer.step()
optimizer.zero_grad()

print(f'训练 1 step 验证成功! loss={loss.item():.4f}')
"
```

预期：输出 `训练 1 step 验证成功! loss=...`

- [ ] **Step 2: 清理测试文件**

```bash
del E:\Moyan\moyan\minimind\test\dataset\sft_tiny_test.jsonl
```

---

## 总结

| Task | 描述 | 预计时间 |
|------|------|---------|
| 1 | 创建 bridge_data.py | 5 min |
| 2 | 创建 train_moyan_sft.sh | 3 min |
| 3 | 创建 pAI_dsw_setup.sh | 3 min |
| 4 | 创建 eval_moyan.py | 5 min |
| 5 | 本地验证数据适配 | 5 min |
| 6 | 创建本地验证脚本 | 3 min |
| 7 | PAI-DSW 操作文档 | 5 min |
| 8 | 端到端训练流程验证 | 10 min |

完成后的交付物：
1. `scripts/bridge_data.py` — 数据适配工具
2. `scripts/train_moyan_sft.sh` — 训练启动脚本
3. `scripts/pAI_dsw_setup.sh` — PAI-DSW 环境搭建
4. `scripts/eval_moyan.py` — 领域评估脚本
5. `scripts/local_verify.bat` — 本地验证脚本
6. `scripts/PAI_DSW_GUIDE.md` — 操作文档
7. `dataset/sft_moyan_mfw.jsonl` — 过滤后的领域数据
