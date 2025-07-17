// File: routes/conversationRoutes.js
// Handles all chat-like conversation API endpoints for both students and admins.

const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint'); // Using the updated Complaint model
const Student = require('../models/students'); // To populate student details
const { protect } = require('../middleware/authMiddleware'); // Your security guard
const { sendNewMessageAlert } = require('../utils/emailService'); // Import the email service

// --- STUDENT-FACING ROUTES ---

// GET /api/conversations/student - Get all conversations for the logged-in student
router.get('/student', protect, async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(403).json({ message: 'Forbidden: User ID not found in token.' });
    }
    try {
        const conversations = await Complaint.find({ student: req.user.id })
            .sort({ updatedAt: -1 }); // Show most recently updated first
        res.json(conversations);
    } catch (error) {
        console.error('Error fetching student conversations:', error);
        res.status(500).json({ message: 'Server error while fetching conversations.' });
    }
});

// POST /api/conversations/student - Start a new conversation
router.post('/student', protect, async (req, res) => {
    try {
        const newConversation = new Complaint({
            student: req.user.id,
            subject: req.body.subject,
            messages: [{ sender: 'Student', message: req.body.message }],
            status: 'Awaiting Admin Reply'
        });
        await newConversation.save();
        
        if (req.user && req.user.fullName) {
            sendNewMessageAlert(req.user.fullName, newConversation.subject);
        }

        res.status(201).json(newConversation);
    } catch (error) {
        console.error('Error starting new conversation:', error);
        res.status(500).json({ message: 'Server error while starting conversation.' });
    }
});


// --- ADMIN-FACING ROUTES ---

// GET /api/conversations/admin - Get all conversations for the admin dashboard
router.get('/admin', protect, async (req, res) => {
    try {
        const query = req.query || {};
        const conversations = await Complaint.find(query)
            .populate('student', 'fullName matric_no')
            .sort({ updatedAt: -1 });
        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations for admin:', error);
        res.status(500).json({ message: 'Server error while fetching conversations.' });
    }
});


// --- SHARED ROUTES for managing a single conversation ---

// ***** NEW ROUTE ADDED HERE *****
// GET /api/conversations/:id - Get a single conversation by its ID
router.get('/:id', protect, async (req, res) => {
    try {
        const conversation = await Complaint.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found.' });
        }

        // Security Check: Ensure the user is authorized to view this conversation
        const userRole = req.user.role;
        const userId = req.user.id;

        if (userRole === 'student' && conversation.student.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to view this conversation.' });
        }
        // Admins are allowed to view any conversation

        res.json(conversation);

    } catch (error) {
        console.error('Error fetching single conversation:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// **********************************

// POST /api/conversations/:id/messages - Add a message to an existing conversation
router.post('/:id/messages', protect, async (req, res) => {
    try {
        const conversation = await Complaint.findById(req.params.id);
        if (!conversation) return res.status(404).json({ message: 'Conversation not found.' });

        const senderRole = req.user.role === 'admin' ? 'Admin' : 'Student';

        if (senderRole === 'Student' && conversation.student.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized.' });
        }

        conversation.messages.push({ sender: senderRole, message: req.body.message });
        conversation.status = senderRole === 'Admin' ? 'Awaiting Student Reply' : 'Awaiting Admin Reply';
        await conversation.save();

        if (senderRole === 'Student') {
            if (req.user && req.user.fullName) {
                sendNewMessageAlert(req.user.fullName, conversation.subject);
            }
        }
        
        res.json(conversation);
    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({ message: 'Server error while adding message.' });
    }
});

// DELETE /api/conversations/:id - Delete a whole conversation (Admin only)
router.delete('/:id', protect, async (req, res) => {
    try {
        const conversation = await Complaint.findByIdAndDelete(req.params.id);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found.' });
        }
        res.status(204).send(); // 204 No Content is a good response for a successful delete
    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
