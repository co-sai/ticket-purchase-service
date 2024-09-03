# Use the official Node.js image as a base
FROM node:18

# Create and set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the NestJS application
RUN npm run build

# Expose the application port
EXPOSE 8000

# Define the command to run the application
CMD ["npm", "run", "start:prod"]
