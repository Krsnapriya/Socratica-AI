FROM node:20-slim

WORKDIR /app

# Install Python3, g++, make for sandbox fallback + native module compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
COPY server/package.json server/package-lock.json* ./server/
COPY client/package.json client/package-lock.json* ./client/
RUN npm ci --omit=dev && cd server && npm ci --omit=dev && cd ../client && npm ci

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
