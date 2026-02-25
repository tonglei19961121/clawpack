# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./
RUN npm ci

# 复制源码并构建
COPY . .
RUN npm run build

# 运行阶段
FROM node:20-alpine

WORKDIR /app

# 安装 openclaw（用于测试）
RUN npm install -g openclaw

# 从构建阶段复制产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# 安装生产依赖
RUN npm ci --production

# 创建配置目录
RUN mkdir -p /root/.config/clawpack /root/.openclaw

# 设置入口
ENTRYPOINT ["node", "./dist/index.js"]
CMD ["--help"]
