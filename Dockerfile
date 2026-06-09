# SmartPay Gateway — frontend image.
# Builds the Vite SPA + the small Express host (server.ts) that serves it.
# Served on :3000 (CloudPanel fronts pay.lanari.rw).

# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app

# API base URL is baked into the bundle at build time.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# ---- production ----
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
