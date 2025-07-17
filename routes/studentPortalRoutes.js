// File: routes/studentPortalRoutes.js
// Contains secure API endpoints for the logged-in student.
// UPDATED with a new logging middleware to trace the request.

const express = require('express');
const router = express.Router();
const Student = require('../models/students');
const Complaint = require('../models/Complaint');
const { protect } = require('../middleware/authMiddleware');

// ***** NEW DEBUGGING MIDDLEWARE *****
const logRequest = (req, res, next) => {
    console.log(`\n--- [ROUTER] Request received for: ${req.method} ${req.originalUrl} at ${new Date().toLocaleTimeString()} ---`);
    next(); // Pass control to the next function in the chain (which is 'protect')
};
// **********************************

// --- Route to get the logged-in student's own record ---
// GET /api/student/my-record
// We've added 'logRequest' as the first step.
router.get('/my-record', logRequest, protect, async (req, res) => {
    console.log(`--- [HANDLER] Now inside the /my-record route handler. User ID from token: ${req.user.id} ---`);

    try {
        const student = await Student.findById(req.user.id).select('-password');

        if (!student) {
            return res.status(404).json({ message: 'Student record not found.' });
        }

        res.status(200).json(student);

    } catch (error) {
        console.error('[Backend] Error fetching student self-record:', error);
        res.status(500).json({ message: 'Server error while fetching your record.' });
    }
});

// --- Routes for handling complaints ---
// We'll add the logger to these as well for good measure.
router.get('/complaints', logRequest, protect, async (req, res) => {
    // ... (rest of the function is the same)
});

router.post('/complaints', logRequest, protect, async (req, res) => {
    // ... (rest of the function is the same)
});

// Example login route
router.post('/login', async (req, res) => {
    const { matricNo, password } = req.body;
    // TODO: Replace with real authentication logic
    if (matricNo === 'test' && password === 'password') {
        return res.json({ success: true, token: 'dummy-token' });
    } else {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

module.exports = router;
