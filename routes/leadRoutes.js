import express from 'express';
import { body, param } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  getLeads,
  createLead,
  getLeadById,
  updateLead,
  updateLeadStatus,
  deleteLead,
  getLeadStats,
  getMonthlyStats,
  searchLeads,
} from '../controllers/leadController.js';

const router = express.Router();

const STATUS_VALUES = ['New', 'Contacted', 'Meeting Scheduled', 'Proposal Sent', 'Won', 'Lost'];
const SOURCE_VALUES = ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Email Campaign', 'Other'];

const createLeadValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('company').trim().notEmpty().withMessage('Company is required'),
  body('email').isEmail().withMessage('Must be a valid email address'),
  body('status').optional().isIn(STATUS_VALUES).withMessage('Invalid status value'),
  body('source').optional().isIn(SOURCE_VALUES).withMessage('Invalid source value'),
];

const updateLeadValidation = [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('company').optional().trim().notEmpty().withMessage('Company is required'),
  body('email').optional().isEmail().withMessage('Must be a valid email address'),
  body('status').optional().isIn(STATUS_VALUES).withMessage('Invalid status value'),
  body('source').optional().isIn(SOURCE_VALUES).withMessage('Invalid source value'),
];

const statusValidation = [
  param('id').isMongoId().withMessage('Invalid lead ID'),
  body('status').isIn(STATUS_VALUES).withMessage('Invalid status value'),
];

router.use(protect);

router.get('/stats/summary', getLeadStats);
router.get('/stats/monthly', getMonthlyStats);
router.get('/search', searchLeads);
router.get('/', getLeads);
router.post('/', validate(createLeadValidation), createLead);
router.get('/:id', getLeadById);
router.put('/:id', validate(updateLeadValidation), updateLead);
router.patch('/:id/status', validate(statusValidation), updateLeadStatus);
router.delete('/:id', deleteLead);

export default router;
