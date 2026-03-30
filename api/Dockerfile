FROM node:20-alpine AS  builder
WORKDIR /app
COPY package*.json ./
RUN corepack enable pnpm
RUN pnpm install
#--frozen-lockfile
COPY . .
RUN pnpm prisma generate
RUN pnpm build



EXPOSE 3001
CMD ["pnpm", "start"]