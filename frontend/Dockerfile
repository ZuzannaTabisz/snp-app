FROM node:21.6.1-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

EXPOSE 3000

# Use production mode
ENV NODE_ENV=production

CMD ["npm", "start"]
