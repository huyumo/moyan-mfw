#!/usr/bin/env bash
# Hook 执行包装器 - 记录调用日志
# 用法：./run-hook-with-logging.sh <event> <hook-name> <command>

EVENT=$1
HOOK_NAME=$2
shift 2
COMMAND=$*

# 获取时间戳
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
LOG_FILE=".harness/output/logs/hook-calls.log"

# 确保日志目录存在
mkdir -p ".harness/output/logs"

# 记录开始
echo "[${TIMESTAMP}] [${EVENT}] [${HOOK_NAME}] [started    ]" >> "${LOG_FILE}"
echo "[${TIMESTAMP}] [${EVENT}] [${HOOK_NAME}] [started    ]" >&2

# 执行 hook
START_TIME=$(date +%s%3N)
eval ${COMMAND}
EXIT_CODE=$?
END_TIME=$(date +%s%3N)

# 计算执行时间
DURATION=$((END_TIME - START_TIME))
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")

# 记录结果
if [ ${EXIT_CODE} -eq 0 ]; then
    echo "[${TIMESTAMP}] [${EVENT}] [${HOOK_NAME}] [completed  ] ${DURATION}ms" >> "${LOG_FILE}"
    echo "[${TIMESTAMP}] [${EVENT}] [${HOOK_NAME}] [completed  ] ${DURATION}ms" >&2
else
    echo "[${TIMESTAMP}] [${EVENT}] [${HOOK_NAME}] [failed     ] ${DURATION}ms ERROR: exit code ${EXIT_CODE}" >> "${LOG_FILE}"
    echo "[${TIMESTAMP}] [${EVENT}] [${HOOK_NAME}] [failed     ] ${DURATION}ms ERROR: exit code ${EXIT_CODE}" >&2
fi

exit ${EXIT_CODE}
