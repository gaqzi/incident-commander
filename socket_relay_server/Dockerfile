# Start from the latest golang base image
FROM node:21-alpine3.17

# Set the Current Working Directory inside the container
WORKDIR /app

# Copy source files and dependencies.
COPY package.json .
COPY package-lock.json .
COPY server.js .
COPY utils.js .
COPY callback.js .

# Download all dependencies.
RUN npm install

# Add certs
RUN apk --no-cache add ca-certificates

# Expose port 1234 to the outside world
EXPOSE 1234

# Command to run the executable
CMD ["node", "server.js"]
