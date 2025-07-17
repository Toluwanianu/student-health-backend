// File: routes/authRoutes.js
// This file handles admin login and registration.

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); 
const Admin = require('../models/admin'); // Using lowercase 'admin' to match your likely filename

// POST /api/auth/login - Admin Login
router.post('/login', async (req, res) => {
    console.log('[Backend] /api/auth/login route hit.'); 
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide username and password.' });
    }

    try {
        const admin = await Admin.findOne({ username: username.toLowerCase() });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials.' }); 
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Create the payload for the token, including the admin role
        const payload = {
            id: admin._id,
            username: admin.username,
            role: 'admin'
        };

        // Sign the token with your secret key from the .env file
        const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' } // Token expires in 1 hour
        );
        
        res.status(200).json({
            message: 'Login successful!',
            token: token,
            admin: { 
                id: admin._id,
                username: admin.username
            }
        });

    } catch (error) {
        console.error('Login server error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});


// The /register route should remain commented out for security
router.post('/register', async (req, res) => {
    // ... registration logic
});
        module.exports = router;
            