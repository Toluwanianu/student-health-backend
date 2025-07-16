// notifications.js
// A simple, reusable toast notification system.

function showToast(message, type = 'info') { // type can be 'success', 'error', or 'info'
    let toastContainer = document.getElementById('toast-container');

    // If the container doesn't exist on the page, create it and append it to the body
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`; // e.g., 'toast success'

    let iconHtml = '';
    // Add an icon based on the message type
    if (type === 'success') {
        iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`;
    } else if (type === 'error') {
        iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>`;
    } else { // info
        iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>`;
    }

    toast.innerHTML = `
        <div class="toast-icon">${iconHtml}</div>
        <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Remove the toast from the DOM after the animation completes (5 seconds total)
    setTimeout(() => {
        toast.remove();
        // If the container is empty after removing the toast, remove the container itself
        if (toastContainer.children.length === 0) {
            toastContainer.remove();
        }
    }, 5000);
}
