document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
    });

    const sendMessage = async () => {
        const message = userInput.value.trim();
        if (!message) return;

        addMessageToChat(message, 'user');

        userInput.value = '';
        userInput.style.height = 'auto';

        const loadingId = showLoadingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userMessage: message })
            });

            removeLoadingIndicator(loadingId);

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    addMessageToChat(data.response, 'bot');
                } else {
                    addMessageToChat('Yanıt alınırken bir hata oluştu.', 'bot');
                }
            } else {
                addMessageToChat('Sunucu ile iletişim kurulurken bir hata oluştu.', 'bot');
            }
        } catch (error) {
            console.error('Error:', error);
            removeLoadingIndicator(loadingId);
            addMessageToChat('Bir hata oluştu, lütfen tekrar deneyin.', 'bot');
        }
    };

    const addMessageToChat = (text, sender) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        const paragraph = document.createElement('p');
        paragraph.textContent = text;

        contentDiv.appendChild(paragraph);
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);

        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const showLoadingIndicator = () => {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message bot-message loading-indicator';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const dotsDiv = document.createElement('div');
        dotsDiv.className = 'loading-dots';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            dotsDiv.appendChild(dot);
        }
        
        contentDiv.appendChild(dotsDiv);
        loadingDiv.appendChild(contentDiv);
        chatMessages.appendChild(loadingDiv);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return loadingDiv.id = 'loading-' + Date.now();
    };

    const removeLoadingIndicator = (id) => {
        const loadingElement = document.getElementById(id);
        if (loadingElement) {
            loadingElement.remove();
        }
    };

    sendButton.addEventListener('click', sendMessage);
    
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});