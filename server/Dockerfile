# dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# -builder
FROM deps AS build
WORKDIR /app
COPY . .

ENV DATABASE_URL="postgresql://postgres:postgres@db:5432/mapen"

RUN npx prisma generate --schema=./src/prisma/schema.prisma && npm run build

# runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# node_modules
COPY --from=build /app/node_modules ./node_modules

COPY --from=build /app/src ./src

COPY --from=build /app/src/prisma ./src/prisma

COPY --from=build /app/prisma7.config.ts ./prisma7.config.ts

COPY --from=build /app/package.json ./

EXPOSE ${PORT}

CMD ["sh", "-c", "npx prisma migrate deploy --schema=./src/prisma/schema.prisma && npx tsx src/server.ts"]