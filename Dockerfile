FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose ports (will be overridden by docker-compose)
EXPOSE 3000

# Default command (will be overridden by docker-compose)
CMD ["npm", "start"]
