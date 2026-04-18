FROM node:25-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src src
RUN npm run build

FROM node:25-alpine
WORKDIR /app

ENV NODE_ENV=production
RUN addgroup -S verdenote && adduser -S verdenote -G verdenote

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist dist

USER verdenote
EXPOSE 4000

CMD ["node", "dist/server.js"]
