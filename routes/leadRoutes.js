import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Example route: GET all leads (Protected)
router.get('/', protect, (req, res) => {
    res.json({ message: "List of leads", user: req.user.name });
});

// Example route: POST create a lead (Protected)
router.post('/', protect, (req, res) => {
    res.json({ message: `Lead created by user: ${req.user.name}` });
});

export default router;