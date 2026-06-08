# SmartPay Gateway — backend image.
#   development -> tsx watch (used by docker-compose.yml)
#   production  -> compiled JS (used by docker-compose.prod.yml)

# ---- deps (+ generated Prisma client) ----
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate

# ---- development ----
FROM node:20-alpine AS development
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN chmod +x docker-entrypoint.sh
EXPOSE 4000
ENTRYPOINT ["sh", "docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]

# ---- build (compile TS) ----
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- production ----
FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
EXPOSE 4000
ENTRYPOINT ["sh", "docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
