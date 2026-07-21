# === Build stage ===
FROM node:20-alpine AS builder
WORKDIR /app

ARG API_URL
ENV API_URL=$API_URL

# 設定 build-time ARG
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=true

COPY . .

# 加入 DEBUG: 打印 API_URL
RUN echo "[DEBUG ARG] API_URL=$API_URL"
RUN node -e "require('fs').writeFileSync('public/runtime-config.json', JSON.stringify({ API_URL: process.env.API_URL }, null, 2))"

# 建立 production build
RUN NODE_ENV=production yarn build

# === Run stage ===
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production


COPY --from=builder /app/node_modules ./node_modules
COPY package.json yarn.lock ./
COPY --from=builder /app/.next .next
COPY --from=builder /app/public ./public
COPY --from=builder /app/runtime.config.js ./runtime.config.js

EXPOSE 3000

# 先執行 runtime.config 產出 JSON，再啟動 Next.js
CMD ["yarn", "start"]