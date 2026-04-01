# 多阶段构建 Dockerfile
# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm add -g pnpm@10

# 复制 package.json
COPY package.json ./

# 安装依赖
RUN pnpm install --frozen-lockfile --prefer-offline

# 复制源代码
COPY . .

# 构建项目
RUN pnpm run build

# 生产阶段
FROM node:20-alpine AS production

WORKDIR /app

# 安装 pnpm
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm add -g pnpm@10

# 复制 package.json
COPY package.json ./

# 只安装生产依赖
RUN pnpm install --prod --frozen-lockfile --prefer-offline

# 从构建阶段复制构建产物
COPY --from=builder /app/dist ./dist

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# 切换用户
USER nestjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 启动应用
CMD ["node", "dist/main.js"]

# ==================== 开发阶段 ====================
FROM node:20-alpine AS development

WORKDIR /app

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm add -g pnpm@10

COPY package.json ./

RUN pnpm install --frozen-lockfile --prefer-offline

COPY . .

# 开发模式启动
CMD ["pnpm", "run", "start:dev"]
