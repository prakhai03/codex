import { getAIProvider } from './aiProviders.js';
import { onStdoutChange } from './ide.js';

export default function initChatbot(container) {
    // Create the chatbot HTML structure
    container.innerHTML = `
        <div class="chatbot-container">
            <div class="chat-messages" id="chat-messages"></div>
            <div class="chat-input-container">
                <div class="dropdown">
                    <button id="chat-model-toggle" class="chat-model-toggle" title="Change Model">
                        <svg class="svg-icon" style="width: 1em; height: 1em;vertical-align: middle;fill: currentColor;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                            <path d="M512 287.938L63.877 736.06h896.246z" />
                        </svg>
                        <span id="chat-model-name" class="chat-model-name"> AI-Model </span>
                    </button>
                    <div class="dropdown-content">
                        <a href="#" class="selected">ChatGPT ✓</a>
                        <a href="#">Deepseek</a>
                        <a href="#">Gemini</a>
                    </div>
                </div>
                <textarea 
                    id="chat-input" 
                    placeholder="Ask a question..."
                    rows="1"
                    class="chat-input"
                ></textarea>
                <button id="chat-submit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/>
                    </svg>
                </button>
            </div>
        </div>
    `;

    // Add necessary styles
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '../css/chatbot.css';
    document.head.appendChild(link);

    // Auto-resize textarea as user types
    const textarea = container.querySelector('#chat-input');
    textarea.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 150) + 'px';
    });

    // Handle enter key to submit (Shift+Enter for new line)
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            // Submit logic will go here
        }
    });

    // Add state tracking for selected model
    let currentModel = 'chatgpt'; // Default model

    const modelToggle = container.querySelector('#chat-model-toggle');
    const dropdownContent = container.querySelector('.dropdown-content');

    // Add click handlers for dropdown options
    const options = dropdownContent.querySelectorAll('a');
    options.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            const selectedModel = e.target.textContent.replace(' ✓', '').toLowerCase();
            currentModel = selectedModel;
            dropdownContent.classList.remove('show');


            // Update the selected option styling and add tick mark
            options.forEach(a => {
                a.classList.remove('selected');
                a.textContent = a.textContent.replace(' ✓', '');
            });
            e.target.classList.add('selected');
            e.target.textContent = e.target.textContent + ' ✓';
            console.log(currentModel);
        });
    });

    modelToggle.addEventListener('click', () => {
        dropdownContent.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    window.addEventListener('click', (event) => {
        if (!event.target.matches('.chat-model-toggle') &&
            !event.target.closest('.chat-model-toggle')) {
            if (dropdownContent.classList.contains('show')) {
                dropdownContent.classList.remove('show');
            }
        }
    });

    // Add message handling
    const messagesContainer = container.querySelector('#chat-messages');

    async function addMessage(message, isUser = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isUser ? 'user' : 'ai'}`;
        let entity = isUser ? 'You' : 'AI';
        messageDiv.textContent = entity + ': ' + message;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

    }



    async function handleSubmit(isError = false, errorMessage = '') {
        let input = '';
        if (!isError) {
            input = textarea.value.trim();
        } else {
            input = errorMessage;
        }


        if (!input) return;


        // Clear input
        textarea.value = '';
        textarea.style.height = 'auto';

        // Add user message
        await addMessage(input, true);

        try {

            // Get the selected AI provider and send message with context
            const provider = getAIProvider(currentModel);
            const response = await provider.sendMessage(input);

            // Add AI response
            await addMessage(response, false);
        } catch (error) {
            console.error('Error:', error);
            await addMessage('Sorry, there was an error processing your request.', false);
        }
    }

    // Add submit button handler
    const submitButton = container.querySelector('#chat-submit');
    submitButton.addEventListener('click', handleSubmit);

    // Update the enter key handler
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    });

    // Subscribe to changes
    const unsubscribe = onStdoutChange((newOutput) => {
        console.log('Output changed to:', newOutput);
        // Do something with newOutput
        if (newOutput.includes('error') || newOutput.includes('Error')) {
            console.log('Error detected');
            const errorMessage = 'This is the error message: ' + newOutput + '\n\nPlease suggest fixes for the error.';
            handleSubmit(true, errorMessage);
        }

    });
    return () => {
        unsubscribe(); // Clean up when chatbot is destroyed
    };

}
