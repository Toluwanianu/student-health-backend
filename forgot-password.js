// File: forgot-password.js
// Handles the "Forgot Password" request form.

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('forgotPasswordForm');
    const userTypeRadios = document.querySelectorAll('input[name="userType"]');
    const identifierInput = document.getElementById('identifier');
    const identifierLabel = document.getElementById('identifierLabel');
    const messageBox = document.getElementById('messageBox');
    const submitBtn = document.getElementById('submitBtn');

    // Update the input label based on the selected user type
    function updateUserType() {
        const selectedType = document.querySelector('input[name="userType"]:checked').value;
        if (selectedType === 'admin') {
            identifierLabel.textContent = 'Your Admin Username';
            identifierInput.placeholder = 'e.g., my_admin_user';
            identifierInput.type = 'text';
        } else { // student
            identifierLabel.textContent = 'Your Student Email Address';
            identifierInput.placeholder = 'e.g., student@example.com';
            identifierInput.type = 'email';
        }
    }

    userTypeRadios.forEach(radio => radio.addEventListener('change', updateUserType));

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const userType = document.querySelector('input[name="userType"]:checked').value;
        const identifier = identifierInput.value;

        // UI feedback
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        messageBox.style.display = 'none';
        messageBox.className = 'message-box'; // Reset classes

        let apiUrl = '';
        let body = {};

        if (userType === 'admin') {
            apiUrl = 'https://dashing-daffodil-b7fcc1.netlify.app/api/auth/forgot-password';
            body = { username: identifier };
        } else { // student
            apiUrl = 'https://dashing-daffodil-b7fcc1.netlify.app/api/student/forgot-password';
            body = { email: identifier };
        }

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            // For security, we show a generic success message even if the user/email doesn't exist.
            // The actual reset link will be logged in the Node.js server terminal for development.
            messageBox.textContent = data.message || 'If an account exists, a reset link has been sent.';
            messageBox.classList.add('success');
            messageBox.style.display = 'block';
            form.reset();

        } catch (error) {
            console.error('Forgot Password Error:', error);
            messageBox.textContent = 'An error occurred. Please try again later.';
            messageBox.classList.add('error');
            messageBox.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Reset Link';
        }
    });

    // Initialize the label text
    updateUserType();
});
