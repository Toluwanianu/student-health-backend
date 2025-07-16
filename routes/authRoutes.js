// File: routes/authRoutes.js
// UPDATED with step-by-step logging to find where it gets stuck.

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); 
const Admin = require('../models/admin'); 

// POST /api/auth/login - Admin Login
router.post('/login', async (req, res) => {
    console.log('\n--- [LOGIN ROUTE] 1. Login attempt received.'); 
    const { username, password } = req.body;

    if (!username || !password) {
        console.error('[LOGIN ROUTE] Error: Username or password missing.');
        return res.status(400).json({ message: 'Please provide username and password.' });
    }

    try {
        console.log('[LOGIN ROUTE] 2. Searching for admin in database...');
        const admin = await Admin.findOne({ username: username.toLowerCase() });

        if (!admin) {
            console.warn(`[LOGIN ROUTE] 3. Admin not found for username: ${username}`);
            return res.status(401).json({ message: 'Invalid credentials.' }); 
        }
        console.log('[LOGIN ROUTE] 3. Admin found. Now comparing password...');

        const isMatch = await admin.comparePassword(password);

        if (!isMatch) {
            console.warn(`[LOGIN ROUTE] 4. Password does not match for admin: ${username}`);
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        console.log('[LOGIN ROUTE] 4. Password matches. Now creating token...');

        const payload = {
            id: admin._id,
            username: admin.username,
            role: 'admin'
        };

        const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' } 
        );
        console.log('[LOGIN ROUTE] 5. Token created. Sending success response...');
        
        res.status(200).json({
            message: 'Login successful!',
            token: token,
            admin: { 
                id: admin._id,
                username: admin.username
            }
        });

    } catch (error) {
        console.error('[LOGIN ROUTE] CRITICAL ERROR inside try/catch block:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

/*
// Keep the register route commented out for security
router.post('/register', async (req, res) => {
    // ... registration logic
});
*/

module.exports = router;
