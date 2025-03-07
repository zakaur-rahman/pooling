# Start infrastructure services
Write-Host "Starting infrastructure services..."
docker-compose up -d

# Wait for services to be ready
Write-Host "Waiting for services to be ready..."
Start-Sleep -Seconds 10

# Initialize database schema
Write-Host "Initializing database schema..."
Get-Content src/models/schema.sql | docker exec -i pooling-postgres-1 psql -U postgres -d polling_db

# Install dependencies if needed
Write-Host "Installing dependencies..."
npm install

# Start the application
Write-Host "Starting the application..."
npm run dev 