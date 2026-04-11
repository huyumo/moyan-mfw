#!/usr/bin/env bash

# Harness 快速启动脚本
# 用途：在会话开始时一键运行所有检查

echo "======================================"
echo "  Harness 验证环境 - 会话开始检查"
echo "======================================"
echo ""

cd "$(dirname "$0")"

echo ">>> 运行 session-start 检查..."
npm run hook:session-start
RESULT1=$?

echo ""
echo ">>> 运行 teammates 检查..."
npm run hook:teammates
RESULT2=$?

echo ""
echo "======================================"
echo "  检查完成"
echo "======================================"

if [ $RESULT1 -eq 0 ] && [ $RESULT2 -eq 0 ]; then
    echo "✅ 所有检查通过，可以开始工作"
    exit 0
else
    echo "❌ 有检查未通过，请先修复问题"
    exit 1
fi
