# Build stage
FROM node:lts-alpine AS builder

WORKDIR /usr/src/app

ARG PUBLIC_UMBRACO_URL
ENV PUBLIC_UMBRACO_URL=$PUBLIC_UMBRACO_URL

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:lts-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/build build/
COPY --from=builder /usr/src/app/package.json .
COPY --from=builder /usr/src/app/package-lock.json .

RUN npm ci --production

EXPOSE 3000

CMD ["node", "build"]