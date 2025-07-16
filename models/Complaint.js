// File: models/Complaint.js
// Updated to support a chat-like conversation with multiple messages.

const mongoose = require('mongoose');
const { Schema } = mongoose;

// A sub-schema for individual messages within a conversation
const messageSchema = new Schema({
    sender: {
        type: String,
        required: true,
        enum: ['Student', 'Admin'] // To know who sent the message
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    read: { // To track if the message has been seen
        type: Boolean,
        default: false
    }
}, {
    timestamps: true // Each message will have its own timestamp
});


const complaintSchema = new Schema({
    student: {
        type: Schema.Types.ObjectId, 
        ref: 'Student', 
        required: true,
    },
    subject: { // The initial topic of the conversation
        type: String,
        required: [true, 'A subject for the complaint is required.'],
        trim: true
    },
    status: {
        type: String,
        required: true,
        enum: ['Open', 'Awaiting Student Reply', 'Awaiting Admin Reply', 'Closed'],
        default: 'Open'
    },
    messages: [messageSchema] // An array of messages using the sub-schema
}, {
    timestamps: true // For the overall conversation thread
});

// Before creating the model, check if it already exists to prevent OverwriteModelError
module.exports = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);
