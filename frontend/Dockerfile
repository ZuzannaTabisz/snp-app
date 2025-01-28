FROM node:21.6.1
WORKDIR /usr/src/app

#copying package.json files
COPY package*.json ./

RUN npm ci && \
    npm install socket.io-client uuid @types/socket.io-client @types/uuid && \
    npm install --save seqalign

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
