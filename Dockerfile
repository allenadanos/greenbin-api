FROM node:18

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install --production

COPY model ./model
COPY server.js ./
COPY supabaseStorage.js ./

EXPOSE 3000

CMD ["node", "server.js"]