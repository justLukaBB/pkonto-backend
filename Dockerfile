# Use Node.js 22 on Debian (bullseye) as base image
FROM node:22-bullseye-slim

# Install LibreOffice and required dependencies
RUN apt-get update && \
    apt-get install -y \
    libreoffice \
    libreoffice-writer \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --production

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p /app/src/uploads

# Expose port (Render will override this with PORT env var)
EXPOSE 10000

# Start the application
CMD ["npm", "start"]
