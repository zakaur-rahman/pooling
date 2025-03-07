import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

export const VOTE_TOPIC = 'poll-votes';
export const RESULTS_TOPIC = 'poll-results';

const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'polling-app',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID || 'polling-group' });

// Initialize Kafka topics
export const initializeKafka = async () => {
    const admin = kafka.admin();
    try {
        await admin.connect();
        await admin.createTopics({
            topics: [
                { topic: VOTE_TOPIC, numPartitions: 1, replicationFactor: 1 },
                { topic: RESULTS_TOPIC, numPartitions: 1, replicationFactor: 1 }
            ]
        });
        console.log('Kafka topics created successfully');
    } catch (error) {
        console.error('Error creating Kafka topics:', error);
    } finally {
        await admin.disconnect();
    }
}; 