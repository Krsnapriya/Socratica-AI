FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
COPY client/package.json client/package-lock.json* ./client/
RUN npm ci --omit=dev && cd client && npm ci

COPY server/ ./server/
COPY client/src/ ./client/src/
COPY client/index.html ./client/
COPY client/vite.config.js ./client/
COPY client/tailwind.config.js ./client/
COPY client/postcss.config.js ./client/
COPY client/public/ ./client/public/

RUN cd client && npm run build

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "server/server.js"]
