FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose development server port (Expo/React Native)
EXPOSE 5000
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Create start-docker script for the mobile app
RUN echo '#!/bin/sh\n\
node start-app.js\n\
' > /app/start-docker.sh && chmod +x /app/start-docker.sh

# Start application in development mode
CMD ["/app/start-docker.sh"]