// AI Provider Abstraction Layer

export interface AIMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface AIProvider {
    name: string;
    id: string;
    models: string[];
    chat(messages: AIMessage[], model?: string): Promise<string>;
    isConfigured(): boolean;
}

export interface AIConfig {
    provider: string;
    model: string;
    apiKey?: string;
    endpoint?: string;
    temperature?: number;
}

// Provider Registry
const providers: Map<string, AIProvider> = new Map();

export function registerProvider(provider: AIProvider) {
    providers.set(provider.id, provider);
}

export function getProvider(id: string): AIProvider | null {
    return providers.get(id) || null;
}

export function getAvailableProviders(): AIProvider[] {
    return Array.from(providers.values());
}

// ============================================
// GEMINI PROVIDER
// ============================================
export const geminiProvider: AIProvider = {
    name: 'Google Gemini',
    id: 'gemini',
    models: [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-2.5-pro',
        'gemini-2.5-flash',
    ],
    async chat(messages: AIMessage[], model = 'gemini-2.0-flash'): Promise<string> {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return '[Demo Mode] Gemini API key not configured. This would be an AI response.';
        }

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: messages.map(m => ({
                            role: m.role === 'assistant' ? 'model' : m.role,
                            parts: [{ text: m.content }],
                        })),
                    }),
                }
            );
            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
        } catch (error) {
            console.error('Gemini error:', error);
            return 'Error communicating with Gemini';
        }
    },
    isConfigured(): boolean {
        return !!(process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY);
    },
};

// ============================================
// AZURE OPENAI PROVIDER
// ============================================
export const azureProvider: AIProvider = {
    name: 'Azure OpenAI',
    id: 'azure',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'],
    async chat(messages: AIMessage[], model = 'gpt-4o'): Promise<string> {
        const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
        const apiKey = process.env.AZURE_OPENAI_KEY;
        const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || model;

        if (!endpoint || !apiKey) {
            return '[Demo Mode] Azure OpenAI not configured.';
        }

        try {
            const response = await fetch(
                `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-01`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'api-key': apiKey,
                    },
                    body: JSON.stringify({
                        messages: messages.map(m => ({ role: m.role, content: m.content })),
                    }),
                }
            );
            const data = await response.json();
            return data.choices?.[0]?.message?.content || 'No response';
        } catch (error) {
            console.error('Azure error:', error);
            return 'Error communicating with Azure OpenAI';
        }
    },
    isConfigured(): boolean {
        return !!(process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_KEY);
    },
};

// ============================================
// AWS BEDROCK PROVIDER
// ============================================
export const awsProvider: AIProvider = {
    name: 'AWS Bedrock',
    id: 'aws',
    models: ['claude-3-sonnet', 'claude-3-haiku', 'titan-text-express', 'llama-3-8b'],
    async chat(messages: AIMessage[], model = 'claude-3-sonnet'): Promise<string> {
        // AWS Bedrock requires SDK - simplified placeholder
        if (!process.env.AWS_ACCESS_KEY_ID) {
            return '[Demo Mode] AWS Bedrock not configured.';
        }
        return '[AWS Bedrock] Would process via AWS SDK';
    },
    isConfigured(): boolean {
        return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    },
};

// ============================================
// CUSTOM API PROVIDER
// ============================================
export function createCustomProvider(config: {
    name: string;
    endpoint: string;
    apiKey?: string;
    models?: string[];
}): AIProvider {
    return {
        name: config.name,
        id: 'custom',
        models: config.models || ['default'],
        async chat(messages: AIMessage[], model = 'default'): Promise<string> {
            try {
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json',
                };
                if (config.apiKey) {
                    headers['Authorization'] = `Bearer ${config.apiKey}`;
                }

                const response = await fetch(config.endpoint, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ messages, model }),
                });
                const data = await response.json();
                return data.response || data.content || data.text || JSON.stringify(data);
            } catch (error) {
                console.error('Custom provider error:', error);
                return 'Error communicating with custom API';
            }
        },
        isConfigured(): boolean {
            return !!config.endpoint;
        },
    };
}

// Register default providers
registerProvider(geminiProvider);
registerProvider(azureProvider);
registerProvider(awsProvider);

// ============================================
// AI ASSISTANT HOOK
// ============================================
export async function chat(
    messages: AIMessage[],
    config?: Partial<AIConfig>
): Promise<string> {
    const providerId = config?.provider || 'gemini';
    const provider = getProvider(providerId);

    if (!provider) {
        return `Provider "${providerId}" not found`;
    }

    return provider.chat(messages, config?.model);
}
