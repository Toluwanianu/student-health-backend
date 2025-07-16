// File: models/Admin.js
// Updated to include fields for password reset functionality.

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    // --- NEW FIELDS FOR PASSWORD RESET ---
    passwordResetToken: String,
    passwordResetExpires: Date,
    // ------------------------------------
}, {
    timestamps: true 
});

// Middleware to hash password before saving
adminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare entered password with hashed password
adminSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Check if the model already exists before compiling it
module.exports = mongoose.models.Admin || mongoose.model("Admin", adminSchema);
