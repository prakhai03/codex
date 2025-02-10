// API key management (you might want to handle this differently in production)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

class AIProvider {
    async sendMessage(message, sourceCode = '') {
        throw new Error('sendMessage must be implemented');
    }
}

class ChatGPTProvider extends AIProvider {
    async sendMessage(message, sourceCode = '') {
        try {
            let contextMessage = message;
            if (sourceCode) {
                contextMessage = `Context (current source code):
\`\`\`
${sourceCode}
\`\`\`

User question: ${message}`;
            }

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4',
                    messages: [
                        { 
                            role: 'system', 
                            content: 'You are a helpful programming tutor. When referencing the provided source code in your answers, be specific about line numbers and code sections. You will practice the socratic method of teaching, by asking questions and guiding the student to the answer. You will answer the question explicitly, and only then give the student the opportunity to answer. You will not give the student the answer outright, but rather guide them to it.'
                        },
                        { role: 'user', content: contextMessage }
                    ]
                })
            });

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('ChatGPT API Error:', error);
            throw error;
        }
    }
}

class DeepseekProvider extends AIProvider {
    async sendMessage(message, sourceCode = '') {
        try {
            let contextMessage = message;
            if (sourceCode) {
                contextMessage = `Context (current source code):
\`\`\`
${sourceCode}
\`\`\`

User question: ${message}`;
            }

            const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful programming tutor. When referencing the provided source code in your answers, be specific about line numbers and code sections. You will practice the socratic method of teaching, by asking questions and guiding the student to the answer. You will answer the question explicitly, and only then give the student the opportunity to answer. You will not give the student the answer outright, but rather guide them to it.'
                        },
                        { role: 'user', content: contextMessage }
                    ]
                })
            });

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Deepseek API Error:', error);
            throw error;
        }
    }
}

class GeminiProvider extends AIProvider {
    async sendMessage(message, sourceCode = '') {
        try {
            let contextMessage = message;
            if (sourceCode) {
                contextMessage = `Context (current source code):
\`\`\`
${sourceCode}
\`\`\`

User question: ${message}`;
            }

            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GEMINI_API_KEY}`
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [
                                {
                                    text: 'You are a helpful programming assistant. When referencing the provided source code in your answers, be specific about line numbers and code sections.'
                                }
                            ]
                        },
                        {
                            role: 'user',
                            parts: [
                                {
                                    text: contextMessage
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    },
                })
            });

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw error;
        }
    }
}

// Factory function to get the appropriate provider
export function getAIProvider(provider) {
    switch (provider.toLowerCase()) {
        case 'chatgpt':
            return new ChatGPTProvider();
        case 'deepseek':
            return new DeepseekProvider();
        case 'gemini':
            return new GeminiProvider();
        default:
            throw new Error(`Unknown AI provider: ${provider}`);
    }
} 