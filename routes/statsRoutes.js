// File: routes/statsRoutes.js
// Updated to include conversation statistics.

const express = require('express');
const router = express.Router();
const Student = require('../models/student');
const Complaint = require('../models/Complaint'); // Import the Complaint model
const { protect } = require('../middleware/authMiddleware');

// GET /api/stats/summary - Get dashboard summary statistics
router.get('/summary', protect, async (req, res) => {
    console.log('[Backend] Request received for summary stats.');
    try {
        // --- Student Stats ---
        const totalStudents = await Student.countDocuments();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentEntries = await Student.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
        const activeAlerts = await Student.countDocuments({ 
            healthStatus: { $in: ['Poor', 'Critical', 'Urgent'] }
        });

        // --- NEW: Conversation Stats ---
        const totalConversations = await Complaint.countDocuments();
        const unreadConversations = await Complaint.countDocuments({ 
            status: 'Awaiting Admin Reply' 
        });
        // -----------------------------

        const stats = {
            totalStudents,
            recentEntries,
            activeAlerts,
            totalConversations, // Add new stat
            unreadConversations // Add new stat
        };

        console.log('[Backend] Sending summary stats:', stats);
        res.status(200).json(stats);

    } catch (error) {
        console.error('[Backend] Error fetching summary stats:', error);
        res.status(500).json({ message: 'Server error while fetching dashboard statistics.' });
    }
});

module.exports = router;
