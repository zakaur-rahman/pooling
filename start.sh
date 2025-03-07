#!/bin/bash

# Start infrastructure services
echo "Starting infrastructure services..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Initialize database schema
echo "Initializing database schema..."
docker exec -i pooling-postgres-1 psql -U postgres -d polling_db < src/models/schema.sql

# Install dependencies if needed
echo "Installing dependencies..."
npm install

# Start the application
echo "Starting the application..."
npm run dev 