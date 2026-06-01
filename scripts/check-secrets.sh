#!/bin/bash
#
# Secret Scanner - 敏感信息检测脚本
# 作用：扫描 Git 变更内容，检测是否包含真实密钥/密码/Token
# 使用场景：
#   pre-commit: scripts/check-secrets.sh --staged
#   CI push:    scripts/check-secrets.sh --ci-push
#   CI pr:      scripts/check-secrets.sh --ci-pr
#

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ============================================
# 白名单
# ============================================
# 被这些模式匹配的行将被跳过（扩展正则）
ALLOWED_PATTERNS=(
  '<password>'
  '<secret>'
  '<token>'
  '<your-key>'
  'your-password'
  'your_password'
  'YOUR_PASSWORD'
  'your-jwt-secret'
  'YOUR_JWT_SECRET'
  'default-secret-change-in-production'
  'test_jwt_secret_key_for_integration_testing_only'
  'Admin@123'
  'Test@123'
  'test_password'
  'NewPass@123'
)

# ============================================
# 检测规则
# ============================================
# 格式: grep_extended_regex
# 规则按优先级排列，匹配即拦截
# 注意：不使用 PCRE (lookahead/bhead)，仅 ERE
RULES=(
  # --- P0: 云服务 AccessKey ---
  '(LTAI[0-9A-Za-z]{12,})'
  '(AKIA[0-9A-Z]{16})'
  'OSS_ACCESS_KEY_ID='
  'OSS_ACCESS_KEY_SECRET='
  'OSS_ROLE_ARN=acs:ram'

  # --- P0: 私钥内容 ---
  '-----BEGIN .*PRIVATE KEY-----'

  # --- P1: 密码硬编码（先粗筛 + 白名单过滤） ---
  'DB_PASSWORD=[A-Za-z0-9!@#$%^&*()+]{3,}'
  'REDIS_PASSWORD=[A-Za-z0-9!@#$%^&*()+]{3,}'
  'PASSWORD=[A-Za-z0-9!@#$%^&*()_+]{6,}'
  'PASSWD=[A-Za-z0-9!@#$%^&*()_+]{6,}'

  # --- P1: JWT 密钥 ---
  'JWT_SECRET=[A-Za-z0-9!@#$%^&*()_+]{8,}'

  # --- P1: Token/API Key ---
  '(API_KEY|API_SECRET|APP_SECRET)=[A-Za-z0-9_\-]{16,}'
  '(TOKEN|ACCESS_TOKEN|AUTH_TOKEN)=[A-Za-z0-9_\-.]{20,}'

  # --- P1: 连接字符串含密码 ---
  '(redis|rediss)://[^:]+:[^@]+@'
  '(jdbc:mysql|jdbc:postgresql|jdbc:oracle)://[^:]+:[^@]+@'
  'mongodb(\+srv)?://[^:]+:[^@]+@'

  # --- P1: Bearer Token 硬编码 ---
  'Authorization: Bearer [A-Za-z0-9_\-.]{20,}'
)

# ============================================
# 辅助函数
# ============================================

usage() {
  echo "Usage: $0 [--staged|--ci-push|--ci-pr|--help]"
  echo "  --staged     检查 git diff --cached（暂存区变更，用于 pre-commit）"
  echo "  --ci-push    检查 git diff HEAD~1..HEAD（最近一次推送，用于 branch pipeline）"
  echo "  --ci-pr      检查 git diff origin/main..HEAD（PR 变更，用于 PR pipeline）"
  echo "  --help       显示此帮助信息"
  exit 0
}

is_allowed() {
  local line="$1"
  for pat in "${ALLOWED_PATTERNS[@]}"; do
    if echo "$line" | grep -qE "$pat"; then
      return 0
    fi
  done
  return 1
}

# ============================================
# 主检测逻辑
# ============================================

run_scan() {
  local diff_content="$1"
  local scan_label="$2"

  if [ -z "$diff_content" ]; then
    echo "${GREEN}✓ 没有变更内容需要扫描${NC}"
    return 0
  fi

  local found=0

  for rule in "${RULES[@]}"; do
    # 提取 diff 中新增的行（+ 开头），匹配当前规则
    local matches
    matches=$(echo "$diff_content" | grep -E "^\+.*$rule" 2>/dev/null || true)

    if [ -z "$matches" ]; then
      continue
    fi

    # 逐行检查白名单
    while IFS= read -r line; do
      [ -z "$line" ] && continue

      if is_allowed "$line"; then
        continue
      fi

      # 缩小版本号不需要报警
      if echo "$line" | grep -qE '^\+.*version.*[0-9]+\.[0-9]+\.[0-9]+'; then
        continue
      fi

      echo "${RED}[SECRET]${NC} ${scan_label}: 检测到可能的敏感信息"
      echo "  ${YELLOW}内容${NC}: $line"
      echo "  ${YELLOW}规则${NC}: $rule"
      echo ""
      found=$((found + 1))

    done < <(echo "$matches")
  done

  if [ $found -gt 0 ]; then
    echo "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo "${RED}  检测到 ${found} 处可能的敏感信息泄露${NC}"
    echo "${RED}  请移除上述信息后再提交/推送${NC}"
    echo "${RED}  如需添加白名单，请编辑 scripts/check-secrets.sh${NC}"
    echo "${RED}  的 ALLOWED_PATTERNS 数组${NC}"
    echo "${RED}═══════════════════════════════════════════════════════════════${NC}"
    return 1
  fi

  echo "${GREEN}✓ 敏感信息检测通过${NC}"
  return 0
}

# ============================================
# 入口
# ============================================

[ $# -eq 0 ] && usage

case "$1" in
  --staged)
    echo "${CYAN}[check-secrets]${NC} 扫描暂存区变更..."
    DIFF=$(git diff --cached --diff-filter=ACM -- ':(exclude)*.md' ':(exclude)*.lock' ':(exclude)*.svg' ':(exclude)*.png' ':(exclude)*.jpg' ':(exclude)*.ico' ':(exclude)*.example' ':(exclude)scripts/check-secrets.sh' 2>/dev/null || true)
    run_scan "$DIFF" "pre-commit"
    ;;
  --ci-push)
    echo "${CYAN}[check-secrets]${NC} 扫描本次推送变更..."
    DIFF=$(git diff HEAD~1..HEAD --diff-filter=ACM -- ':(exclude)*.md' ':(exclude)*.lock' ':(exclude)*.svg' ':(exclude)*.png' ':(exclude)*.jpg' ':(exclude)*.ico' ':(exclude)*.example' ':(exclude)scripts/check-secrets.sh' 2>/dev/null || true)
    run_scan "$DIFF" "CI push"
    ;;
  --ci-pr)
    echo "${CYAN}[check-secrets]${NC} 扫描 PR 变更..."
    BASE="${2:-origin/main}"
    DIFF=$(git diff "$BASE"...HEAD --diff-filter=ACM -- ':(exclude)*.md' ':(exclude)*.lock' ':(exclude)*.svg' ':(exclude)*.png' ':(exclude)*.jpg' ':(exclude)*.ico' ':(exclude)*.example' ':(exclude)scripts/check-secrets.sh' 2>/dev/null || true)
    run_scan "$DIFF" "CI pr ($BASE...HEAD)"
    ;;
  --help)
    usage
    ;;
  *)
    echo "${RED}未知参数: $1${NC}"
    usage
    ;;
esac