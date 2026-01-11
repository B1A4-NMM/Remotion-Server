# ==============================================================================
# 1. Builder Stage: Compile TypeScript to JavaScript
# ==============================================================================
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install all dependencies (including devDependencies)
COPY package.json package-lock.json ./
# Use 'ci' for reproducible builds
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Build the application
RUN npm run build

# Add this line for debugging to list the contents of the dist directory
RUN ls -lR dist

# ==============================================================================
# 2. Production Stage: Create the final, lean image
# ==============================================================================
FROM node:22-alpine

# Set environment to 'production'
ENV NODE_ENV=production

# Set Node.js options to limit memory usage for a 1GB RAM server.
# This allocates a maximum of 512MB to the Node.js heap.
ENV NODE_OPTIONS=--max-old-space-size=512

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package.json package-lock.json ./

# Install *only* production dependencies
RUN npm ci --omit=dev

# Copy the built application from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# The '.env' file is NOT copied into the image.
# It should be injected at runtime using Docker's '--env-file' flag
# or other secrets management tools for better security and flexibility.
# Example: docker run --env-file ./.env -p 3000:3000 <image-name>

# Expose the application port (default NestJS port is 3000)
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "start:prod"]
