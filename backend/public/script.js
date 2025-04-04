document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    
    let sessionId = localStorage.getItem('chatSessionId');
    
    const loadSavedMessages = () => {
        const savedMessages = localStorage.getItem('chatMessages');
        if (savedMessages) {
            try {
                const messages = JSON.parse(savedMessages);
                messages.forEach(msg => {
                    addMessageToChat(msg.text, msg.sender, false);
                });
                chatMessages.scrollTop = chatMessages.scrollHeight;
            } catch (e) {
                console.error('Mesajlar yüklenemedi:', e);
                localStorage.removeItem('chatMessages');
            }
        }
    };
    
    loadSavedMessages();
    
    const saveMessages = () => {
        const messages = [];
        document.querySelectorAll('.message').forEach(messageDiv => {
            const text = messageDiv.querySelector('p')?.textContent || '';
            const sender = messageDiv.classList.contains('user-message') ? 'user' : 'bot';
            messages.push({ text, sender });
        });
        
        localStorage.setItem('chatMessages', JSON.stringify(messages));
    };

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
        
        document.querySelectorAll('.error-message').forEach(el => el.remove());

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    userMessage: message,
                    sessionId: sessionId
                })
            });

            removeLoadingIndicator(loadingId);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success) {
                    if (data.sessionId) {
                        sessionId = data.sessionId;
                        localStorage.setItem('chatSessionId', sessionId);
                    }
                    
                    addMessageToChat(data.response, 'bot');
                } else {
                    showError(data.message || 'Yanıt alınırken bir hata oluştu.');
                }
            } else {
                const errorData = await response.json();
                showError(errorData.message || 'Sunucu ile iletişim kurulurken bir hata oluştu.');
            }
        } catch (error) {
            console.error('Error:', error);
            removeLoadingIndicator(loadingId);
            showError('Bağlantı hatası, lütfen internet bağlantınızı kontrol edin.');
        }
    };

    const addMessageToChat = (text, sender, shouldSave = true) => {
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
        
        if (shouldSave) {
            saveMessages();
        }
    };
    
    const showError = (message) => {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message bot-message error-message';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content error';
        
        const paragraph = document.createElement('p');
        paragraph.textContent = `❌ Hata: ${message}`;
        
        contentDiv.appendChild(paragraph);
        errorDiv.appendChild(contentDiv);
        chatMessages.appendChild(errorDiv);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        saveMessages();
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
        loadingDiv.id = 'loading-' + Date.now();
        chatMessages.appendChild(loadingDiv);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return loadingDiv.id;
    };

    const removeLoadingIndicator = (id) => {
        const loadingElement = document.getElementById(id);
        if (loadingElement) {
            loadingElement.remove();
        }
    };
    
    const addClearButton = () => {
        const clearButton = document.createElement('button');
        clearButton.id = 'clear-chat';
        clearButton.innerHTML = '<i class="fa-solid fa-trash"></i>';
        clearButton.title = 'Sohbeti temizle';
        
        clearButton.addEventListener('click', () => {
            if (confirm('Tüm sohbet geçmişini silmek istediğinizden emin misiniz?')) {
                while (chatMessages.firstChild) {
                    chatMessages.removeChild(chatMessages.firstChild);
                }
                
                addMessageToChat('Merhaba! Ben Groq destekli bir chatbot\'um. Bana bir şeyler sorabilirsin.', 'bot');
                
                localStorage.removeItem('chatMessages');
                localStorage.removeItem('chatSessionId');
                sessionId = null;
            }
        });
        
        const style = document.createElement('style');
        style.textContent = `
            #clear-chat {
                position: absolute;
                top: 16px;
                right: 16px;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            #clear-chat:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            .chat-header {
                position: relative;
            }
            .error {
                background-color: #fff8f8 !important;
                border-left: 3px solid #e74c3c !important;
                color: #e74c3c !important;
            }
        `;
        
        document.head.appendChild(style);
        document.querySelector('.chat-header').appendChild(clearButton);
    };
    
    addClearButton();

    sendButton.addEventListener('click', sendMessage);
    
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});