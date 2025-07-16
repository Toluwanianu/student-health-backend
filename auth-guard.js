// File: auth-guard.js
// This script acts as a gatekeeper for protected pages.
// It checks for a secure authentication token in localStorage.
// If not found, it immediately redirects to the login page.

(function() {
    // Check for the authentication token instead of just a username.
    // The key 'authToken' must match what you set in main.js after a successful login.
    const token = localStorage.getItem('authToken');

    if (!token) {
        // No alert pop-up is needed for a smooth user experience.
        console.warn("Auth Guard: No authentication token found. Redirecting to login page.");
        
        // Redirect to the login page.
        // Make sure 'login.html' is the correct path from where your other pages are.
        window.location.href = 'login.html.html';
    } else {
        // If a token exists, we can assume for now the user is logged in.
        // A more advanced check could decode the token to see if it's expired,
        // but for now, checking for its existence is a great security improvement.
        console.log("Auth Guard: Token found. Access granted.");
    }
})();
