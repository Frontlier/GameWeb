# GameWeb — imagem de produção
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
# baixa os emuladores (EmulatorJS e Play!) e os jogos livres do catálogo inicial
RUN node scripts/fetch-emulators.js && node scripts/fetch-roms.js
# dados (JSON) e uploads do painel devem ficar em volumes
VOLUME ["/app/data", "/app/public/uploads"]
EXPOSE 3000
CMD ["node", "server.js"]
