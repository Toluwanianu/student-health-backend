// File: routes/authRoutes.js
// Temporarily enabling the /register route to create the initial admin user.

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); 
const Admin = require('../models/admin'); 

// POST /api/auth/login - Admin Login
router.post('/login', async (req, res) => {
    // ... (login logic remains the same) ...
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Please provide username and password.' });
        }
        const admin = await Admin.findOne({ username: username.toLowerCase() });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials.' }); 
        }
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        const payload = { id: admin._id, username: admin.username, role: 'admin' };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({
            message: 'Login successful!',
            token: token,
            admin: { id: admin._id, username: admin.username }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login.' });
    }
});


// ***** THIS ROUTE IS NOW ENABLED *****
// POST /api/auth/register - Create a new admin account
router.post('/register', async (req, res) => {
    console.log('[Backend] /api/auth/register route hit.');
    const { username, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        const existingAdmin = await Admin.findOne({ username: username.toLowerCase() });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const newAdmin = new Admin({
            username: username.toLowerCase(),
            password: password // The pre-save hook in the model will hash this
        });

        await newAdmin.save();
        
        res.status(201).json({
            message: 'Admin registered successfully!',
            admin: {
                id: newAdmin._id,
                username: newAdmin.username
            }
        });

    } catch (error) {
        console.error('Registration server error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});
// ************************************


module.exports = router;
