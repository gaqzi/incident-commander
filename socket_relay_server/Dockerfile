FROM node:21-alpine3.17
WORKDIR /app
COPY package.json .
COPY package-lock.json .
COPY server.js .
COPY utils.js .
COPY callback.js .

RUN npm install

CMD ["node", "server.js"]