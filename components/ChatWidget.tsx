import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, ArrowUp, Trash2, Copy, Check, Search, ShoppingCart, ExternalLink, BookOpen } from 'lucide-react';
import { GoogleGenerativeAI, ChatSession } from "@google/generative-ai";
import { algoliasearch } from 'algoliasearch';
import { Message, Agent, Product, Recipe } from '../types';
import { products } from '../data';
import { useStore } from '../context/StoreContext';

// Initialize Algolia client
const algoliaClient = algoliasearch(
    import.meta.env.VITE_ALGOLIA_APP_ID,
    import.meta.env.VITE_ALGOLIA_SEARCH_KEY
);

// Extended message type with cards
interface ChatMessage extends Message {
    productCards?: ProductCard[];
    recipeCards?: RecipeCard[];
    isStreaming?: boolean;
}

interface RecipeCard {
    id: string;
    title: string;
    ingredientCount: number;
    image?: string;
}

interface ProductCard {
    id: string;
    name: string;
    price: number;
    category: string;
    image?: string;
}

// Search ingredients from Algolia
const searchIngredientsAlgolia = async (query: string): Promise<{ text: string; products: ProductCard[] }> => {
    try {
        // Search from Algolia ingredients_final index
        const response = await algoliaClient.search([{
            indexName: 'ingredients_final',
            params: { query, hitsPerPage: 5 }
        }]);

        const hits = (response.results[0] as any)?.hits || [];

        if (hits.length > 0) {
            const text = hits.map((hit: any) =>
                `- ${hit.name} (${hit.category}) - $${hit.price?.toFixed(2) || 'N/A'} [ID:${hit.objectID}]`
            ).join('\n');
            const productCards = hits.map((hit: any) => ({
                id: hit.objectID,
                name: hit.name,
                price: hit.price || 0,
                category: hit.category || 'Ingredient',
                image: hit.image
            }));
            return { text, products: productCards };
        }

        // Fallback to local products if Algolia returns nothing
        const localResults = products.filter(p =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.category.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);

        if (localResults.length > 0) {
            const text = localResults.map(p =>
                `- ${p.name} (${p.category}) - $${p.price.toFixed(2)} [ID:${p.id}]`
            ).join('\n');
            const productCards = localResults.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                category: p.category,
                image: p.image
            }));
            return { text, products: productCards };
        }

        return { text: 'No ingredients found matching your query.', products: [] };
    } catch (error) {
        console.error('Algolia ingredient search error:', error);
        // Fallback to local
        const localResults = products.filter(p =>
            p.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);

        if (localResults.length > 0) {
            const text = localResults.map(p =>
                `- ${p.name} (${p.category}) - $${p.price.toFixed(2)}`
            ).join('\n');
            const productCards = localResults.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                category: p.category,
                image: p.image
            }));
            return { text, products: productCards };
        }
        return { text: 'Unable to search ingredients at the moment.', products: [] };
    }
};

// Search recipes from Algolia
const searchRecipesAlgolia = async (query: string): Promise<{ text: string; recipes: RecipeCard[] }> => {
    try {
        const response = await algoliaClient.search([{
            indexName: 'food',
            params: { query, hitsPerPage: 3 }
        }]);

        const hits = (response.results[0] as any)?.hits || [];

        if (hits.length > 0) {
            const text = hits.map((hit: any) =>
                `- "${hit.title}" (${hit.ingredients?.length || 0} ingredients) [ID:${hit.objectID}]`
            ).join('\n');
            const recipeCards = hits.map((hit: any) => ({
                id: hit.objectID,
                title: hit.title,
                ingredientCount: hit.ingredients?.length || 0,
                image: hit.image
            }));
            return { text, recipes: recipeCards };
        }
        return { text: 'No recipes found matching your query.', recipes: [] };
    } catch (error) {
        console.error('Algolia recipe search error:', error);
        return { text: 'Unable to search recipes at the moment.', recipes: [] };
    }
};

// System prompt with user data
const getSystemPrompt = (cartInfo: string, savedRecipesInfo: string, wishlistInfo: string) => `You are DOKO Support, a premium culinary assistant for a luxury grocery platform called DOKO.

YOUR CAPABILITIES:
1. You have access to DOKO's inventory of 23,000+ premium ingredients via Algolia
2. You can search professional recipe databases powered by Algolia
3. You can help customers find ingredients, suggest recipes, and answer culinary questions
4. You have access to this user's personal shopping data

CURRENT USER'S DATA:
${cartInfo}
${savedRecipesInfo}
${wishlistInfo}

BEHAVIOR GUIDELINES:
- Keep responses concise (2-3 sentences max)
- Be helpful, sophisticated, and knowledgeable about food
- When you receive [SEARCH RESULTS], use that real data to inform your response
- Reference product IDs when recommending items so users can add them to cart
- If the user asks about their cart, saved recipes, or wishlist, use the data above
- Always maintain a professional yet warm tone
- When recommending products, mention their category and price

You are connected to Algolia's search infrastructure for real-time inventory and recipe data.`;

const INITIAL_MESSAGES: ChatMessage[] = [
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
const INGREDIENT_KEYWORDS = ['ingredient', 'have', 'stock', 'find', 'looking for', 'need', 'buy', 'purchase', 'get', 'available', 'tomato', 'cheese', 'chicken', 'beef', 'vegetable', 'fruit', 'organic'];
const RECIPE_KEYWORDS = ['recipe', 'cook', 'make', 'prepare', 'dish', 'meal', 'dinner', 'lunch', 'breakfast', 'suggest', 'pasta', 'keto'];

const ChatWidget: React.FC = () => {
    const { cart, cartTotal, savedRecipes, wishlist, getProduct, addToCart, navigate } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const chatSessionRef = useRef<ChatSession | null>(null);

    // Build user context strings from store
    const getCartInfo = (): string => {
        if (cart.length === 0) return 'Shopping Cart: Empty';
        const items = cart.map(item => `  - ${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`).join('\n');
        return `Shopping Cart (${cart.length} items, Total: $${cartTotal.toFixed(2)}):\n${items}`;
    };

    const getSavedRecipesInfo = (): string => {
        if (savedRecipes.length === 0) return 'Saved Recipes: None';
        const recipes = savedRecipes.slice(0, 5).map(r => `  - "${r.title}"`).join('\n');
        return `Saved Recipes (${savedRecipes.length}):\n${recipes}`;
    };

    const getWishlistInfo = (): string => {
        if (wishlist.length === 0) return 'Wishlist: Empty';
        const items = wishlist.slice(0, 5).map(id => {
            const product = getProduct(id);
            return product ? `  - ${product.name}` : null;
        }).filter(Boolean).join('\n');
        return `Wishlist (${wishlist.length} items):\n${items}`;
    };

    const startNewSession = () => {
        const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
        if (!apiKey) {
            console.error('Google AI API key not found');
            return null;
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        const systemPrompt = getSystemPrompt(getCartInfo(), getSavedRecipesInfo(), getWishlistInfo());
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash-lite',
            systemInstruction: systemPrompt
        });

        return model.startChat({
            history: [],
        });
    };

    useEffect(() => {
        chatSessionRef.current = startNewSession();
    }, []);

    // Refresh session when cart/wishlist/recipes change
    useEffect(() => {
        if (chatSessionRef.current) {
            chatSessionRef.current = startNewSession();
        }
    }, [cart, wishlist, savedRecipes]);

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

    // Action handlers
    const handleAddToCart = (productId: string) => {
        const product = getProduct(productId);
        if (product) {
            addToCart(product, 1);
            const confirmMsg: ChatMessage = {
                id: Date.now().toString(),
                text: `✓ Added "${product.name}" to your cart!`,
                sender: 'agent',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, confirmMsg]);
        }
    };

    const handleViewProduct = (productId: string) => {
        navigate(`/product/${productId}`);
        setIsOpen(false);
    };

    const handleViewRecipe = (recipeId: string) => {
        navigate(`/recipe/${recipeId}`);
        setIsOpen(false);
    };

    // Analyze query for search needs
    const analyzeQuery = (query: string): { needsIngredientSearch: boolean; needsRecipeSearch: boolean; searchTerms: string } => {
        const lowerQuery = query.toLowerCase();
        const needsIngredientSearch = INGREDIENT_KEYWORDS.some(k => lowerQuery.includes(k));
        const needsRecipeSearch = RECIPE_KEYWORDS.some(k => lowerQuery.includes(k));
        const words = query.split(/\s+/).filter(w => w.length > 3);
        const searchTerms = words.slice(0, 3).join(' ');
        return { needsIngredientSearch, needsRecipeSearch, searchTerms };
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim()) return;

        const userText = inputValue.trim();

        const newUserMessage: ChatMessage = {
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

        // Add placeholder message for streaming
        setMessages(prev => [...prev, {
            id: agentMsgId,
            text: '',
            sender: 'agent',
            timestamp: new Date(),
            isStreaming: true
        }]);

        try {
            if (!chatSessionRef.current) {
                chatSessionRef.current = startNewSession();
            }

            if (chatSessionRef.current) {
                const { needsIngredientSearch, needsRecipeSearch, searchTerms } = analyzeQuery(userText);

                let contextualPrompt = userText;
                let foundProducts: ProductCard[] = [];
                let foundRecipes: RecipeCard[] = [];

                // Perform Algolia retrieval if needed
                if (needsIngredientSearch || needsRecipeSearch) {
                    setIsSearching(true);
                    let searchContext = '\n\n[SEARCH RESULTS FROM ALGOLIA]:\n';

                    if (needsIngredientSearch) {
                        const ingredientResults = await searchIngredientsAlgolia(searchTerms || userText);
                        searchContext += `\nAvailable Ingredients:\n${ingredientResults.text}\n`;
                        foundProducts = ingredientResults.products;
                    }

                    if (needsRecipeSearch) {
                        const recipeResults = await searchRecipesAlgolia(searchTerms || userText);
                        searchContext += `\nMatching Recipes:\n${recipeResults.text}\n`;
                        foundRecipes = recipeResults.recipes;
                    }

                    searchContext += '\n[END SEARCH RESULTS]\n\nPlease use the above real data to answer the user\'s question:';
                    contextualPrompt = searchContext + '\n\nUser Question: ' + userText;
                    setIsSearching(false);
                }

                // STREAMING: Send to AI and stream response
                const result = await chatSessionRef.current.sendMessageStream(contextualPrompt);

                let fullText = '';
                for await (const chunk of result.stream) {
                    const chunkText = chunk.text();
                    fullText += chunkText;

                    // Update message with streamed text
                    setMessages(prev => prev.map(msg =>
                        msg.id === agentMsgId
                            ? { ...msg, text: fullText }
                            : msg
                    ));
                }

                // After streaming completes, add product/recipe cards
                setMessages(prev => prev.map(msg =>
                    msg.id === agentMsgId
                        ? {
                            ...msg,
                            isStreaming: false,
                            productCards: foundProducts.length > 0 ? foundProducts : undefined,
                            recipeCards: foundRecipes.length > 0 ? foundRecipes : undefined
                        }
                        : msg
                ));
            } else {
                throw new Error('Chat session not available');
            }
        } catch (error: any) {
            console.error("Error communicating with AI:", error);

            let errorMessage = "I apologize, but I'm temporarily unavailable. Please try again in a moment.";

            if (error.message?.includes('429') || JSON.stringify(error).includes('429')) {
                errorMessage = "Support Quota Exceeded: The AI API key has reached its free tier limit. Please check your Google AI Studio quota or provide a fresh API key.";
            }

            setMessages(prev => prev.map(msg =>
                msg.id === agentMsgId
                    ? { ...msg, text: errorMessage, isStreaming: false }
                    : msg
            ));
        } finally {
            setIsTyping(false);
            setIsSearching(false);
        }
    };

    // Render product card
    const renderProductCard = (product: ProductCard) => (
        <div key={product.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-2xl">🥬</span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-black truncate">{product.name}</p>
                <p className="text-xs text-gray-500">{product.category} • ${product.price.toFixed(2)}</p>
            </div>
            <div className="flex gap-1">
                <button
                    onClick={() => handleAddToCart(product.id)}
                    className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all active:scale-95"
                    title="Add to Cart"
                >
                    <ShoppingCart size={14} />
                </button>
                <button
                    onClick={() => handleViewProduct(product.id)}
                    className="p-2 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-all active:scale-95"
                    title="View Product"
                >
                    <ExternalLink size={14} />
                </button>
            </div>
        </div>
    );

    // Render recipe card
    const renderRecipeCard = (recipe: RecipeCard) => (
        <div
            key={recipe.id}
            onClick={() => handleViewRecipe(recipe.id)}
            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-black transition-all"
        >
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {recipe.image ? (
                    <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                ) : (
                    <BookOpen size={20} className="text-gray-400" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-black truncate">{recipe.title}</p>
                <p className="text-xs text-gray-500">{recipe.ingredientCount} ingredients</p>
            </div>
            <ExternalLink size={14} className="text-gray-400" />
        </div>
    );

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
                                <Search size={10} /> Searching Algolia...
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
                                    <p className="font-medium whitespace-pre-wrap">{msg.text || (msg.isStreaming ? '...' : '')}</p>
                                    <p className={`text-[9px] mt-2 font-bold uppercase tracking-widest ${msg.sender === 'user' ? 'text-gray-400' : 'text-gray-400'}`}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                {/* Product Cards */}
                                {msg.productCards && msg.productCards.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {msg.productCards.map(renderProductCard)}
                                    </div>
                                )}

                                {/* Recipe Cards */}
                                {msg.recipeCards && msg.recipeCards.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {msg.recipeCards.map(renderRecipeCard)}
                                    </div>
                                )}

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
                            onClick={() => handlePromptClick("What's in my cart?")}
                            className="whitespace-nowrap px-4 py-2 rounded-full bg-gray-100 text-[11px] font-bold text-black border border-black/5 hover:bg-black hover:text-white transition-all active:scale-95"
                        >
                            My cart?
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
