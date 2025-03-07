import { Request, Response } from 'express';
import db from '../config/database';
import { producer, VOTE_TOPIC } from '../config/kafka';

// Create a new poll
export const createPoll = async (req: Request, res: Response) => {
    try {
        const { title, description, options } = req.body;
        
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            
            const pollResult = await client.query(
                'INSERT INTO polls (title, description) VALUES ($1, $2) RETURNING id',
                [title, description]
            );
            const pollId = pollResult.rows[0].id;
            
            for (const option of options) {
                await client.query(
                    'INSERT INTO poll_options (poll_id, option_text) VALUES ($1, $2)',
                    [pollId, option]
                );
            }
            
            await client.query('COMMIT');

            // Send new poll event to Kafka
            await producer.send({
                topic: VOTE_TOPIC,
                messages: [{
                    value: JSON.stringify({
                        type: 'NEW_POLL',
                        pollId: pollId,
                        title,
                        description,
                        options,
                        timestamp: new Date().toISOString()
                    })
                }]
            });

            res.status(201).json({ id: pollId, message: 'Poll created successfully' });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating poll:', error);
        res.status(500).json({ error: 'Failed to create poll' });
    }
};

// Get all polls
export const getAllPolls = async (req: Request, res: Response) => {
    try {
        const result = await db.query(`
            WITH option_votes AS (
                SELECT 
                    po.id,
                    po.poll_id,
                    po.option_text,
                    COUNT(v.id) as vote_count
                FROM poll_options po
                LEFT JOIN votes v ON po.id = v.option_id
                GROUP BY po.id, po.poll_id, po.option_text
            )
            SELECT 
                p.*,
                json_agg(
                    json_build_object(
                        'id', ov.id,
                        'option_text', ov.option_text,
                        'votes', ov.vote_count
                    )
                ) as options,
                COALESCE(SUM(ov.vote_count), 0) as total_votes
            FROM polls p
            LEFT JOIN option_votes ov ON p.id = ov.poll_id
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching polls:', error);
        res.status(500).json({ error: 'Failed to fetch polls' });
    }
};

// Get a specific poll
export const getPoll = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        console.log('Fetching poll with ID:', id);
        
        const result = await db.query(`
            WITH option_votes AS (
                SELECT po.id, po.option_text, COUNT(v.id) as vote_count
                FROM poll_options po
                LEFT JOIN votes v ON po.id = v.option_id
                WHERE po.poll_id = $1
                GROUP BY po.id, po.option_text
            )
            SELECT 
                p.*,
                json_agg(
                    json_build_object(
                        'id', ov.id,
                        'option_text', ov.option_text,
                        'votes', ov.vote_count
                    )
                ) as options,
                SUM(ov.vote_count) as total_votes
            FROM polls p
            LEFT JOIN option_votes ov ON p.id = $1
            WHERE p.id = $1
            GROUP BY p.id;
        `, [id]);
        
        console.log('Query result:', result.rows);
        
        if (result.rows.length === 0) {
            console.log('Poll not found');
            res.status(404).json({ error: 'Poll not found' });
            return;
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error details:', error);
        res.status(500).json({ error: 'Failed to fetch poll' });
    }
};

// Vote on a poll
export const votePoll = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { optionId } = req.body;
        
        const validOption = await db.query(
            'SELECT 1 FROM poll_options WHERE id = $1 AND poll_id = $2',
            [optionId, id]
        );
        
        if (validOption.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid option' });
        }
        
        await db.query(
            'INSERT INTO votes (poll_id, option_id) VALUES ($1, $2)',
            [id, optionId]
        );

        // Fetch updated poll data after voting
        const updatedPoll = await db.query(`
            WITH option_votes AS (
                SELECT 
                    po.id,
                    po.option_text,
                    COUNT(v.id) as vote_count
                FROM poll_options po
                LEFT JOIN votes v ON po.id = v.option_id
                WHERE po.poll_id = $1
                GROUP BY po.id, po.option_text
            )
            SELECT 
                p.*,
                json_agg(
                    json_build_object(
                        'id', ov.id,
                        'option_text', ov.option_text,
                        'votes', ov.vote_count
                    )
                ) as options,
                SUM(ov.vote_count) as total_votes
            FROM polls p
            LEFT JOIN option_votes ov ON p.id = $1
            WHERE p.id = $1
            GROUP BY p.id;
        `, [id]);
        
        await producer.send({
            topic: VOTE_TOPIC,
            messages: [{
                value: JSON.stringify({
                    type: 'VOTE_UPDATE',
                    pollId: id,
                    optionId: optionId,
                    poll: updatedPoll.rows[0],
                    timestamp: new Date().toISOString()
                })
            }]
        });
        
        res.json({ message: 'Vote recorded successfully' });
    } catch (error) {
        console.error('Error recording vote:', error);
        res.status(500).json({ error: 'Failed to record vote' });
    }
};

// Get leaderboard
export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const result = await db.query(`
            SELECT po.id, p.title, po.option_text, COUNT(v.id) as vote_count
            FROM poll_options po
            JOIN polls p ON po.poll_id = p.id
            LEFT JOIN votes v ON po.id = v.option_id
            GROUP BY po.id, p.title, po.option_text
            ORDER BY vote_count DESC
            LIMIT 10
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
}; 