#!/bin/bash
# =============================================================================
# Harness 项目初始化脚本
# =============================================================================
# 用途：将复制的 .claude 目录初始化为干净的项目环境
# 场景：手动 cp .claude 到新项目后运行此脚本
# =============================================================================

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_DIR="$(dirname "$SCRIPT_DIR")"
CLAUDE_DIR="$(dirname "$HARNESS_DIR")"
PROJECT_ROOT="$(dirname "$CLAUDE_DIR")"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Harness 项目初始化${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${YELLOW}目标项目：${PROJECT_ROOT}${NC}"
echo ""

# 确认执行
echo -e "${YELLOW}⚠️  此操作将清理当前项目的 agent-memory 和输出文件${NC}"
echo -n "是否继续？(y/N): "
read -r confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo -e "${RED}已取消${NC}"
    exit 0
fi

echo ""

# =============================================================================
# 步骤 1: 清理项目特定记忆
# =============================================================================
echo -e "${BLUE}[1/5] 清理项目特定记忆...${NC}"

AGENT_MEMORY_DIR="$CLAUDE_DIR/agent-memory"

if [ -d "$AGENT_MEMORY_DIR" ]; then
    # 保留目录结构，清空内容
    for agent_dir in "$AGENT_MEMORY_DIR"/*/; do
        if [ -d "$agent_dir" ]; then
            agent_name=$(basename "$agent_dir")
            # 跳过 MEMORY.md 模板
            if [ "$agent_name" != "." ]; then
                rm -rf "$agent_dir"*
                echo "  - 清理：agent-memory/$agent_name/"
            fi
        fi
    done

    # 创建空的 MEMORY.md
    cat > "$AGENT_MEMORY_DIR/MEMORY.md" << 'EOF'
# Agent Memory Index

本项目记忆由跨会话协作时自动创建和管理。

## 记忆文件

记忆文件将按 subagent 分类存储在对应目录中。
EOF

    echo -e "  ${GREEN}✓ 记忆已清理${NC}"
else
    echo -e "  ${YELLOW}⚠ agent-memory 目录不存在，跳过${NC}"
fi

echo ""

# =============================================================================
# 步骤 2: 清理 Harness 输出
# =============================================================================
echo -e "${BLUE}[2/5] 清理 Harness 输出...${NC}"

OUTPUT_DIR="$HARNESS_DIR/output"

if [ -d "$OUTPUT_DIR" ]; then
    rm -rf "$OUTPUT_DIR"/*
    echo -e "  ${GREEN}✓ output 目录已清理${NC}"
else
    mkdir -p "$OUTPUT_DIR"
    echo -e "  ${GREEN}✓ output 目录已创建${NC}"
fi

echo ""

# =============================================================================
# 步骤 3: 清理任务分析文档
# =============================================================================
echo -e "${BLUE}[3/5] 清理任务分析文档...${NC}"

ANALYSIS_DIR="$HARNESS_DIR/analysis"

if [ -d "$ANALYSIS_DIR" ]; then
    rm -rf "$ANALYSIS_DIR"/*
    echo -e "  ${GREEN}✓ analysis 目录已清理${NC}"
fi

echo ""

# =============================================================================
# 步骤 4: 重置 team.json（可选）
# =============================================================================
echo -e "${BLUE}[4/5] 检查团队配置...${NC}"

TEAM_JSON="$HARNESS_DIR/team.json"

if [ -f "$TEAM_JSON" ]; then
    echo -e "  ${YELLOW}⚠ team.json 已存在，请手动编辑以下内容:${NC}"
    echo "     - members: 团队成员列表"
    echo "     - roles: 角色权限配置"
    echo ""
    echo "     命令：code $TEAM_JSON"
else
    # 创建默认 team.json
    cat > "$TEAM_JSON" << 'EOF'
{
  "version": "1.0.0",
  "members": [
    {
      "name": "PM-Agent",
      "role": "pm",
      "type": "agent"
    },
    {
      "name": "Tech-Architect",
      "role": "lead",
      "type": "agent"
    },
    {
      "name": "Backend-Dev",
      "role": "developer",
      "type": "agent"
    },
    {
      "name": "Frontend-Dev",
      "role": "developer",
      "type": "agent"
    },
    {
      "name": "Code-Reviewer",
      "role": "reviewer",
      "type": "agent"
    }
  ],
  "collaboration": {
    "requireMultiAgentMeeting": true,
    "requireTaskAssignment": true,
    "requireCodeReview": true
  }
}
EOF
    echo -e "  ${GREEN}✓ team.json 已创建（请编辑配置）${NC}"
fi

echo ""

# =============================================================================
# 步骤 5: 安装依赖
# =============================================================================
echo -e "${BLUE}[5/5] 安装 Harness 依赖...${NC}"

cd "$HARNESS_DIR"

if command -v pnpm &> /dev/null; then
    pnpm install
    echo -e "  ${GREEN}✓ 依赖已安装 (pnpm)${NC}"
elif command -v npm &> /dev/null; then
    npm install
    echo -e "  ${GREEN}✓ 依赖已安装 (npm)${NC}"
else
    echo -e "  ${RED}✘ 未找到 pnpm 或 npm，请手动安装依赖${NC}"
    echo "     命令：cd $HARNESS_DIR && pnpm install"
fi

echo ""

# =============================================================================
# 完成
# =============================================================================
echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}✓ 初始化完成！${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${YELLOW}后续步骤:${NC}"
echo ""
echo "1. 编辑团队配置"
echo "   ${BLUE}code $TEAM_JSON${NC}"
echo ""
echo "2. 编辑项目任务"
echo "   ${BLUE}code $PROJECT_ROOT/TASK.md${NC}"
echo ""
echo "3. 编辑项目指令"
echo "   ${BLUE}code $PROJECT_ROOT/CLAUDE.md${NC}"
echo ""
echo "4. 运行 Hook 测试"
echo "   ${BLUE}cd $HARNESS_DIR && pnpm start${NC}"
echo ""
echo -e "${YELLOW}提示：${NC}"
echo "  - agent-memory 已清空，新会话中将自动创建项目记忆"
echo "  - 每个项目的记忆相互隔离，不会污染"
echo ""
