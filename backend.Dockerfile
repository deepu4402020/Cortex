FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose backend port
EXPOSE 3001

# Command to run the application securely (no nodemon in prod!)
CMD ["npm", "run", "dev"]
