import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

export class SocketIOServer {
    private io: Server;

    constructor(server: HttpServer) {
        this.io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        this.init();
    }

    private init() {
        this.io.on('connection', (socket: Socket) => {
            console.log('Client connected:', socket.id);

            // Join a poll room
            socket.on('join-poll', (pollId: string) => {
                const roomName = `poll-${pollId}`;
                socket.join(roomName);
                console.log(`Client ${socket.id} joined poll ${pollId}`);
            });

            // Leave a poll room
            socket.on('leave-poll', (pollId: string) => {
                const roomName = `poll-${pollId}`;
                socket.leave(roomName);
                console.log(`Client ${socket.id} left poll ${pollId}`);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
    }

    public emitToPoll(pollId: string, event: string, data: any) {
        const roomName = `poll-${pollId}`;
        console.log(`Emitting ${event} to room ${roomName}:`, data);
        this.io.to(roomName).emit(event, data);
    }

    public emitToAll(event: string, data: any) {
        console.log(`Broadcasting ${event} to all clients:`, data);
        this.io.emit(event, data);
    }
}

export default SocketIOServer; 