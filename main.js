// File: main.js (Admin Login)
// Corrected and updated to use toast notifications for errors.

document.addEventListener('DOMContentLoaded', () => {
    // Ensure the notifications.js script is loaded
    if (typeof showToast !== 'function') {
        console.error('Notification system (showToast) is not available. Make sure notifications.js is loaded before this script.');
        // Fallback to alert if showToast isn't available
        window.showToast = (message, type) => alert(`[${type.toUpperCase()}] ${message}`);
    }

    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email'); 
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginBtn');
    const originalButtonText = loginButton ? loginButton.textContent : 'Login Securely';

    if (!loginForm) {
        console.error('Login form with id "loginForm" not found!');
        return;
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); 
        
        if (loginButton) {
            loginButton.disabled = true; 
            loginButton.innerHTML = `<span class="button-spinner"></span> Logging in...`;
        }
        
        const usernameOrEmail = emailInput.value.trim();
        const password = passwordInput.value;

        if (!usernameOrEmail || !password) {
            showToast('Please enter both username and password.', 'error');
            if (loginButton) {
                loginButton.disabled = false;
                loginButton.textContent = originalButtonText;
            }
            return;
        }
        
        try {
            const apiUrl = 'https://student-health-backend.onrender.com/api/auth/login';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: usernameOrEmail,
                    password: password
                })
            });

            const responseData = await response.json();

            if (response.ok) {
                // On successful login, store the token and username
                if (responseData.token && responseData.admin.username) {
                    localStorage.setItem('authToken', responseData.token);
                    localStorage.setItem('adminUsername', responseData.admin.username);
                    // Redirect to the dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    // Handle case where login is successful but token is missing
                    throw new Error('Authentication response is missing required data.');
                }
            } else {
                // Use toast for login errors from the server
                showToast(responseData.message || 'Login failed. Please check your credentials.', 'error');
            }
        } catch (error) {
            // Use toast for network or other unexpected errors
            showToast('An error occurred. Please check your network connection.', 'error');
            console.error("Login Error:", error);
        } finally {
            // This block runs after the try/catch.
            // Re-enable the button only if the login was not successful.
            // If successful, the page will redirect anyway.
            if (loginButton) {
                loginButton.disabled = false;
                loginButton.textContent = originalButtonText;
            }
        }
    });
});
