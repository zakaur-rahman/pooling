# Real-Time Polling System

A high-concurrency polling system built with Node.js, Kafka, Socket.IO, and PostgreSQL. The system supports real-time vote updates, multiple concurrent users, and ensures data consistency using Kafka as a message broker.

## Features

- Create and manage polls with multiple options (up to 10 options per poll)
- Real-time vote updates using WebSocket (Socket.IO)
- High-concurrency vote handling with Kafka
- Persistent storage with PostgreSQL
- Cross-browser compatibility
- Responsive UI design
- Vote tracking to prevent duplicate votes
- Real-time vote count and percentage updates

## Tech Stack

- **Backend**: Node.js with TypeScript
- **Frontend**: Next.js 14 with React
- **Database**: PostgreSQL
- **Message Broker**: Kafka with Zookeeper
- **Real-time Communication**: Socket.IO
- **Styling**: Tailwind CSS
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose
- PostgreSQL (if running locally)
- npm or yarn

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd polling-system

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Environment Setup

Create two .env files:

Backend `.env` (in root directory):
```env
# Server
PORT=8000
NODE_ENV=development

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=polling_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=polling-app
KAFKA_GROUP_ID=polling-group
```

Frontend `.env` (in frontend directory):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=http://localhost:8000
```

### 3. Start Infrastructure Services

```bash
# Start Kafka, Zookeeper, and PostgreSQL
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 4. Initialize Database

```bash
# Create database schema
psql -h localhost -U postgres -d polling_db -f src/models/schema.sql
```

### 5. Start the Application

In one terminal (backend):
```bash
# Development mode with hot reload
npm run dev

# Or production mode
npm run build
npm start
```

In another terminal (frontend):
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Socket.IO: ws://localhost:8000

## API Documentation

### Poll Endpoints

#### Create Poll
```http
POST /api/polls
Content-Type: application/json

{
  "title": "Your Poll Title",
  "description": "Poll description",
  "options": ["Option 1", "Option 2", "Option 3"]
}
```

#### Get All Polls
```http
GET /api/polls
```

#### Get Specific Poll
```http
GET /api/polls/:id
```

#### Vote on Poll
```http
POST /api/polls/:id/vote
Content-Type: application/json

{
  "optionId": 1
}
```

### WebSocket Events

#### Client-to-Server Events

```typescript
// Join a poll room
socket.emit('join-poll', pollId);

// Leave a poll room
socket.emit('leave-poll', pollId);
```

#### Server-to-Client Events

```typescript
// Listen for vote updates
socket.on('vote-update', (data: { poll: Poll }) => {
  // Handle updated poll data
});

// Listen for new poll creation
socket.on('pollCreated', (data: { id: number }) => {
  // Handle new poll
});
```

## Development Guidelines

### Backend Structure
```
src/
├── config/         # Configuration files (Kafka, Socket.IO, DB)
├── controllers/    # Request handlers
├── models/        # Database schemas and models
├── routes/        # API route definitions
└── types/         # TypeScript type definitions
```

### Frontend Structure
```
frontend/
├── app/           # Next.js pages and components
├── lib/           # Utilities and API client
├── public/        # Static assets
└── types/         # TypeScript type definitions
```

## Error Handling

The system implements comprehensive error handling for:
- Invalid poll/option IDs
- Duplicate votes
- Network failures
- Database connection issues
- Kafka connection issues
- WebSocket disconnections

## Performance Considerations

- Debounced vote updates (500ms) to prevent UI flicker
- Optimistic UI updates for better UX
- Connection retry logic for Kafka and WebSocket
- Proper cleanup of WebSocket listeners
- Local storage for vote tracking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 