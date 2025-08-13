/**
 * Redis AI Agent Builder JavaScript
 * Handles chat interface and code generation
 */

(function() {
    'use strict';

    // Configuration and conversation flow
    const CONFIG = {
        agentTypes: {
            recommendation: {
                name: "Recommendation Engine",
                description: "Creates an agent that recommends products based on user queries using Redis vector search and similarity matching.",
                features: ["Vector similarity search", "Product recommendations", "User preference learning"],
                keywords: ["recommendation", "recommend", "product", "suggest", "ecommerce", "shopping"]
            },
            conversational: {
                name: "Conversational Assistant",
                description: "A chatbot that maintains conversation history using semantic message history and provides contextual responses.",
                features: ["Conversation memory", "Context awareness", "Multi-turn dialogue"],
                keywords: ["chat", "conversation", "assistant", "bot", "chatbot", "talk", "dialogue"]
            }
        },
        languages: {
            python: {
                name: "Python",
                description: "Python with redis-py and popular AI libraries. Great for beginners and rapid prototyping.",
                dependencies: ["redis", "openai", "numpy", "python-dotenv"],
                keywords: ["python", "py", "beginner", "simple", "data science", "ml", "machine learning"]
            },
            javascript: {
                name: "JavaScript (Node.js)",
                description: "Node.js with redis client and AI SDKs. Perfect for web applications and APIs.",
                dependencies: ["redis", "openai", "dotenv", "express"],
                keywords: ["javascript", "js", "node", "nodejs", "web", "api", "frontend"]
            },
            java: {
                name: "Java",
                description: "Java with Jedis Redis client and enterprise-grade AI integrations.",
                dependencies: ["jedis", "okhttp", "jackson", "slf4j"],
                keywords: ["java", "enterprise", "spring", "scalable", "production"]
            },
            csharp: {
                name: "C#",
                description: "C# with StackExchange.Redis and .NET AI libraries for enterprise applications.",
                dependencies: ["StackExchange.Redis", "Microsoft.Extensions.AI", "Newtonsoft.Json"],
                keywords: ["c#", "csharp", "dotnet", ".net", "microsoft", "enterprise"]
            }
        },
        models: {
            openai: {
                name: "OpenAI (GPT-4, GPT-3.5)",
                description: "Industry-leading models with excellent performance. Requires API key and usage-based pricing.",
                models: ["gpt-4", "gpt-3.5-turbo", "text-embedding-ada-002"],
                keywords: ["openai", "gpt", "gpt-4", "chatgpt", "popular", "best"],
                defaultModel: "gpt-4",
                baseUrl: "https://api.openai.com/v1/"
            },
            anthropic: {
                name: "Anthropic (Claude)",
                description: "Claude models known for safety and reasoning capabilities. Requires API key.",
                models: ["claude-3-opus", "claude-3-sonnet", "claude-instant"],
                keywords: ["anthropic", "claude", "safe", "reasoning", "ethical"],
                defaultModel: "claude-3-5-sonnet-latest",
                baseUrl: "https://api.anthropic.com/v1/"
            },
            llama3: {
                name: "Llama 3",
                description: "Open-source model that can run locally or on your infrastructure. No API costs.",
                models: ["llama3:8b", "llama3:70b"],
                keywords: ["llama", "llama3", "open source", "free", "local", "self-hosted"],
                defaultModel: "llama3:latest",
                baseUrl: "http://localhost:11434/v1/"
            }
        }
    };

    // Conversation state
    let conversationState = {
        step: 'agent-type', // agent-type, language, model, generate
        selections: {},
        currentSuggestions: []
    };

    // Code chat state
    let codeChatState = {
        apiKey: null,
        hasAskedForKey: false,
        conversationHistory: []
    };

    // DOM elements
    let elements = {};

    // Initialize the agent builder
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Get DOM elements
        elements = {
            chatContainer: document.getElementById('chat-container'),
            chatMessages: document.getElementById('chat-messages'),
            chatInput: document.getElementById('chat-input'),
            sendButton: document.getElementById('send-button'),
            suggestionsDropdown: document.getElementById('suggestions-dropdown'),
            codeSection: document.getElementById('generated-code-section'),
            generatedCode: document.getElementById('generated-code'),
            copyBtn: document.getElementById('copy-code-btn'),
            downloadBtn: document.getElementById('download-code-btn'),
            tryJupyterBtn: document.getElementById('try-jupyter-btn'),
            chatAboutCodeBtn: document.getElementById('chat-about-code-btn'),
            startAgainBtn: document.getElementById('start-again-btn'),
            codeChatSection: document.getElementById('code-chat-section'),
            codeChatContainer: document.getElementById('code-chat-container'),
            codeChatMessages: document.getElementById('code-chat-messages'),
            codeChatInput: document.getElementById('code-chat-input'),
            codeChatSend: document.getElementById('code-chat-send'),
            closeCodeChatBtn: document.getElementById('close-code-chat-btn')
        };

        // Check if elements exist (shortcode might not be on this page)
        if (!elements.chatContainer) return;

        // Check if Markdown library is available
        if (!window.marked) {
            console.warn('Marked library not loaded - chat messages will use plain text formatting');
        }

        // Set up event listeners
        setupEventListeners();
    }

    function setupEventListeners() {
        // Chat input events
        elements.chatInput.addEventListener('input', handleInputChange);
        elements.chatInput.addEventListener('keydown', handleKeyDown);
        elements.chatInput.addEventListener('keydown', preventSearchModalOnSlash);
        elements.sendButton.addEventListener('click', handleSendMessage);

        // Suggestion chip clicks
        elements.chatMessages.addEventListener('click', handleSuggestionClick);

        // Suggestions dropdown
        elements.suggestionsDropdown.addEventListener('click', handleSuggestionSelect);

        // Code actions will be attached when the code section becomes visible
        // This prevents issues with hidden elements during initial page load
    }

    // Chat interface functions
    function handleInputChange() {
        const input = elements.chatInput.value.trim();
        elements.sendButton.disabled = input.length === 0;

        if (input.length > 0) {
            showSuggestions(input);
        } else {
            hideSuggestions();
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        } else if (e.key === 'Escape') {
            hideSuggestions();
        }
    }

    function preventSearchModalOnSlash(event) {
        // Prevent the global search modal from opening when typing "/" in the chat input
        if (event.key === '/') {
            event.stopPropagation();
        }
    }

    function handleSendMessage() {
        const input = elements.chatInput.value.trim();
        if (!input) return;

        // Add user message
        addMessage(input, 'user');

        // Clear input
        elements.chatInput.value = '';
        elements.sendButton.disabled = true;
        hideSuggestions();

        // Process the message
        processUserMessage(input);
    }

    function handleSuggestionClick(e) {
        const suggestionChip = e.target.closest('.suggestion-chip');
        if (suggestionChip) {
            const suggestion = suggestionChip.dataset.suggestion;
            processSelection(suggestion);
        }
    }

    function handleSuggestionSelect(e) {
        const suggestionItem = e.target.closest('.suggestion-item');
        if (suggestionItem) {
            const suggestion = suggestionItem.dataset.value;
            elements.chatInput.value = suggestion;
            hideSuggestions();
            handleSendMessage();
        }
    }

    function addMessage(content, type, suggestions = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}-message`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';

        if (type === 'bot') {
            avatar.innerHTML = `
                <svg class="w-6 h-6 text-redis-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
            `;
        } else {
            avatar.innerHTML = `
                <svg class="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
            `;
        }

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = `<p>${content}</p>`;

        if (suggestions) {
            const chipsDiv = document.createElement('div');
            chipsDiv.className = 'suggestion-chips';
            suggestions.forEach(suggestion => {
                const chip = document.createElement('button');
                chip.className = 'suggestion-chip';
                chip.dataset.suggestion = suggestion.value;
                chip.textContent = suggestion.label;
                chipsDiv.appendChild(chip);
            });
            messageContent.appendChild(chipsDiv);
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        elements.chatMessages.appendChild(messageDiv);

        // Scroll to bottom
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }

    function showSuggestions(input) {
        const suggestions = getSuggestionsForCurrentStep(input);
        if (suggestions.length === 0) {
            hideSuggestions();
            return;
        }

        const suggestionsList = elements.suggestionsDropdown.querySelector('.suggestions-list');
        suggestionsList.innerHTML = '';

        suggestions.forEach(suggestion => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.dataset.value = suggestion.value;
            item.innerHTML = `
                <span>${suggestion.icon}</span>
                <span>${suggestion.label}</span>
            `;
            suggestionsList.appendChild(item);
        });

        elements.suggestionsDropdown.classList.remove('agent-builder-hidden');
    }

    function hideSuggestions() {
        elements.suggestionsDropdown.classList.add('agent-builder-hidden');
    }

    function getSuggestionsForCurrentStep(input) {
        const lowerInput = input.toLowerCase();
        let suggestions = [];

        switch (conversationState.step) {
            case 'agent-type':
                suggestions = Object.entries(CONFIG.agentTypes).map(([key, config]) => ({
                    value: key,
                    label: config.name,
                    icon: key === 'recommendation' ? '🛍️' : '💬'
                })).filter(s =>
                    s.label.toLowerCase().includes(lowerInput) ||
                    CONFIG.agentTypes[s.value].keywords.some(k => k.includes(lowerInput))
                );
                break;

            case 'language':
                suggestions = Object.entries(CONFIG.languages).map(([key, config]) => ({
                    value: key,
                    label: config.name,
                    icon: '💻'
                })).filter(s =>
                    s.label.toLowerCase().includes(lowerInput) ||
                    CONFIG.languages[s.value].keywords.some(k => k.includes(lowerInput))
                );
                break;

            case 'model':
                suggestions = Object.entries(CONFIG.models).map(([key, config]) => ({
                    value: key,
                    label: config.name,
                    icon: '🤖'
                })).filter(s =>
                    s.label.toLowerCase().includes(lowerInput) ||
                    CONFIG.models[s.value].keywords.some(k => k.includes(lowerInput))
                );
                break;
        }

        return suggestions.slice(0, 5); // Limit to 5 suggestions
    }

    function processUserMessage(input) {
        // Simulate thinking delay
        setTimeout(() => {
            const lowerInput = input.toLowerCase();

            switch (conversationState.step) {
                case 'agent-type':
                    processAgentTypeSelection(lowerInput);
                    break;
                case 'language':
                    processLanguageSelection(lowerInput);
                    break;
                case 'model':
                    processModelSelection(lowerInput);
                    break;
            }
        }, 500);
    }

    function processSelection(selection) {
        conversationState.selections[conversationState.step] = selection;

        switch (conversationState.step) {
            case 'agent-type':
                processAgentTypeSelection(selection);
                break;
            case 'language':
                processLanguageSelection(selection);
                break;
            case 'model':
                processModelSelection(selection);
                break;
        }
    }

    function processAgentTypeSelection(input) {
        let selectedType = null;

        // Check if input matches a type directly
        if (CONFIG.agentTypes[input]) {
            selectedType = input;
        } else {
            // Search by keywords
            for (const [key, config] of Object.entries(CONFIG.agentTypes)) {
                if (config.keywords.some(keyword => input.includes(keyword))) {
                    selectedType = key;
                    break;
                }
            }
        }

        if (selectedType) {
            conversationState.selections.agentType = selectedType;
            const config = CONFIG.agentTypes[selectedType];

            // Generate a default agent name based on the type
            const defaultNames = {
                recommendation: 'RecommendationEngine',
                conversational: 'ConversationalAgent'
            };
            conversationState.selections.agentName = defaultNames[selectedType] || 'RedisAgent';

            addMessage(`Great! I'll help you build a ${config.name}. ${config.description}`, 'bot');

            // Move to language selection step
            conversationState.step = 'language';
            addMessage('Which programming language would you like to use?', 'bot', [
                { value: 'python', label: '🐍 Python' },
                { value: 'javascript', label: '🟨 JavaScript' },
                { value: 'java', label: '☕ Java' },
                { value: 'csharp', label: '🔷 C#' }
            ]);
        } else {
            addMessage("I didn't understand that. Please choose one of the agent types:", 'bot', [
                { value: 'recommendation', label: '🛍️ Recommendation Engine' },
                { value: 'conversational', label: '💬 Conversational Assistant' }
            ]);
        }
    }



    function processLanguageSelection(input) {
        let selectedLang = null;

        // Handle special responses from coming soon message
        if (input === 'wait') {
            addMessage('Thanks for checking out the Redis AI Agent Builder. Come back when your preferred language is supported!', 'bot');
            return;
        }

        if (CONFIG.languages[input]) {
            selectedLang = input;
        } else {
            for (const [key, config] of Object.entries(CONFIG.languages)) {
                if (config.keywords.some(keyword => input.includes(keyword))) {
                    selectedLang = key;
                    break;
                }
            }
        }

        if (selectedLang) {
            // Check if it's Python (fully supported)
            if (selectedLang === 'python') {
                conversationState.selections.programmingLanguage = selectedLang;
                const config = CONFIG.languages[selectedLang];

                addMessage(`Excellent choice! ${config.description}`, 'bot');

                // Move to next step
                conversationState.step = 'model';
                addMessage('Finally, which AI model would you like to use?', 'bot', [
                    { value: 'openai', label: '🤖 OpenAI (GPT-4)' },
                    { value: 'anthropic', label: '🧠 Anthropic (Claude)' },
                    { value: 'llama3', label: '🦙 Llama 3' }
                ]);
            } else {
                // Handle other languages with coming soon message
                const config = CONFIG.languages[selectedLang];
                const languageName = config.name;

                addMessage(`${languageName} support is coming soon. Currently, only Python is fully supported.`, 'bot');
                addMessage(`Would you like to build a Python agent instead?`, 'bot', [
                    { value: 'python', label: 'Yes, use Python' },
                    { value: 'wait', label: 'I\'ll wait for ' + languageName }
                ]);
            }
        } else {
            addMessage("I didn't recognize that language. Please choose from:", 'bot', [
                { value: 'python', label: '🐍 Python' },
                { value: 'javascript', label: '🟨 JavaScript' },
                { value: 'java', label: '☕ Java' },
                { value: 'csharp', label: '🔷 C#' }
            ]);
        }
    }

    function processModelSelection(input) {
        let selectedModel = null;

        if (CONFIG.models[input]) {
            selectedModel = input;
        } else {
            for (const [key, config] of Object.entries(CONFIG.models)) {
                if (config.keywords.some(keyword => input.includes(keyword))) {
                    selectedModel = key;
                    break;
                }
            }
        }

        if (selectedModel) {
            conversationState.selections.llmModel = selectedModel;
            const config = CONFIG.models[selectedModel];

            addMessage(`Perfect! ${config.description}`, 'bot');
            addMessage('🎉 I have everything I need! Generating your Redis AI agent code...', 'bot');

            // Generate code
            setTimeout(() => {
                generateAndDisplayCode();
            }, 1500);
        } else {
            addMessage("I didn't recognize that model. Please choose from:", 'bot', [
                { value: 'openai', label: '🤖 OpenAI (GPT-4)' },
                { value: 'anthropic', label: '🧠 Anthropic (Claude)' },
                { value: 'llama3', label: '🦙 Llama 3' }
            ]);
        }
    }

    function generateAndDisplayCode() {
        const code = generateAgentCode(conversationState.selections);

        addMessage('✅ Your Redis AI agent code is ready! You can copy or download it below.', 'bot');

        // Show code section
        displayGeneratedCode(code, conversationState.selections);
    }

    function generateAgentCode(formData) {
        // This is a placeholder implementation
        // In a real implementation, this would call an API or use templates
        const genericTemplates = {
            python: getGenericPythonCode,
            javascript: getGenericJavaScriptCode,
            java: getGenericJavaCode,
            csharp: getGenericCSharpCode
        };

        const fileExtensions = {
            python: '.py',
            javascript: '.js',
            java: '.java',
            csharp: '.cs'
        };

        const filename = `/code/agent-templates/${formData.programmingLanguage}/${formData.agentType}_agent${fileExtensions[formData.programmingLanguage]}`;

        return loadTemplateFile(filename, formData) || genericTemplates[formData.programmingLanguage](formData);
    }

    function loadTemplateFile(filename, formData) {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', filename, false); // Synchronous request
            xhr.send();

            if (xhr.status === 200) {
                let templateContent = xhr.responseText;

                // Replace template variables
                templateContent = templateContent.replace(/\$\{formData\.agentName\}/g, formData.agentName);
                templateContent = templateContent.replace(/\$\{CONFIG\.agentTypes\[formData\.agentType\]\.description\}/g,
                    CONFIG.agentTypes[formData.agentType].description);
                templateContent = templateContent.replace(/\$\{AgentClassName\}/g, formData.agentName.replace(/\s+/g, ''));
                templateContent = templateContent.replace(/\$\{formData\.agentType\}/g, formData.agentType);
                templateContent = templateContent.replace(/\$\{formData\.llmModel\.toUpperCase\(\)\}/g, formData.llmModel.toUpperCase());
                templateContent = templateContent.replace(/\$\{formData\.llmModel\.toLowerCase\(\)\}/g, formData.llmModel.toLowerCase());
                templateContent = templateContent.replace(/\$\{CONFIG\.models\[formData\.llmModel\]\.defaultModel\}/g,
                    CONFIG.models[formData.llmModel].defaultModel);
                templateContent = templateContent.replace(/\$\{CONFIG\.models\[formData\.llmModel\]\.baseUrl\}/g,
                    CONFIG.models[formData.llmModel].baseUrl);

                return templateContent;
            } else {
                console.log(`Template file not found: ${filename} (${xhr.status})`);
            }
        } catch (error) {
            console.log(`Could not load template file ${filename}:`, error);
        }

        return null; // Return null if file loading failed
    }

    function getGenericPythonCode(formData) {
        return `# ${formData.agentName} - Redis AI Agent
# Generated for ${CONFIG.agentTypes[formData.agentType].description}

import redis
import os
from typing import List, Dict, Any

class ${formData.agentName.replace(/\s+/g, '')}:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            decode_responses=True
        )
        self.llm_api_key = os.getenv('${formData.llmModel.toUpperCase()}_API_KEY')

    def process_query(self, query: str) -> Dict[str, Any]:
        """Process user query and return response"""
        # TODO: Implement ${formData.agentType} logic
        pass

    def store_data(self, key: str, data: Dict[str, Any]) -> bool:
        """Store data in Redis"""
        try:
            self.redis_client.hset(key, mapping=data)
            return True
        except Exception as e:
            print(f"Error storing data: {e}")
            return False

# Example usage
if __name__ == "__main__":
    agent = ${formData.agentName.replace(/\s+/g, '')}()
    # Add your implementation here`;
    }

    function getGenericJavaScriptCode(formData) {
        return `// ${formData.agentName} - Redis AI Agent
// Generated for ${CONFIG.agentTypes[formData.agentType].description}

const redis = require('redis');
require('dotenv').config();

class ${formData.agentName.replace(/\s+/g, '')} {
    constructor() {
        this.redisClient = redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379
        });
        this.llmApiKey = process.env.${formData.llmModel.toUpperCase()}_API_KEY;
    }

    async processQuery(query) {
        // TODO: Implement ${formData.agentType} logic
        try {
            // Your implementation here
            return { success: true, response: "Placeholder response" };
        } catch (error) {
            console.error('Error processing query:', error);
            return { success: false, error: error.message };
        }
    }

    async storeData(key, data) {
        try {
            await this.redisClient.hSet(key, data);
            return true;
        } catch (error) {
            console.error('Error storing data:', error);
            return false;
        }
    }
}

// Example usage
const agent = new ${formData.agentName.replace(/\s+/g, '')}();
module.exports = ${formData.agentName.replace(/\s+/g, '')};`;
    }

    function getGenericJavaCode(formData) {
        return `// ${formData.agentName} - Redis AI Agent
// Generated for ${CONFIG.agentTypes[formData.agentType].description}

import redis.clients.jedis.Jedis;
import java.util.Map;
import java.util.HashMap;

public class ${formData.agentName.replace(/\s+/g, '')} {
    private Jedis jedis;
    private String llmApiKey;

    public ${formData.agentName.replace(/\s+/g, '')}() {
        this.jedis = new Jedis(
            System.getenv().getOrDefault("REDIS_HOST", "localhost"),
            Integer.parseInt(System.getenv().getOrDefault("REDIS_PORT", "6379"))
        );
        this.llmApiKey = System.getenv("${formData.llmModel.toUpperCase()}_API_KEY");
    }

    public Map<String, Object> processQuery(String query) {
        // TODO: Implement ${formData.agentType} logic
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("response", "Placeholder response");
        return response;
    }

    public boolean storeData(String key, Map<String, String> data) {
        try {
            jedis.hset(key, data);
            return true;
        } catch (Exception e) {
            System.err.println("Error storing data: " + e.getMessage());
            return false;
        }
    }
}`;
    }

    function getGenericCSharpCode(formData) {
        return `// ${formData.agentName} - Redis AI Agent
// Generated for ${CONFIG.agentTypes[formData.agentType].description}

using StackExchange.Redis;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

public class ${formData.agentName.replace(/\s+/g, '')}
{
    private readonly IDatabase _database;
    private readonly string _llmApiKey;

    public ${formData.agentName.replace(/\s+/g, '')}()
    {
        var connection = ConnectionMultiplexer.Connect(
            Environment.GetEnvironmentVariable("REDIS_CONNECTION_STRING") ?? "localhost:6379"
        );
        _database = connection.GetDatabase();
        _llmApiKey = Environment.GetEnvironmentVariable("${formData.llmModel.toUpperCase()}_API_KEY");
    }

    public async Task<Dictionary<string, object>> ProcessQueryAsync(string query)
    {
        // TODO: Implement ${formData.agentType} logic
        return new Dictionary<string, object>
        {
            ["success"] = true,
            ["response"] = "Placeholder response"
        };
    }

    public async Task<bool> StoreDataAsync(string key, Dictionary<string, string> data)
    {
        try
        {
            var hash = data.Select(kvp => new HashEntry(kvp.Key, kvp.Value)).ToArray();
            await _database.HashSetAsync(key, hash);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error storing data: {ex.Message}");
            return false;
        }
    }
}`;
    }

    function displayGeneratedCode(code, formData) {
        const highlightedCode = hljs.highlight(
            code, { language: formData.programmingLanguage }
        ).value;
        elements.generatedCode.innerHTML = highlightedCode;
        elements.codeSection.classList.remove('agent-builder-hidden');

        // Make the initial wizard inactive now that code is generated
        elements.chatContainer.classList.add('agent-builder-inactive');

        // Store code for download
        elements.codeSection.dataset.code = code;
        elements.codeSection.dataset.filename = getFilename(formData);

        // Handle Jupyter button state based on selected model
        const tryJupyterBtn = document.getElementById('try-jupyter-btn');
        if (tryJupyterBtn) {
            if (formData.llmModel !== 'openai') {
                // Disable and grey out the button for non-OpenAI models
                tryJupyterBtn.disabled = true;
                tryJupyterBtn.style.backgroundColor = '#B8B8B8';
                tryJupyterBtn.style.color = '#4B4F58';
                tryJupyterBtn.style.borderColor = '#B8B8B8';
                tryJupyterBtn.style.cursor = 'not-allowed';
                tryJupyterBtn.style.opacity = '1';
                tryJupyterBtn.title = 'Coming soon';
            } else {
                // Enable the button for OpenAI models
                tryJupyterBtn.disabled = false;
                tryJupyterBtn.style.backgroundColor = '';
                tryJupyterBtn.style.color = '';
                tryJupyterBtn.style.borderColor = '';
                tryJupyterBtn.style.cursor = 'pointer';
                tryJupyterBtn.style.opacity = '1';
                tryJupyterBtn.title = 'Try your agent in a Jupyter notebook';
            }
        }

        // Attach event listeners to code action buttons now that they're visible
        attachCodeActionListeners();

        // Scroll to code section
        elements.codeSection.scrollIntoView({ behavior: 'smooth' });
    }

    function attachCodeActionListeners() {
        // Get the button elements now that the code section is visible
        const copyBtn = document.getElementById('copy-code-btn');
        const downloadBtn = document.getElementById('download-code-btn');
        const tryJupyterBtn = document.getElementById('try-jupyter-btn');
        const chatAboutCodeBtn = document.getElementById('chat-about-code-btn');

        // Attach listeners only if they haven't been attached yet
        if (copyBtn && !copyBtn.hasAttribute('data-listener-attached')) {
            copyBtn.addEventListener('click', copyCode);
            copyBtn.setAttribute('data-listener-attached', 'true');
        }

        if (downloadBtn && !downloadBtn.hasAttribute('data-listener-attached')) {
            downloadBtn.addEventListener('click', downloadCode);
            downloadBtn.setAttribute('data-listener-attached', 'true');
        }

        if (tryJupyterBtn && !tryJupyterBtn.hasAttribute('data-listener-attached')) {
            tryJupyterBtn.addEventListener('click', function(event) {
                event.preventDefault();
                tryInJupyter(event);
            });
            tryJupyterBtn.setAttribute('data-listener-attached', 'true');
        }

        if (chatAboutCodeBtn && !chatAboutCodeBtn.hasAttribute('data-listener-attached')) {
            chatAboutCodeBtn.addEventListener('click', function(event) {
                event.preventDefault();
                openCodeChat();
            });
            chatAboutCodeBtn.setAttribute('data-listener-attached', 'true');
        }

        // Add close code chat button listener
        const closeCodeChatBtn = document.getElementById('close-code-chat-btn');
        if (closeCodeChatBtn && !closeCodeChatBtn.hasAttribute('data-listener-attached')) {
            closeCodeChatBtn.addEventListener('click', function(event) {
                event.preventDefault();
                closeCodeChat();
            });
            closeCodeChatBtn.setAttribute('data-listener-attached', 'true');
        }

        // Add start again button listener
        const startAgainBtn = document.getElementById('start-again-btn');
        if (startAgainBtn && !startAgainBtn.hasAttribute('data-listener-attached')) {
            startAgainBtn.addEventListener('click', function(event) {
                event.preventDefault();
                resetWizard();
            });
            startAgainBtn.setAttribute('data-listener-attached', 'true');
        }
    }

    function getFilename(formData) {
        const extensions = {
            python: '.py',
            javascript: '.js',
            java: '.java',
            csharp: '.cs'
        };
        
        const cleanName = formData.agentName.replace(/\s+/g, '').toLowerCase();
        return `${cleanName}_agent${extensions[formData.programmingLanguage]}`;
    }

    function copyCode() {
        // Get the raw code from the dataset (not the highlighted version)
        const code = elements.codeSection.dataset.code;
        const copyBtn = document.getElementById('copy-code-btn');

        if (!code) {
            alert('No code available to copy');
            return;
        }

        // Try to copy to clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).then(() => {
                showCopyFeedback(copyBtn, true);
            }).catch(err => {
                console.error('Failed to copy to clipboard:', err);
                fallbackCopyToClipboard(code, copyBtn);
            });
        } else {
            // Fallback for older browsers
            fallbackCopyToClipboard(code, copyBtn);
        }
    }

    function showCopyFeedback(button, success) {
        if (!button) return;

        const originalHTML = button.innerHTML;

        if (success) {
            button.innerHTML = `
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Copied!
            `;
        } else {
            button.innerHTML = `
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                Failed
            `;
        }

        setTimeout(() => {
            button.innerHTML = originalHTML;
        }, 2000);
    }

    function fallbackCopyToClipboard(text, button) {
        // Create a temporary textarea element
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);

        try {
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            showCopyFeedback(button, successful);
        } catch (err) {
            console.error('Fallback copy failed:', err);
            showCopyFeedback(button, false);
        } finally {
            document.body.removeChild(textArea);
        }
    }

    function downloadCode() {
        const code = elements.codeSection.dataset.code;
        const filename = elements.codeSection.dataset.filename;

        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function tryInJupyter(event) {
        // Prevent any default behavior that might cause page reload
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        // Check if the button is disabled (for non-OpenAI models)
        const tryJupyterBtn = document.getElementById('try-jupyter-btn');
        if (tryJupyterBtn && tryJupyterBtn.disabled) {
            return false;
        }

        // Get the current agent configuration
        const formData = conversationState.selections;

        // Check if we have a specific Binder link for this configuration
        if (formData.programmingLanguage === 'python' && formData.llmModel === 'openai') {
            let binderUrl = null;

            if (formData.agentType === 'recommendation') {
                binderUrl = 'https://staging.learn.redis.com/binder/v2/gh/redis/binder-launchers/agent_recommendation_openai?urlpath=%2Fdoc%2Ftree%2Fdemo.ipynb';
            } else if (formData.agentType === 'conversational') {
                binderUrl = 'https://staging.learn.redis.com/binder/v2/gh/redis/binder-launchers/agent_conversational_openai?urlpath=%2Fdoc%2Ftree%2Fdemo.ipynb';
            }

            if (binderUrl) {
                // Open the Binder notebook in a new tab
                window.open(binderUrl, '_blank');
                return false;
            }
        }

        // Fallback to placeholder alert for other configurations
        alert('Jupyter notebook integration coming soon!');

        // Ensure we don't navigate away
        return false;
    }

    // Code Chat Functions
    function openCodeChat() {
        const code = elements.codeSection.dataset.code;
        if (!code) {
            alert('No code available to chat about');
            return;
        }

        // Show the chat section (wizard is already inactive from code generation)
        elements.codeChatSection.classList.remove('agent-builder-hidden');

        // Clear previous messages and reset state
        elements.codeChatMessages.innerHTML = '';
        codeChatState.conversationHistory = [];

        // Check if we need to ask for API key
        if (!codeChatState.apiKey && !codeChatState.hasAskedForKey) {
            addCodeChatMessage('Hi! I can help you understand and work with your generated code.', 'bot');
            addCodeChatMessage('To provide you with the best assistance, please enter your OpenAI API key. This will enable me to give you detailed, context-aware help about your code.', 'bot');
            addCodeChatMessage('You can get an OpenAI API key from: https://platform.openai.com/api-keys', 'bot');
            addCodeChatMessage('Please enter your API key (starts with "sk-"):', 'bot');
            codeChatState.hasAskedForKey = true;
        } else if (codeChatState.apiKey) {
            addCodeChatMessage('Hi! I can help you understand and work with your generated code. What would you like to know?', 'bot');
        } else {
            addCodeChatMessage('Please enter your OpenAI API key to continue:', 'bot');
        }

        // Set up event listeners
        setupCodeChatListeners();

        // Focus on input
        elements.codeChatInput.focus();

        // Scroll to the chat section
        elements.codeChatSection.scrollIntoView({ behavior: 'smooth' });
    }

    function closeCodeChat() {
        elements.codeChatSection.classList.add('agent-builder-hidden');
        elements.codeChatInput.value = '';
        elements.codeChatSend.disabled = true;

        // Don't reactivate the wizard - it should remain inactive until "Start again" is clicked
        // The wizard was made inactive when code was generated, not when chat was opened

        // Remove event listeners to prevent memory leaks
        removeCodeChatListeners();
    }

    function resetWizard() {
        // Hide code section
        elements.codeSection.classList.add('agent-builder-hidden');

        // Hide code chat section
        elements.codeChatSection.classList.add('agent-builder-hidden');

        // Reactivate the initial wizard
        elements.chatContainer.classList.remove('agent-builder-inactive');

        // Reset conversation state
        conversationState = {
            step: 'agent-type',
            selections: {}
        };

        // Clear chat messages except the initial one
        const initialMessage = elements.chatMessages.querySelector('.chat-message.bot-message');
        elements.chatMessages.innerHTML = '';
        if (initialMessage) {
            elements.chatMessages.appendChild(initialMessage.cloneNode(true));
        }

        // Reset input
        elements.chatInput.value = '';
        elements.sendButton.disabled = true;

        // Hide suggestions
        hideSuggestions();

        // Clear code chat state
        codeChatState.conversationHistory = [];
        codeChatState.hasAskedForKey = false;

        // Reset Jupyter button state
        const tryJupyterBtn = document.getElementById('try-jupyter-btn');
        if (tryJupyterBtn) {
            tryJupyterBtn.disabled = false;
            tryJupyterBtn.style.backgroundColor = '';
            tryJupyterBtn.style.color = '';
            tryJupyterBtn.style.borderColor = '';
            tryJupyterBtn.style.opacity = '1';
            tryJupyterBtn.style.cursor = 'pointer';
            tryJupyterBtn.title = 'Try your agent in a Jupyter notebook';
        }

        // Focus on input
        elements.chatInput.focus();
    }

    function setupCodeChatListeners() {
        // Input change listener
        elements.codeChatInput.addEventListener('input', handleCodeChatInputChange);

        // Enter key listener
        elements.codeChatInput.addEventListener('keydown', handleCodeChatKeyDown);

        // Prevent search modal on slash
        elements.codeChatInput.addEventListener('keydown', preventSearchModalOnSlash);

        // Send button listener
        elements.codeChatSend.addEventListener('click', handleCodeChatSend);
    }

    function removeCodeChatListeners() {
        elements.codeChatInput.removeEventListener('input', handleCodeChatInputChange);
        elements.codeChatInput.removeEventListener('keydown', handleCodeChatKeyDown);
        elements.codeChatSend.removeEventListener('click', handleCodeChatSend);
    }

    function handleCodeChatInputChange() {
        const input = elements.codeChatInput.value.trim();
        elements.codeChatSend.disabled = input.length === 0;
    }

    function handleCodeChatKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleCodeChatSend();
        }
    }

    function handleCodeChatSend() {
        const input = elements.codeChatInput.value.trim();
        if (!input) return;

        // Special handling for API key input (don't show it in chat)
        if (!codeChatState.apiKey && input.startsWith('sk-')) {
            // Add a masked version to chat
            addCodeChatMessage('OpenAI API key: ' + '*'.repeat(Math.min(input.length, 20)), 'user');
        } else {
            // Add user message normally
            addCodeChatMessage(input, 'user');
        }

        // Clear input
        elements.codeChatInput.value = '';
        elements.codeChatSend.disabled = true;

        // Process the message
        processCodeChatMessage(input);
    }

    function addCodeChatMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}-message`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';

        if (type === 'bot') {
            avatar.innerHTML = `
                <svg class="w-6 h-6 text-redis-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
            `;
        } else {
            avatar.innerHTML = `
                <svg class="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
            `;
        }

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        // Render Markdown for bot messages, plain text for user messages
        if (type === 'bot' && window.marked) {
            try {
                // Configure marked for safe rendering
                marked.setOptions({
                    breaks: true,
                    gfm: true,
                    sanitize: false,
                    highlight: function(code, lang) {
                        // Use highlight.js if available
                        if (window.hljs && lang) {
                            try {
                                return hljs.highlight(code, { language: lang }).value;
                            } catch (e) {
                                return hljs.highlightAuto(code).value;
                            }
                        }
                        return code;
                    }
                });
                messageContent.innerHTML = marked.parse(content);
            } catch (error) {
                console.warn('Markdown parsing failed, falling back to plain text:', error);
                messageContent.innerHTML = `<p>${content}</p>`;
            }
        } else {
            // Fallback to plain text wrapped in paragraph
            messageContent.innerHTML = `<p>${content}</p>`;
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        elements.codeChatMessages.appendChild(messageDiv);

        // Scroll to bottom
        elements.codeChatMessages.scrollTop = elements.codeChatMessages.scrollHeight;
    }

    function processCodeChatMessage(input) {
        // Check for special commands
        if (input.toLowerCase() === '/reset-key' || input.toLowerCase() === '/new-key') {
            codeChatState.apiKey = null;
            codeChatState.hasAskedForKey = false;
            addCodeChatMessage('🔄 API key reset. Please enter your new OpenAI API key:', 'bot');
            return;
        }

        // Check if this is an API key input
        if (!codeChatState.apiKey && input.startsWith('sk-')) {
            codeChatState.apiKey = input.trim();
            addCodeChatMessage('✅ OpenAI API key saved! Now I can provide you with intelligent assistance about your code. What would you like to know?', 'bot');
            addCodeChatMessage('💡 Tip: Type "/reset-key" if you need to change your API key later.', 'bot');
            return;
        }

        // If no API key, remind user
        if (!codeChatState.apiKey) {
            addCodeChatMessage('Please enter your OpenAI API key first to enable intelligent responses.', 'bot');
            return;
        }

        // Add user message to conversation history
        codeChatState.conversationHistory.push({
            role: 'user',
            content: input
        });

        // Show thinking indicator
        addCodeChatMessage('🤔 Thinking...', 'bot');

        // Make LLM call
        callLiteLLM(input);
    }

    async function callLiteLLM(userMessage) {
        try {
            const code = elements.codeSection.dataset.code;
            const formData = conversationState.selections;

            // Prepare the system message with code context
            const systemMessage = `You are a helpful AI assistant specializing in Redis and AI development.

The user has generated the following ${formData.programmingLanguage} code for a ${CONFIG.agentTypes[formData.agentType].name} using ${formData.llmModel}:

\`\`\`${formData.programmingLanguage}
${code}
\`\`\`

Please help the user understand, modify, debug, or deploy this code. Provide specific, actionable advice based on the actual code shown above.`;

            // Prepare messages for the API call
            const messages = [
                { role: 'system', content: systemMessage },
                ...codeChatState.conversationHistory.slice(-10), // Keep last 10 messages for context
                { role: 'user', content: userMessage }
            ];

            // Make the API call using fetch with custom base URL
            const response = await fetch('https://d34j1iks5zrrtk.cloudfront.net/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${codeChatState.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: messages,
                    max_tokens: 1000,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Response:', response.status, response.statusText, errorText);
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            const assistantMessage = data.choices[0].message.content;

            // Remove thinking indicator and add real response
            removeLastBotMessage();
            addCodeChatMessage(assistantMessage, 'bot');

            // Add to conversation history
            codeChatState.conversationHistory.push({
                role: 'assistant',
                content: assistantMessage
            });

        } catch (error) {
            console.error('OpenAI API error:', error);

            // Remove thinking indicator and show error
            removeLastBotMessage();

            // Handle different types of API errors
            if (error.message.includes('401') || error.message.includes('Incorrect API key')) {
                addCodeChatMessage('❌ Invalid OpenAI API key. Please check your API key and try again.', 'bot');
                addCodeChatMessage('Make sure your API key starts with "sk-" and has sufficient credits.', 'bot');
                codeChatState.apiKey = null; // Reset API key
            } else if (error.message.includes('429') || error.message.includes('rate limit')) {
                addCodeChatMessage('⚠️ Rate limit exceeded. Please wait a moment and try again.', 'bot');
            } else if (error.message.includes('403') || error.message.includes('insufficient_quota') || error.message.includes('quota')) {
                addCodeChatMessage('❌ Your OpenAI account has insufficient credits. Please add credits to your account.', 'bot');
            } else {
                addCodeChatMessage('❌ Sorry, I encountered an error connecting to the AI service. Please try again.', 'bot');
                console.log('Full error details:', error);
            }

            // Fallback to basic response
            const fallbackResponse = generateCodeChatResponse(userMessage, code, formData);
            addCodeChatMessage('Here\'s some basic help while the AI service is unavailable:', 'bot');
            addCodeChatMessage(fallbackResponse, 'bot');
        }
    }

    function removeLastBotMessage() {
        const messages = elements.codeChatMessages.children;
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.classList.contains('bot-message')) {
                lastMessage.remove();
            }
        }
    }

    function generateCodeChatResponse(input, code, formData) {
        const lowerInput = input.toLowerCase();

        // Simple keyword-based responses for demonstration
        if (lowerInput.includes('how') && (lowerInput.includes('run') || lowerInput.includes('execute'))) {
            return `To run this ${formData.programmingLanguage} code:

1. Save the code to a file with the appropriate extension
2. Install the required dependencies (Redis client library and ${formData.llmModel} SDK)
3. Set up your environment variables for Redis connection and API keys
4. Run the file using your ${formData.programmingLanguage} interpreter

Would you like specific installation commands for the dependencies?`;
        }

        if (lowerInput.includes('dependencies') || lowerInput.includes('install') || lowerInput.includes('requirements')) {
            const deps = getDependenciesForLanguage(formData.programmingLanguage, formData.llmModel);
            return `Here are the dependencies you need to install:

${deps}

Make sure you have ${formData.programmingLanguage} installed on your system first.`;
        }

        if (lowerInput.includes('redis') && (lowerInput.includes('connect') || lowerInput.includes('setup'))) {
            return `To set up Redis for this agent:

1. Install Redis locally or use Redis Cloud
2. Set these environment variables:
   - REDIS_HOST (default: localhost)
   - REDIS_PORT (default: 6379)
   - REDIS_PASSWORD (if required)

For Redis Cloud, you can get a free database at https://redis.io/try-free/`;
        }

        if (lowerInput.includes('api') && lowerInput.includes('key')) {
            return `You'll need to set up API keys for ${formData.llmModel}:

Set the environment variable: ${formData.llmModel.toUpperCase()}_API_KEY

Get your API key from:
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/
- For Llama 2: You can run it locally or use a hosted service

Never hardcode API keys in your source code!`;
        }

        if (lowerInput.includes('explain') || lowerInput.includes('what does')) {
            return `This code creates a ${CONFIG.agentTypes[formData.agentType].name} that:

${CONFIG.agentTypes[formData.agentType].features.map(feature => `• ${feature}`).join('\n')}

The main components are:
• Redis client for data storage and retrieval
• ${formData.llmModel} integration for AI responses
• Error handling and logging
• Data persistence methods

What specific part would you like me to explain in more detail?`;
        }

        if (lowerInput.includes('modify') || lowerInput.includes('customize') || lowerInput.includes('change')) {
            return `You can customize this code by:

• Modifying the system prompt in the LLM calls
• Adding custom data processing logic
• Implementing additional Redis data structures
• Adding authentication and security features
• Scaling with connection pooling

What specific modifications are you thinking about?`;
        }

        if (lowerInput.includes('error') || lowerInput.includes('debug') || lowerInput.includes('troubleshoot')) {
            return `Common issues and solutions:

• **Connection errors**: Check Redis is running and credentials are correct
• **API errors**: Verify your ${formData.llmModel} API key is valid and has credits
• **Import errors**: Make sure all dependencies are installed
• **Permission errors**: Check file permissions and environment variables

What specific error are you encountering?`;
        }

        // Default response
        return `I can help you with questions about:

• How to run and deploy this code
• Setting up dependencies and environment
• Connecting to Redis and configuring APIs
• Customizing the agent for your needs
• Troubleshooting common issues
• Explaining how different parts work

What would you like to know more about?`;
    }

    function getDependenciesForLanguage(language, llmModel) {
        const deps = {
            python: {
                base: "pip install redis openai python-dotenv",
                openai: "pip install redis openai python-dotenv",
                anthropic: "pip install redis anthropic python-dotenv",
                llama2: "pip install redis transformers torch python-dotenv"
            },
            javascript: {
                base: "npm install redis dotenv",
                openai: "npm install redis openai dotenv",
                anthropic: "npm install redis @anthropic-ai/sdk dotenv",
                llama2: "npm install redis @huggingface/inference dotenv"
            },
            java: {
                base: "Add to pom.xml: jedis, okhttp3",
                openai: "Add to pom.xml: jedis, okhttp3 (for OpenAI API)",
                anthropic: "Add to pom.xml: jedis, okhttp3 (for Anthropic API)",
                llama2: "Add to pom.xml: jedis, okhttp3 (for Llama API)"
            },
            csharp: {
                base: "dotnet add package StackExchange.Redis",
                openai: "dotnet add package StackExchange.Redis OpenAI",
                anthropic: "dotnet add package StackExchange.Redis Anthropic.SDK",
                llama2: "dotnet add package StackExchange.Redis (+ Llama API client)"
            }
        };

        return deps[language]?.[llmModel] || deps[language]?.base || "Dependencies information not available";
    }

    // Initialize when script loads
    init();

})();
