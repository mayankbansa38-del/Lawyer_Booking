import express from 'express';
import { submitContactForm } from './controller.js';

const router = express.Router();

/**
 * @route   POST /api/v1/contact/submit
 * @desc    Submit a contact form request
 * @access  Public
 */
router.post('/submit', submitContactForm);

export default router;
