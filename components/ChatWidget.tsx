import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, ArrowUp, Trash2, Copy, Check, Search } from 'lucide-react';
import { GoogleGenAI, Chat } from "@google/genai";
import { algoliasearch } from 'algoliasearch';
import { Message, Agent } from '../types';
import { products } from '../data';

// Initialize Algolia client
const algoliaClient = algoliasearch(
    import.meta.env.VITE_ALGOLIA_APP_ID,
    import.meta.env.VITE_ALGOLIA_SEARCH_KEY
);

// Search functions for Algolia retrieval
const searchIngredients = async (query: string): Promise<string> => {
    // Search local products (from ingredients_final.json)
    const localResults = products.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);

    if (localResults.length > 0) {
        return localResults.map(p =>
            `- ${p.name} (${p.category}) - $${p.price.toFixed(2)}`
        ).join('\n');
    }
    return 'No ingredients found matching your query.';
};

const searchRecipes = async (query: string): Promise<string> => {
    try {
        const { hits } = await algoliaClient.search([{
            indexName: 'food',
            params: { query, hitsPerPage: 5 }
        }]).then(res => res.results[0] as any);

        if (hits && hits.length > 0) {
            return hits.map((hit: any) =>
                `- "${hit.title}" (${hit.ingredients?.length || 0} ingredients)`
            ).join('\n');
        }
        return 'No recipes found matching your query.';
    } catch (error) {
        console.error('Recipe search error:', error);
        return 'Unable to search recipes at the moment.';
    }
};

// Enhanced system prompt with retrieval instructions
const SYSTEM_PROMPT = `You are DOKO Support, a premium culinary assistant for a luxury grocery platform called DOKO.

YOUR CAPABILITIES:
1. You have access to DOKO's inventory of 23,000+ premium ingredients
2. You can search professional recipe databases powered by Algolia
3. You can help customers find ingredients, suggest recipes, and answer culinary questions

BEHAVIOR GUIDELINES:
- Keep responses concise (2-3 sentences max)
- Be helpful, sophisticated, and knowledgeable about food
- When you receive [SEARCH RESULTS], use that real data to inform your response
- If asked about specific ingredients or recipes, reference the search results provided
- Always maintain a professional yet warm tone
- When recommending products, mention their category and price when available

You are connected to Algolia's search infrastructure for real-time inventory and recipe data.`;

const INITIAL_MESSAGES: Message[] = [
    {
        id: '1',
        text: 'Welcome to Doko. I am Doko Support, connected to our inventory of 23,000+ ingredients and professional recipe database. How may I assist you today?',
        sender: 'agent',
        timestamp: new Date(),
    },
];

const AGENT: Agent = {
    name: 'Doko Support',
    avatar: '',
    status: 'online',
};

// Keywords that trigger search
const INGREDIENT_KEYWORDS = ['ingredient', 'have', 'stock', 'find', 'looking for', 'need', 'buy', 'purchase', 'get', 'available'];
const RECIPE_KEYWORDS = ['recipe', 'cook', 'make', 'prepare', 'dish', 'meal', 'dinner', 'lunch', 'breakfast'];

const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const chatSessionRef = useRef<Chat | null>(null);

    const startNewSession = () => {
        const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
        if (!apiKey) {
            console.error('Google AI API key not found');
            return null;
        }
        const ai = new GoogleGenAI({ apiKey });
        return ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: SYSTEM_PROMPT,
            },
            history: [
                {
                    role: 'model',
                    parts: [{ text: INITIAL_MESSAGES[0].text }],
                },
            ],
        });
    };

    useEffect(() => {
        chatSessionRef.current = startNewSession();
    }, []);

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const handleClearChat = () => {
        setMessages(INITIAL_MESSAGES);
        chatSessionRef.current = startNewSession();
    };

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            const { scrollHeight, clientHeight } = chatContainerRef.current;
            const maxScrollTop = scrollHeight - clientHeight;
            chatContainerRef.current.scrollTo({
                top: maxScrollTop > 0 ? maxScrollTop : 0,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => scrollToBottom(), 100);
        return () => clearTimeout(timeoutId);
    }, [messages, isOpen, isTyping]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handlePromptClick = (prompt: string) => {
        setInputValue(prompt);
        if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    };

    const handleCopy = async (id: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    // Detect if query needs retrieval and what type
    const analyzeQuery = (query: string): { needsIngredientSearch: boolean; needsRecipeSearch: boolean; searchTerms: string } => {
        const lowerQuery = query.toLowerCase();
        const needsIngredientSearch = INGREDIENT_KEYWORDS.some(k => lowerQuery.includes(k));
        const needsRecipeSearch = RECIPE_KEYWORDS.some(k => lowerQuery.includes(k));

        // Extract key nouns (simple extraction)
        const words = query.split(/\s+/).filter(w => w.length > 3);
        const searchTerms = words.slice(0, 3).join(' ');

        return { needsIngredientSearch, needsRecipeSearch, searchTerms };
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim()) return;

        const userText = inputValue.trim();

        const newUserMessage: Message = {
            id: Date.now().toString(),
            text: userText,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newUserMessage]);
        setInputValue('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        setIsTyping(true);
        const agentMsgId = (Date.now() + 1).toString();

        setMessages(prev => [...prev, {
            id: agentMsgId,
            text: '',
            sender: 'agent',
            timestamp: new Date(),
            isStreaming: true
        } as Message & { isStreaming?: boolean }]);

        try {
            if (!chatSessionRef.current) {
                chatSessionRef.current = startNewSession();
            }

            if (chatSessionRef.current) {
                // Analyze query for retrieval needs
                const { needsIngredientSearch, needsRecipeSearch, searchTerms } = analyzeQuery(userText);

                let contextualPrompt = userText;

                // Perform Algolia retrieval if needed
                if (needsIngredientSearch || needsRecipeSearch) {
                    setIsSearching(true);
                    let searchContext = '\n\n[SEARCH RESULTS FROM ALGOLIA]:\n';

                    if (needsIngredientSearch) {
                        const ingredientResults = await searchIngredients(searchTerms || userText);
                        searchContext += `\nAvailable Ingredients:\n${ingredientResults}\n`;
                    }

                    if (needsRecipeSearch) {
                        const recipeResults = await searchRecipes(searchTerms || userText);
                        searchContext += `\nMatching Recipes:\n${recipeResults}\n`;
                    }

                    searchContext += '\n[END SEARCH RESULTS]\n\nPlease use the above real data to answer the user\'s question:';
                    contextualPrompt = searchContext + '\n\nUser Question: ' + userText;
                    setIsSearching(false);
                }

                // Send to AI with retrieved context
                const result = await chatSessionRef.current.sendMessageStream({ message: contextualPrompt });

                let fullText = '';
                for await (const chunk of result) {
                    const chunkText = chunk.text;
                    fullText += chunkText;

                    setMessages(prev => prev.map(msg =>
                        msg.id === agentMsgId
                            ? { ...msg, text: fullText }
                            : msg
                    ));
                }
            } else {
                throw new Error('Chat session not available');
            }
        } catch (error: any) {
            console.error("Error communicating with AI:", error);

            let errorMessage = "I apologize, but I'm temporarily unavailable. Please try again in a moment.";

            if (error.message?.includes('429') || JSON.stringify(error).includes('429')) {
                errorMessage = "Steward Quota Exceeded: The AI API key has reached its free tier limit. Please check your Google AI Studio quota or provide a fresh API key.";
            }

            setMessages(prev => prev.map(msg =>
                msg.id === agentMsgId
                    ? { ...msg, text: errorMessage, isStreaming: false }
                    : msg
            ));
        } finally {
            setIsTyping(false);
            setIsSearching(false);
            setMessages(prev => prev.map(msg =>
                msg.id === agentMsgId
                    ? { ...msg, isStreaming: false }
                    : msg
            ));
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end font-sans">
            <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes slideIn {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .label-animate {
          animation: slideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .message-fade-in {
            animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes pulse-search {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .searching {
          animation: pulse-search 1s ease-in-out infinite;
        }
      `}</style>

            {/* Chat Window */}
            <div
                className={`
          transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) transform origin-bottom-right
          ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8 pointer-events-none'}
          mb-6 w-[380px] sm:w-[480px] h-[720px] max-h-[85vh]
          bg-white rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden border border-gray-100
        `}
            >
                {/* Header */}
                <div className="bg-white px-7 py-6 flex items-center justify-between border-b border-gray-100 shrink-0">
                    <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-xl tracking-tight text-black flex items-center leading-none">
                            Doko Support
                        </h3>
                        <span className="flex items-center">
                            <span className={`w-2 h-2 rounded-full ${isSearching ? 'bg-blue-500 searching' : 'bg-green-500 animate-pulse'}`}></span>
                        </span>
                        {isSearching && (
                            <span className="text-[10px] text-blue-500 font-medium flex items-center gap-1">
                                <Search size={10} /> Searching...
                            </span>
                        )}
                    </div>

                    <div className="flex items-center space-x-1">
                        <button
                            onClick={handleClearChat}
                            className="text-gray-400 hover:text-red-500 p-2 rounded-full transition-all"
                            title="Clear History"
                        >
                            <Trash2 size={18} />
                        </button>

                        <button
                            onClick={toggleChat}
                            className="text-gray-400 hover:text-black p-2 rounded-full transition-all"
                        >
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto pt-8 px-7 bg-white space-y-7 hide-scrollbar scroll-smooth"
                >
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} message-fade-in`}
                        >
                            <div className="relative group max-w-[85%]">
                                <div
                                    className={`
                    px-5 py-4 rounded-[1.75rem] text-[15px] leading-relaxed
                    ${msg.sender === 'user'
                                            ? 'bg-black text-white rounded-tr-none shadow-lg shadow-black/10'
                                            : 'bg-gray-100 text-black rounded-tl-none'
                                        }
                  `}
                                >
                                    <p className="font-medium whitespace-pre-wrap">{msg.text}</p>
                                    <p className={`text-[9px] mt-2 font-bold uppercase tracking-widest ${msg.sender === 'user' ? 'text-gray-400' : 'text-gray-400'}`}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleCopy(msg.id, msg.text)}
                                    className={`
                    absolute top-1 transition-all duration-200 p-1.5 rounded-lg
                    ${msg.sender === 'user' ? '-left-8' : '-right-8'}
                    opacity-0 group-hover:opacity-100 bg-white shadow-sm border border-gray-100 text-gray-400 hover:text-black
                  `}
                                    title="Copy message"
                                >
                                    {copiedId === msg.id ? (
                                        <Check size={14} className="text-green-500" />
                                    ) : (
                                        <Copy size={14} />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}

                    {isTyping && messages[messages.length - 1]?.sender !== 'agent' && (
                        <div className="flex justify-start message-fade-in">
                            <div className="bg-gray-100 px-6 py-5 rounded-[1.75rem] rounded-tl-none flex space-x-2">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                            </div>
                        </div>
                    )}

                    <div className="h-20 w-full shrink-0" />
                </div>

                {/* Input Area */}
                <div className="px-5 pt-2 pb-2 bg-white shrink-0 border-t border-gray-50">
                    <div className="flex gap-2 mb-3 overflow-x-auto hide-scrollbar px-1">
                        <button
                            onClick={() => handlePromptClick("Do you have organic tomatoes?")}
                            className="whitespace-nowrap px-4 py-2 rounded-full bg-gray-100 text-[11px] font-bold text-black border border-black/5 hover:bg-black hover:text-white transition-all active:scale-95"
                        >
                            Organic tomatoes?
                        </button>
                        <button
                            onClick={() => handlePromptClick("Suggest a simple pasta recipe")}
                            className="whitespace-nowrap px-4 py-2 rounded-full bg-gray-100 text-[11px] font-bold text-black border border-black/5 hover:bg-black hover:text-white transition-all active:scale-95"
                        >
                            Pasta recipe?
                        </button>
                        <button
                            onClick={() => handlePromptClick("Any keto-friendly snack ideas?")}
                            className="whitespace-nowrap px-4 py-2 rounded-full bg-gray-100 text-[11px] font-bold text-black border border-black/5 hover:bg-black hover:text-white transition-all active:scale-95"
                        >
                            Keto snacks?
                        </button>
                    </div>
                    <div className="relative flex flex-col items-center">
                        <form
                            onSubmit={handleSendMessage}
                            className="w-full relative group transition-all duration-300"
                        >
                            <div className="flex items-center space-x-4 bg-gray-50 border-[1.5px] border-black focus-within:bg-white focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] px-6 py-4 transition-all">
                                <textarea
                                    ref={textareaRef}
                                    value={inputValue}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask about ingredients, recipes..."
                                    rows={1}
                                    className="flex-1 bg-transparent border-none py-1 text-[17px] sm:text-[18px] font-semibold text-black placeholder:text-gray-400 focus:ring-0 outline-none resize-none overflow-hidden max-h-[150px] leading-tight hide-scrollbar"
                                />

                                <button
                                    type="submit"
                                    disabled={!inputValue.trim() || (isTyping && messages[messages.length - 1]?.sender !== 'agent')}
                                    className={`
                    p-2.5 rounded-2xl transition-all duration-500 flex items-center justify-center shrink-0
                    ${inputValue.trim() && !isTyping
                                            ? 'bg-black text-white shadow-[0_8px_20px_rgba(0,0,0,0.2)] transform hover:scale-105 active:scale-95'
                                            : 'bg-gray-200 text-gray-400'}
                  `}
                                >
                                    <ArrowUp size={22} strokeWidth={3} className={`${inputValue.trim() && !isTyping ? 'animate-pulse' : ''}`} />
                                </button>
                            </div>
                        </form>
                        <div className="flex justify-center items-center mt-[4px]">
                            <span className="text-[10px] font-medium text-gray-400/80">Powered by <span className="text-blue-400">Algolia</span></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Action Button */}
            <button
                onClick={toggleChat}
                className={`
          relative flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.2)]
          transition-all duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275) transform hover:scale-105 active:scale-95
          px-6 h-16 rounded-[2rem] space-x-3
          ${isOpen ? 'bg-black shadow-black/40' : 'bg-white border border-gray-100'}
        `}
            >
                {isOpen ? (
                    <>
                        <X size={26} className="text-white shrink-0" strokeWidth={2.5} />
                        <span className="font-semibold text-base text-white label-animate">
                            Close
                        </span>
                    </>
                ) : (
                    <>
                        <div className="relative">
                            <MessageCircle size={28} className="text-black shrink-0" strokeWidth={2.5} />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#C6A355] rounded-full border-2 border-white"></div>
                        </div>
                        <span className="font-semibold text-base text-black label-animate">
                            Support
                        </span>
                    </>
                )}
            </button>
        </div>
    );
};

export default ChatWidget;
