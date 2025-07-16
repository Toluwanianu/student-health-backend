// File: routes/studentActionsRoutes.js (or add to your existing students routes file)

const express = require('express');
const router = express.Router();
const Student = require('../models/Student'); // Adjust the path to your Student model

// POST /api/students/bulk-import
// Route to handle inserting multiple student records at once.
router.post('/bulk-import', async (req, res) => {
    // The frontend will send an array of student objects in the request body.
    const studentsToImport = req.body.students;

    if (!studentsToImport || !Array.isArray(studentsToImport) || studentsToImport.length === 0) {
        return res.status(400).json({ message: 'Request must include a non-empty array of students.' });
    }

    console.log(`[Backend] Attempting to bulk import ${studentsToImport.length} students.`);

    try {
        // Mongoose's insertMany is highly optimized for this.
        // It will attempt to insert all documents. If one fails, by default, it stops.
        // We can add options to continue on error if needed.
        const insertedStudents = await Student.insertMany(studentsToImport, { ordered: false }); 
        // 'ordered: false' means it will attempt to insert all documents even if some fail validation.

        console.log(`[Backend] Successfully inserted ${insertedStudents.length} students.`);
        res.status(201).json({
            message: `Successfully imported ${insertedStudents.length} of ${studentsToImport.length} records.`,
            successCount: insertedStudents.length,
            attemptedCount: studentsToImport.length,
            // In a more advanced setup, you could return details about which records failed.
        });

    } catch (error) {
        console.error('[Backend] Bulk import error:', error);

        // error.writeErrors contains details on which documents failed validation if 'ordered: false' is used
        if (error.writeErrors) {
            const successfulCount = error.insertedDocs?.length || 0;
            const failedCount = error.writeErrors.length;
            const totalAttempted = successfulCount + failedCount;
            // Create a summary of validation errors
            const errorSummary = error.writeErrors.map(err => `Record #${err.index}: ${err.errmsg}`).join('\n');
            
            return res.status(400).json({
                message: `Partial success. Imported ${successfulCount} of ${totalAttempted} records. Some records had errors.`,
                successCount: successfulCount,
                attemptedCount: totalAttempted,
                errorDetails: errorSummary
            });
        }

        // Generic server error
        res.status(500).json({ message: 'A server error occurred during the bulk import process.', error: error.message });
    }
});

module.exports = router;
