// File: models/Student.js
// Updated to include fields for password reset functionality.

const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
    matric_no: {
        type: String,
        required: [true, "Matriculation number is required"],
        unique: true
    },
    fullName: {
        type: String,
        required: [true, "Full name is required"],
        trim: true
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    // --- NEW FIELDS FOR PASSWORD RESET ---
    passwordResetToken: String,
    passwordResetExpires: Date,
    // ------------------------------------
    email: { // An email is crucial for password resets
        type: String,
        required: [true, "Email is required for password recovery"],
        trim: true,
        lowercase: true,
        unique: true,
        sparse: true // Allows multiple null values but enforces uniqueness for non-null values
    },
    medical_number: {
        type: String,
        trim: true
    },
    department: {
        type: String,
        required: [true, "Department is required"],
        trim: true
    },
    faculty: {
        type: String,
        trim: true
    },
    age: {
        type: Number
    },
    gender: {
        type: String,
        required: [true, "Gender is required"],
        enum: ["Male", "Female", "Other"]
    },
    genotype: {
        type: String,
        trim: true
    },
    allergies: {
        type: String
    },
    current_complaint: {
        type: String
    },
    drugs_given: {
        type: String
    },
    healthStatus: {
        type: String
    },
    date_of_birth: {
        type: Date
    },
    level: {
        type: Number
    },
    phone: {
        type: String
    },
    address: {
        type: String
    },
    medicalHistory: {
        type: String
    },
    healthComplaints: {
        type: String
    },
    hostelClinicVisits: {
        type: Number,
        default: 0
    },
    recentTreatments: {
        type: String
    }
}, {
    timestamps: true 
});

// Mongoose pre-save hook to hash student password
studentSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
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

// Method to compare entered password with the hashed password
studentSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Check if the model has already been compiled to prevent OverwriteModelError
module.exports = mongoose.models.Student || mongoose.model("Student", studentSchema);
