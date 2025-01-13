FROM node:21.6.1
WORKDIR /usr/src/app

#copying package.json files
COPY package*.json ./


RUN npm install


RUN npm install socket.io-client@latest
RUN npm install @types/socket.io-client
RUN npm install uuid
RUN npm install --save-dev @types/uuid
#dodac to do package json




COPY . .


RUN npm run build


EXPOSE 3000


CMD ["npm", "run", "start"]
