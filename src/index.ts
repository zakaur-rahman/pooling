import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import * as kafka from './config/kafka';
import SocketIOServer from './config/socket';
import pollRoutes from './routes/polls';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/polls', pollRoutes);

// Start the server
const PORT = process.env.PORT || 8000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function startServer() {
    try {
        console.log('Waiting for Kafka to be ready...');
        await sleep(10000); // Wait for 10 seconds to ensure Kafka is ready

        // Initialize Kafka
        await kafka.initializeKafka();
        await kafka.producer.connect();
        await kafka.consumer.connect();
        await kafka.consumer.subscribe({ topics: [kafka.VOTE_TOPIC] });

        // Set up Kafka consumer
        await kafka.consumer.run({
            eachMessage: async ({ message }) => {
                if (message.value) {
                    const data = JSON.parse(message.value.toString());
                    if (data.type === 'VOTE_UPDATE' && data.poll) {
                        // Emit to specific poll room
                        io.emitToPoll(data.pollId.toString(), 'vote-update', { poll: data.poll });
                        // Emit to all clients for home page updates
                        io.emitToAll('vote-update', { poll: data.poll });
                    }
                }
            },
        });

        // Start HTTP server
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer(); 