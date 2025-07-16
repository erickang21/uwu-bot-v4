FROM node:20.16.0
WORKDIR /uwu-bot

COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "index.js"]