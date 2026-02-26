FROM node:20-alpine

WORKDIR /app

# Copy package files and install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Copy all source
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Cloud Run uses PORT env variable
ENV PORT=8080
EXPOSE 8080

WORKDIR /app/backend
CMD ["node", "server.js"]
