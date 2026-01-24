# StatJam Relay Server - Railway Deployment
# Includes FFmpeg for video transcoding

FROM node:20-slim

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production
RUN npm install typescript

# Copy source
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Expose port (Railway sets PORT env var)
EXPOSE 8080

# Start server
CMD ["npm", "start"]
