# Use Node.js 18 Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system deps required by Next.js (and sharp when present)
RUN apk add --no-cache libc6-compat

# Install dependencies (including dev dependencies for build)
COPY package*.json ./
RUN npm ci --omit=optional && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Start the application using the standalone output for smaller image
CMD ["npm", "start"]
