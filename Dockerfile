FROM node:10
WORKDIR /usr/src/app
COPY package*.json ./
COPY src ./src
COPY www ./www
RUN npm install
EXPOSE 3000
ENV SERVER_CONFIG=/app/config/default.json
CMD [ "node", "src/main.js"]