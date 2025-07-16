// File: student-auth-guard.js
// This script acts as a gatekeeper for PROTECTED STUDENT pages.
// It checks for 'studentAuthToken' in localStorage.
// If not found, it immediately redirects to the student login page.

(function() {
    // Check for the student-specific authentication token.
    const token = localStorage.getItem('studentAuthToken');

    if (!token) {
        console.warn("Student Auth Guard: No student token found. Redirecting to student login page.");
        
        // Redirect to the STUDENT login page.
        window.location.href = 'student-login.html';
    } else {
        console.log("Student Auth Guard: Student token found. Access granted.");
    }
})();
