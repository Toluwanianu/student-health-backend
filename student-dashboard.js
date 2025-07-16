// File: student-dashboard.js
// UPDATED: Now includes polling to automatically refresh chat messages.

document.addEventListener('DOMContentLoaded', () => {
    // --- AUTH GUARD ---
    const token = localStorage.getItem('studentAuthToken');
    if (!token) {
        window.location.href = 'student-login.html';
        return; 
    }

    // --- Element References ---
    const welcomeMessageElement = document.getElementById('welcomeMessage');
    const logoutButton = document.getElementById('logoutButton');
    const myRecordDetailsDiv = document.getElementById('myRecordDetails');
    const conversationSelector = document.getElementById('conversationSelector');
    const newConversationBtn = document.getElementById('newConversationBtn');
    
    // Chat Window Elements
    const chatWindow = document.getElementById('chatWindow');
    const placeholderPanel = document.getElementById('placeholderPanel');
    const chatSubject = document.getElementById('chatSubject');
    const chatMessagesDiv = document.getElementById('chatMessages');
    const replyForm = document.getElementById('replyForm');
    const chatConversationIdInput = document.getElementById('chatConversationId');
    const replyMessageInput = document.getElementById('replyMessageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');

    // New Conversation Modal Elements
    const newConversationModal = document.getElementById('newConversationModal');
    const closeNewConversationModal = document.getElementById('closeNewConversationModal');
    const newConversationForm = document.getElementById('newConversationForm');

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
            handleLogout();
            throw new Error('Session expired.');
        }
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        return response.json();
    }

    // --- Welcome & Logout ---
    const studentName = localStorage.getItem('studentName');
    if (welcomeMessageElement && studentName) {
        welcomeMessageElement.textContent = `Welcome, ${studentName}!`;
    }
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    function handleLogout() {
        if(pollingInterval) clearInterval(pollingInterval); // Stop polling on logout
        localStorage.removeItem('studentAuthToken');
        localStorage.removeItem('studentName');
        window.location.href = 'student-login.html';
    }

    // --- Data Fetching ---
    async function fetchMyRecord() {
        try {
            const record = await fetchApi('http://localhost:3000/api/student/my-record');
            myRecordDetailsDiv.innerHTML = `
                <h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Personal & Academic</h3>
                <div class="record-item"><span class="record-label">Full Name:</span> <span class="record-value">${record.fullName || 'N/A'}</span></div>
                <div class="record-item"><span class="record-label">Matric No:</span> <span class="record-value">${record.matric_no || 'N/A'}</span></div>
                <div class="record-item"><span class="record-label">Medical No:</span> <span class="record-value">${record.medical_number || 'N/A'}</span></div>
                <div class="record-item"><span class="record-label">Department:</span> <span class="record-value">${record.department || 'N/A'}</span></div>
                <div class="record-item"><span class="record-label">Faculty:</span> <span class="record-value">${record.faculty || 'N/A'}</span></div>
                <div class="record-item"><span class="record-label">Level:</span> <span class="record-value">${record.level || 'N/A'}</span></div>
                <h3 class="text-lg font-semibold mt-6 mb-2" style="color: var(--text-primary);">Health Profile</h3>
                <div class="record-item"><span class="record-label">Gender:</span> <span class="record-value">${record.gender || 'N/A'}</span></div>
                <div class="record-item"><span class="record-label">Age:</span> <span class="record-value">${record.age || 'N/A'}</span></div>
                <div class="record-item"><span class="record-label">Genotype:</span> <span class="record-value">${record.genotype || 'N/A'}</span></div>
                <div class="record-item"><span class="record-label">Allergies:</span> <span class="record-value">${record.allergies || 'N/A'}</span></div>
                <div class="record-item"><span class="record-label">Health Status:</span> <span class="record-value">${record.healthStatus || 'N/A'}</span></div>
                <h3 class="text-lg font-semibold mt-6 mb-2" style="color: var(--text-primary);">Medical History</h3>
                <div class="record-item flex-col items-start"><span class="record-label mb-1">Medical History:</span> <span class="record-value text-left w-full">${record.medicalHistory || 'N/A'}</span></div>
                <div class="record-item flex-col items-start"><span class="record-label mb-1">General Complaints:</span> <span class="record-value text-left w-full">${record.healthComplaints || 'N/A'}</span></div>
            `;
        } catch (error) {
            console.error('Error fetching student record:', error);
            myRecordDetailsDiv.innerHTML = `<p class="text-red-500">Could not load your record.</p>`;
        }
    }

    async function fetchConversations() {
        try {
            const conversations = await fetchApi('http://localhost:3000/api/conversations/student');
            currentConversations = conversations;
            populateConversationSelector(currentConversations);
            const conversationToShow = activeConversationId ? activeConversationId : (conversations[0]?._id || null);
            if (conversationToShow) {
                openChat(conversationToShow);
            } else {
                showPlaceholder();
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
            chatMessagesDiv.innerHTML = `<p class="m-auto text-red-500">Could not load conversations.</p>`;
        }
    }
    
    // --- UI Rendering ---
    function populateConversationSelector(conversations) {
        if (!conversationSelector) return;
        const selectedId = conversationSelector.value;
        conversationSelector.innerHTML = '';
        if (conversations.length === 0) {
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "No conversations yet";
            conversationSelector.appendChild(option);
            return;
        }
        conversations.forEach(convo => {
            const option = document.createElement('option');
            option.value = convo._id;
            option.textContent = `${convo.subject} (${convo.status})`;
            conversationSelector.appendChild(option);
        });
        conversationSelector.value = selectedId;
    }

    function renderChatMessages(messages) {
        if (!chatMessagesDiv) return;
        chatMessagesDiv.innerHTML = '';
        if(!messages || messages.length === 0) {
            chatMessagesDiv.innerHTML = `<p class="m-auto" style="color: var(--text-secondary);">No messages in this conversation yet.</p>`;
            return;
        }
        messages.forEach(msg => {
            const messageWrapper = document.createElement('div');
            messageWrapper.className = `message-wrapper ${msg.sender.toLowerCase()}`;
            const messageBubble = document.createElement('div');
            const timestamp = new Date(msg.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', hour12: true });
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
        if (!conversation) { showPlaceholder(); return; }
        
        activeConversationId = conversationId;
        conversationSelector.value = conversationId;
        chatConversationIdInput.value = conversation._id;
        renderChatMessages(conversation.messages);
        replyMessageInput.disabled = false;
        sendMessageBtn.disabled = false;

        startPollingForMessages(conversationId); // Start polling when a chat is opened
    }
    
    function showPlaceholder() {
        activeConversationId = null;
        chatMessagesDiv.innerHTML = `<p class="m-auto" style="color: var(--text-secondary);">Please select a conversation to view messages.</p>`;
        replyMessageInput.disabled = true;
        sendMessageBtn.disabled = true;
        if(conversationSelector) conversationSelector.value = "";
        if (pollingInterval) clearInterval(pollingInterval); // Stop polling
    }

    if(conversationSelector) {
        conversationSelector.addEventListener('change', (e) => {
            const selectedId = e.target.value;
            if (selectedId) openChat(selectedId);
            else showPlaceholder();
        });
    }

    if(replyForm) {
        replyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const conversationId = chatConversationIdInput.value;
            const message = replyMessageInput.value.trim();
            if (!message || !conversationId) return;
            try {
                const updatedConversation = await fetchApi(`http://localhost:3000/api/conversations/${conversationId}/messages`, {
                    method: 'POST',
                    body: JSON.stringify({ message })
                });
                const index = currentConversations.findIndex(c => c._id === conversationId);
                currentConversations[index] = updatedConversation;
                renderChatMessages(updatedConversation.messages);
                replyMessageInput.value = '';
            } catch (error) {
                console.error('Error sending reply:', error);
                alert('Could not send reply.');
            }
        });
    }

    // New Conversation Modal Logic
    if(newConversationBtn) newConversationBtn.addEventListener('click', () => newConversationModal.classList.add('active'));
    if(closeNewConversationModal) closeNewConversationModal.addEventListener('click', () => newConversationModal.classList.remove('active'));
    if(newConversationModal) {
        newConversationModal.addEventListener('click', (e) => {
            if (e.target === newConversationModal) newConversationModal.classList.remove('active');
        });
    }

    if(newConversationForm) {
        newConversationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const subject = document.getElementById('subjectInput').value.trim();
            const message = document.getElementById('messageInput').value.trim();
            if (!subject || !message) { alert('Subject and message are required.'); return; }
            try {
                const newConvo = await fetchApi('http://localhost:3000/api/conversations/student', {
                    method: 'POST',
                    body: JSON.stringify({ subject, message })
                });
                newConversationForm.reset();
                newConversationModal.classList.remove('active');
                await fetchConversations(); 
                openChat(newConvo._id); 
            } catch (error) {
                console.error('Error starting conversation:', error);
                alert('Could not start new conversation.');
            }
        });
    }

    // --- Polling Functions ---
    function startPollingForMessages(conversationId) {
        if (pollingInterval) clearInterval(pollingInterval);
        pollingInterval = setInterval(() => {
            pollForNewMessages(conversationId);
        }, 5000); // Check for new messages every 5 seconds
    }

    async function pollForNewMessages(conversationId) {
        if (document.hidden || activeConversationId !== conversationId) return; 
        try {
            const conversationOnServer = await fetchApi(`http://localhost:3000/api/conversations/${conversationId}`);
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
    fetchMyRecord();
    fetchConversations(); 
});
