# Stage 1: Build the application
FROM new.cicd-jfrog.telkomsel.co.id/docker/node:20.17.0-alpine-arm AS builder

WORKDIR /usr/src/app

# Add security dependencies
RUN apk add --no-cache dumb-init

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 2: Create the production image
FROM new.cicd-jfrog.telkomsel.co.id/docker/node:20.17.0-alpine-arm

# Add necessary security updates and tools
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /usr/src/app

# Copy only necessary files from builder
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/assets ./assets
COPY --from=builder /usr/bin/dumb-init /usr/bin/dumb-init

# Set environment variables
ENV NODE_ENV=production \
    PORT=8085 \
    BASE_PATH=/image-compress

# Expose correct port
EXPOSE 8085

# Use dumb-init as entrypoint
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the application
CMD ["npm", "start"]
