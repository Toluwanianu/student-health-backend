// File: admin-chat.js
// Handles all functionality for the admin's chat interface, now with polling and delete.

document.addEventListener('DOMContentLoaded', () => {
    // --- AUTH GUARD ---
    const token = localStorage.getItem('authToken'); // Admin's token
    if (!token) {
        window.location.href = 'login.html';
        return; 
    }

    // --- Element References ---
    const conversationListDiv = document.getElementById('conversationList');
    const chatWindow = document.getElementById('chatWindow');
    const placeholderPanel = document.getElementById('placeholderPanel');
    const chatSubject = document.getElementById('chatSubject');
    const chatStudentInfo = document.getElementById('chatStudentInfo');
    const chatMessagesDiv = document.getElementById('chatMessages');
    const replyForm = document.getElementById('replyForm');
    const chatConversationIdInput = document.getElementById('chatConversationId');
    const replyMessageInput = document.getElementById('replyMessageInput');
    const viewStudentRecordBtn = document.getElementById('viewStudentRecordBtn');
    const deleteConversationBtn = document.getElementById('deleteConversationBtn'); // New Delete Button

    let currentConversations = [];
    let activeConversationId = null;
    let pollingInterval = null; // To hold our setInterval timer

    // --- Helper function for API calls ---
    async function fetchApi(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401) {
            localStorage.clear();
            window.location.href = 'login.html';
            throw new Error('Session expired.');
        }
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
            throw new Error(errorData.message || `API request failed with status ${response.status}`);
        }
        // For DELETE requests which might not have a body
        if (response.status === 204) return; 
        return response.json();
    }

    // --- Data Fetching & Rendering ---
    async function fetchConversations() {
        try {
            // Fetch conversations awaiting admin reply first for priority
            const conversations = await fetchApi('https://student-health-backend.onrender.com/api/conversations/admin?status=Awaiting Admin Reply');
            currentConversations = conversations;
            renderConversationList(currentConversations);
            
            if(activeConversationId) {
                const updatedConvo = currentConversations.find(c => c._id === activeConversationId);
                if(updatedConvo) {
                    renderChatMessages(updatedConvo.messages);
                } else {
                    showPlaceholder();
                }
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
            conversationListDiv.innerHTML = `<p class="text-red-500 p-4">Could not load conversations.</p>`;
        }
    }

    function renderConversationList(conversations) {
        conversationListDiv.innerHTML = '';
        if (conversations.length === 0) {
            conversationListDiv.innerHTML = `<p class="p-4" style="color: var(--text-secondary);">No active conversations requiring a reply.</p>`;
            return;
        }
        conversations.forEach(convo => {
            const lastMessage = convo.messages[convo.messages.length - 1];
            const convoElement = document.createElement('div');
            convoElement.className = `convo-item ${convo._id === activeConversationId ? 'active' : ''}`;
            convoElement.dataset.conversationId = convo._id;
            const needsReply = convo.status === 'Awaiting Admin Reply';
            convoElement.innerHTML = `
                <div class="flex justify-between items-center">
                    <p class="font-semibold truncate">${convo.student?.fullName || 'Unknown Student'}</p>
                    <p class="text-xs flex-shrink-0" style="color: var(--text-secondary);">${new Date(convo.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
                <p class="font-medium text-sm truncate">${convo.subject}</p>
                <div class="flex justify-between items-center mt-1">
                    <p class="convo-last-message">${lastMessage ? `${lastMessage.sender}: ${lastMessage.message}` : 'No messages yet.'}</p>
                    ${needsReply ? '<span class="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0" title="Reply needed"></span>' : ''}
                </div>
            `;
            conversationListDiv.appendChild(convoElement);
        });
    }

    function renderChatMessages(messages) {
        chatMessagesDiv.innerHTML = '';
        if (!messages || messages.length === 0) {
            chatMessagesDiv.innerHTML = `<p class="m-auto" style="color: var(--text-secondary);">No messages in this conversation yet.</p>`;
            return;
        }
        messages.forEach(msg => {
            const messageWrapper = document.createElement('div');
            messageWrapper.className = `message-wrapper ${msg.sender.toLowerCase()}`;
            const messageBubble = document.createElement('div');
            const timestamp = new Date(msg.createdAt).toLocaleString();
            messageBubble.className = `message-bubble ${msg.sender.toLowerCase()}`;
            messageBubble.innerHTML = `<span>${msg.message}</span><span class="timestamp">${timestamp}</span>`;
            messageWrapper.appendChild(messageBubble);
            chatMessagesDiv.appendChild(messageWrapper);
        });
        chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
    }

    // --- Event Handlers & Logic ---
    function openChat(conversationId) {
        const conversation = currentConversations.find(c => c._id === conversationId);
        if (!conversation) return;
        
        activeConversationId = conversationId;
        chatWindow.classList.remove('hidden');
        placeholderPanel.classList.add('hidden');
        
        chatSubject.textContent = conversation.subject;
        chatStudentInfo.textContent = `From: ${conversation.student?.fullName || 'Unknown'} (${conversation.student?.matric_no || 'N/A'})`;
        chatConversationIdInput.value = conversation._id;
        
        if (viewStudentRecordBtn && conversation.student?._id) {
            viewStudentRecordBtn.classList.remove('hidden');
            viewStudentRecordBtn.dataset.studentId = conversation.student._id;
        }
        if (deleteConversationBtn) {
            deleteConversationBtn.classList.remove('hidden');
            deleteConversationBtn.dataset.conversationId = conversation._id;
        }

        renderChatMessages(conversation.messages);
        renderConversationList(currentConversations);
        startPollingForMessages(conversationId);
    }
    
    function showPlaceholder() {
        activeConversationId = null;
        chatWindow.classList.add('hidden');
        placeholderPanel.classList.remove('hidden');
        if (viewStudentRecordBtn) viewStudentRecordBtn.classList.add('hidden');
        if (deleteConversationBtn) deleteConversationBtn.classList.add('hidden');
        if (pollingInterval) clearInterval(pollingInterval);
        renderConversationList(currentConversations);
    }

    conversationListDiv.addEventListener('click', (e) => {
        const conversationElement = e.target.closest('[data-conversation-id]');
        if (conversationElement) openChat(conversationElement.dataset.conversationId);
    });

    if (viewStudentRecordBtn) {
        viewStudentRecordBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const studentId = e.currentTarget.dataset.studentId;
            if (studentId) {
                localStorage.setItem('editId', studentId);
                window.open('edit.html', '_blank');
            }
        });
    }

    if(deleteConversationBtn) {
        deleteConversationBtn.addEventListener('click', async (e) => {
            const conversationId = e.currentTarget.dataset.conversationId;
            if(!conversationId) return;

            if(confirm('Are you sure you want to permanently delete this entire conversation? This cannot be undone.')) {
                try {
                    await fetchApi(`https://student-health-backend.onrender.com/api/conversations/${conversationId}`, { method: 'DELETE' });
                    showPlaceholder();
                    fetchConversations(); // Refresh the list on the left
                } catch(error) {
                    console.error('Error deleting conversation:', error);
                    alert('Failed to delete conversation.');
                }
            }
        });
    }

    replyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const conversationId = chatConversationIdInput.value;
        const message = replyMessageInput.value.trim();
        if (!message) return;

        try {
            const updatedConversation = await fetchApi(`https://student-health-backend.onrender.com/api/conversations/${conversationId}/messages`, {
                method: 'POST',
                body: JSON.stringify({ message })
            });
            const index = currentConversations.findIndex(c => c._id === conversationId);
            currentConversations[index] = updatedConversation;
            renderChatMessages(updatedConversation.messages);
            renderConversationList(currentConversations);
            replyMessageInput.value = '';
        } catch (error) {
            console.error('Error sending reply:', error);
            alert('Could not send reply. Please try again.');
        }
    });

    // --- Polling Functions ---
    function startPollingForMessages(conversationId) {
        if (pollingInterval) clearInterval(pollingInterval);
        pollingInterval = setInterval(() => {
            pollForNewMessages(conversationId);
        }, 5000); // Check every 5 seconds
    }

    async function pollForNewMessages(conversationId) {
        if (document.hidden || activeConversationId !== conversationId) return; 

        try {
            const conversationOnServer = await fetchApi(`https://student-health-backend.onrender.com/api/conversations/${conversationId}`);
            const localConversation = currentConversations.find(c => c._id === conversationId);

            if (localConversation && conversationOnServer.messages.length > localConversation.messages.length) {
                console.log("[Polling] New message found! Updating chat window.");
                const index = currentConversations.findIndex(c => c._id === conversationId);
                currentConversations[index] = conversationOnServer;
                renderChatMessages(conversationOnServer.messages);
            }
        } catch (error) {
            console.error("Polling error:", error);
            clearInterval(pollingInterval);
        }
    }

    // --- Initial Page Load ---
    fetchConversations(); 
});
