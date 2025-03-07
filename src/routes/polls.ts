import { Router } from 'express';
import { RequestHandler } from 'express';
import {
    createPoll,
    getAllPolls,
    getPoll,
    votePoll,
    getLeaderboard
} from '../controllers/pollController';

const router = Router();

// Create a new poll
router.post('/', createPoll as RequestHandler);

// Get all polls
router.get('/', getAllPolls as RequestHandler);

// Get a specific poll
router.get('/:id', getPoll as RequestHandler);

// Vote on a poll
router.post('/:id/vote', votePoll as RequestHandler);

// Get leaderboard
router.get('/leaderboard/top', getLeaderboard as RequestHandler);

export default router; 