# dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# build
FROM deps AS build
WORKDIR /app
COPY . .

ENV DATABASE_URL="postgresql://postgres:postgres@db:5432/mapen"

RUN npx prisma generate && npm run build

# run
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# node_modules
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/prisma ./src/prisma
COPY package.json ./

EXPOSE 3000

# migrations & starting server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]