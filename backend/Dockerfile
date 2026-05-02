# Base environment
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies and build Prisma
FROM base AS builder
COPY package.json package-lock.json ./
# If package-lock.json isn't present in this local prototype, fall back to npm install
RUN npm ci || npm install
COPY . .
RUN npx prisma generate

# Production image
FROM base AS runner
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY --from=builder /app/prisma ./prisma
# Prisma client is stored in node_modules/.prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY . .

# Server binds to 3000
EXPOSE 3000
CMD ["node", "server.js"]
