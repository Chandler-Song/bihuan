# ---------- Stage 1: build ----------
FROM node:20-alpine AS builder

# better-sqlite3 需要 C/C++ 工具链
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --include=dev

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# 仅安装生产依赖（重新构建 native 模块）
RUN rm -rf node_modules \
    && npm install --omit=dev \
    && npm cache clean --force

# ---------- Stage 2: runtime ----------
FROM node:20-alpine AS runtime

RUN apk add --no-cache tini

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3001

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src/db/migrations ./dist/db/migrations

RUN mkdir -p /app/data

EXPOSE 3001
VOLUME ["/app/data"]

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
