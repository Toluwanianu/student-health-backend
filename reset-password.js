// File: reset-password.js
// Handles the "Reset Password" form submission.

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('resetPasswordForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const messageBox = document.getElementById('messageBox');
    const submitBtn = document.getElementById('submitBtn');
    const loginLinkContainer = document.getElementById('loginLinkContainer');
    const loginLink = document.getElementById('loginLink');

    // Get the token and userType from the URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userType = urlParams.get('userType');

    if (!token || !userType) {
        messageBox.textContent = 'Invalid password reset link. Please try again.';
        messageBox.className = 'message-box error';
        messageBox.style.display = 'block';
        form.style.display = 'none'; // Hide the form if the link is bad
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (password !== confirmPassword) {
            messageBox.textContent = 'Passwords do not match.';
            messageBox.className = 'message-box error';
            messageBox.style.display = 'block';
            return;
        }
        if (password.length < 6) {
            messageBox.textContent = 'Password must be at least 6 characters long.';
            messageBox.className = 'message-box error';
            messageBox.style.display = 'block';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Resetting...';
        messageBox.style.display = 'none';

        // Determine the correct API endpoint based on the userType from the URL
        const apiUrl = userType === 'admin' 
            ? `https://student-health-backend.onrender.com/api/auth/reset-password/${token}`
            : `https://student-health-backend.onrender.com/api/student/reset-password/${token}`;
        
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'An unknown error occurred.');
            }

            messageBox.textContent = data.message || 'Password reset successfully!';
            messageBox.className = 'message-box success';
            form.style.display = 'none'; // Hide form on success
            
            // Show the correct login link
            if (userType === 'admin') {
                loginLink.href = 'login.html.html';
            } else {
                loginLink.href = 'student-login.html';
            }
            loginLinkContainer.style.display = 'block';

        } catch (error) {
            messageBox.textContent = error.message;
            messageBox.className = 'message-box error';
        } finally {
            messageBox.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reset Password';
        }
    });
});
