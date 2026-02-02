FROM node:20-alpine

WORKDIR /app

# Install dependencies with retries
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies with increased timeout and retries
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 10 && \
    npm install --legacy-peer-deps || \
    (sleep 10 && npm install --legacy-peer-deps) || \
    (sleep 20 && npm install --legacy-peer-deps)

# Generate Prisma Client
RUN npx prisma generate

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=development
ENV NODE_OPTIONS=--max-old-space-size=4096

# Start the application
CMD ["npm", "run", "dev"]
