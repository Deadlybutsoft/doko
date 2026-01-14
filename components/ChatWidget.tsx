import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, ArrowUp, Trash2, Copy, Check, Search, ShoppingCart, ExternalLink, BookOpen } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { algoliasearch } from 'algoliasearch';
import { Message, Agent, Product, Recipe } from '../types';
import { products } from '../data';
import { useStore } from '../context/StoreContext';

// Initialize Algolia client
const algoliaClient = algoliasearch(
    import.meta.env.VITE_ALGOLIA_APP_ID,
    import.meta.env.VITE_ALGOLIA_SEARCH_KEY
);

// Extended message type with actions
interface ChatMessage extends Message {
    actions?: MessageAction[];
    recipeCards?: RecipeCard[];
    productCards?: ProductCard[];
}

interface MessageAction {
    type: 'add_to_cart' | 'view_product' | 'view_recipe';
    label: string;
    productId?: string;
    recipeId?: string;
    productName?: string;
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

// Search functions for Algolia retrieval
const searchIngredients = async (query: string): Promise<{ text: string; products: ProductCard[] }> => {
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
};

const searchRecipes = async (query: string): Promise<{ text: string; recipes: RecipeCard[] }> => {
    try {
        const { hits } = await algoliaClient.search([{
            indexName: 'food',
            params: { query, hitsPerPage: 3 }
        }]).then(res => res.results[0] as any);

        if (hits && hits.length > 0) {
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
        console.error('Recipe search error:', error);
        return { text: 'Unable to search recipes at the moment.', recipes: [] };
    }
};

const SYSTEM_PROMPT = `You are DOKO Support, a premium culinary assistant for a luxury grocery platform called DOKO.

YOUR CAPABILITIES:
1. Access to DOKO's inventory of 23,000+ premium ingredients.
2. Search professional recipes via Algolia.
3. Help users find ingredients, suggest recipes, and answer culinary questions.
4. Access to user's shopping cart, wishlist, and saved recipes.

BEHAVIOR:
- Concise responses (2-3 sentences).
- Helpful, sophisticated, knowledgeable tone.
- Use the [USER CONTEXT] provided in messages to answer questions about their cart/wishlist.
- Use [SEARCH RESULTS] for ingredient/recipe queries.
- Maintain a warm yet professional tone.`;

const INITIAL_MESSAGES: ChatMessage[] = [
    {
        id: '1',
        text: 'Welcome to Doko. I am Doko Support, your personal culinary concierge. How can I assist you with our ingredients or recipes today?',
        sender: 'agent',
        timestamp: new Date(),
    },
];

const AGENT: Agent = {
    name: 'Doko Support',
    avatar: '',
    status: 'online',
};

// Search keywords
const INGREDIENT_KEYWORDS = ['ingredient', 'have', 'stock', 'find', 'looking for', 'need', 'buy', 'purchase', 'get', 'available', 'tomato', 'cheese', 'chicken', 'beef', 'vegetable', 'fruit'];
const RECIPE_KEYWORDS = ['recipe', 'cook', 'make', 'prepare', 'dish', 'meal', 'dinner', 'lunch', 'breakfast', 'suggest'];

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
    const chatSessionRef = useRef<any>(null);

    // Build fresh user context
    const getFreshContext = () => {
        const cartStr = cart.length === 0 ? 'Empty' : cart.map(i => `${i.name} (x${i.quantity})`).join(', ');
        const wishlistStr = wishlist.length === 0 ? 'Empty' : wishlist.map(id => getProduct(id)?.name).filter(Boolean).join(', ');
        const recipesStr = savedRecipes.length === 0 ? 'None' : savedRecipes.map(r => r.title).join(', ');

        return `[USER CONTEXT]
Cart: ${cartStr} (Total: $${cartTotal.toFixed(2)})
Wishlist: ${wishlistStr}
Saved Recipes: ${recipesStr}
[END CONTEXT]`;
    };

    const initChat = () => {
        const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
        if (!apiKey) return null;
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: SYSTEM_PROMPT
        });
        return model.startChat({
            history: [
                { role: "user", parts: [{ text: "Hello" }] },
                { role: "model", parts: [{ text: INITIAL_MESSAGES[0].text }] },
            ]
        });
    };

    useEffect(() => {
        chatSessionRef.current = initChat();
    }, []);

    const toggleChat = () => setIsOpen(!isOpen);

    const handleClearChat = () => {
        setMessages(INITIAL_MESSAGES);
        chatSessionRef.current = initChat();
    };

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
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
        }
    };

    const handleCopy = async (id: string, text: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleAddToCart = (productId: string) => {
        const product = getProduct(productId);
        if (product) {
            addToCart(product, 1);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: `✓ Added "${product.name}" to your cart!`,
                sender: 'agent',
                timestamp: new Date(),
            }]);
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

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim() || isTyping) return;

        const userText = inputValue.trim();
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            text: userText,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        setIsTyping(true);
        const agentMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, {
            id: agentMsgId,
            text: '',
            sender: 'agent',
            timestamp: new Date(),
        }]);

        try {
            if (!chatSessionRef.current) chatSessionRef.current = initChat();

            const lowerText = userText.toLowerCase();
            const needsSearch = INGREDIENT_KEYWORDS.some(k => lowerText.includes(k)) || RECIPE_KEYWORDS.some(k => lowerText.includes(k));

            let searchResultsText = '';
            let foundProducts: ProductCard[] = [];
            let foundRecipes: RecipeCard[] = [];

            if (needsSearch) {
                setIsSearching(true);
                const terms = userText.split(' ').slice(0, 3).join(' ');
                const [ingRes, recRes] = await Promise.all([
                    searchIngredients(terms),
                    searchRecipes(terms)
                ]);
                searchResultsText = `\n[SEARCH RESULTS]\n${ingRes.text}\n${recRes.text}\n`;
                foundProducts = ingRes.products;
                foundRecipes = recRes.recipes;
                setIsSearching(false);
            }

            const finalPrompt = `${getFreshContext()}\n${searchResultsText}\nUser Query: ${userText}`;
            const result = await chatSessionRef.current.sendMessageStream(finalPrompt);

            let fullText = '';
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                fullText += chunkText;
                setMessages(prev => prev.map(msg =>
                    msg.id === agentMsgId ? { ...msg, text: fullText } : msg
                ));
            }

            // Add final cards
            if (foundProducts.length > 0 || foundRecipes.length > 0) {
                setMessages(prev => prev.map(msg =>
                    msg.id === agentMsgId ? {
                        ...msg,
                        productCards: foundProducts,
                        recipeCards: foundRecipes
                    } : msg
                ));
            }

        } catch (error: any) {
            console.error("Chat Error:", error);
            const errorMsg = error.message?.includes('429')
                ? "Quota exceeded. Please try again later."
                : "Something went wrong. Please try again.";

            setMessages(prev => prev.map(msg =>
                msg.id === agentMsgId ? { ...msg, text: errorMsg } : msg
            ));
        } finally {
            setIsTyping(false);
            setIsSearching(false);
        }
    };

    // Card Renderers
    const renderProductCard = (p: ProductCard) => (
        <div key={p.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm mt-2">
            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <span className="m-auto">🥬</span>}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{p.name}</p>
                <p className="text-xs text-gray-500">${p.price.toFixed(2)}</p>
            </div>
            <div className="flex gap-1">
                <button onClick={() => handleAddToCart(p.id)} className="p-2 bg-black text-white rounded-lg hover:bg-gray-800"><ShoppingCart size={14} /></button>
                <button onClick={() => handleViewProduct(p.id)} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><ExternalLink size={14} /></button>
            </div>
        </div>
    );

    const renderRecipeCard = (r: RecipeCard) => (
        <div key={r.id} onClick={() => handleViewRecipe(r.id)} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm mt-2 cursor-pointer hover:border-black transition-all">
            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {r.image ? <img src={r.image} className="w-full h-full object-cover" /> : <BookOpen size={16} className="m-auto text-gray-400" />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{r.title}</p>
                <p className="text-xs text-gray-500">{r.ingredientCount} ingredients</p>
            </div>
            <ExternalLink size={14} className="text-gray-400" />
        </div>
    );

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end font-sans">
            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .message-fade-in { animation: fadeIn 0.3s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse-search { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                .searching { animation: pulse-search 1s ease-in-out infinite; }
            `}</style>

            <div className={`transition-all duration-500 transform origin-bottom-right mb-6 w-[380px] sm:w-[480px] h-[720px] max-h-[85vh] bg-white rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden border border-gray-100 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}>
                {/* Header */}
                <div className="bg-white px-7 py-6 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-xl text-black">Doko Support</h3>
                        <span className={`w-2 h-2 rounded-full ${isSearching ? 'bg-blue-500 searching' : 'bg-green-500 animate-pulse'}`}></span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={handleClearChat} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                        <button onClick={toggleChat} className="text-gray-400 hover:text-black transition-colors"><X size={22} /></button>
                    </div>
                </div>

                {/* Messages */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto pt-8 px-7 space-y-7 hide-scrollbar scroll-smooth">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} message-fade-in`}>
                            <div className="max-w-[85%] relative group">
                                <div className={`px-5 py-4 rounded-[1.75rem] text-[15px] leading-relaxed ${msg.sender === 'user' ? 'bg-black text-white rounded-tr-none' : 'bg-gray-100 text-black rounded-tl-none'}`}>
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                    <span className="text-[9px] mt-2 block opacity-50 font-bold uppercase tracking-widest">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                {msg.productCards?.map(renderProductCard)}
                                {msg.recipeCards?.map(renderRecipeCard)}
                                <button onClick={() => handleCopy(msg.id, msg.text)} className={`absolute top-1 p-1.5 bg-white border rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity ${msg.sender === 'user' ? '-left-8' : '-right-8'}`}>
                                    {copiedId === msg.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                </button>
                            </div>
                        </div>
                    ))}
                    {isTyping && messages[messages.length - 1]?.sender === 'user' && (
                        <div className="flex justify-start px-5 py-4 bg-gray-100 rounded-[1.75rem] w-max ml-7 space-x-1 animate-pulse">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                        </div>
                    )}
                    <div className="h-10 shrink-0" />
                </div>

                {/* Input */}
                <div className="px-5 pt-2 pb-2 bg-white border-t">
                    <div className="flex gap-2 mb-3 overflow-x-auto hide-scrollbar px-1">
                        {["Anything keto?", "Pasta recipe?", "What's in my cart?"].map(p => (
                            <button key={p} onClick={() => handlePromptClick(p)} className="whitespace-nowrap px-4 py-2 bg-gray-100 rounded-full text-[11px] font-bold border border-black/5 hover:bg-black hover:text-white transition-all">{p}</button>
                        ))}
                    </div>
                    <form onSubmit={handleSendMessage} className="relative flex items-center gap-3 bg-gray-50 border-[1.5px] border-black rounded-[2rem] px-6 py-3">
                        <textarea ref={textareaRef} value={inputValue} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="Ask about recipes or ingredients..." rows={1} className="flex-1 bg-transparent border-none py-1 text-[16px] font-semibold focus:ring-0 outline-none resize-none max-h-[150px] hide-scrollbar" />
                        <button type="submit" disabled={!inputValue.trim() || isTyping} className={`p-2 rounded-2xl transition-all ${inputValue.trim() && !isTyping ? 'bg-black text-white scale-100' : 'bg-gray-200 text-gray-400 scale-95'}`}><ArrowUp size={20} strokeWidth={3} /></button>
                    </form>
                    <div className="text-center mt-1"><span className="text-[10px] font-medium text-gray-400">Powered by <span className="text-blue-400">Algolia</span></span></div>
                </div>
            </div>

            {/* FAB */}
            <button onClick={toggleChat} className={`flex items-center justify-center h-16 rounded-[2rem] px-6 transition-all duration-500 shadow-xl ${isOpen ? 'bg-black w-32' : 'bg-white border w-36 space-x-3'}`}>
                {isOpen ? <X className="text-white" size={24} /> : (
                    <>
                        <div className="relative"><MessageCircle size={26} className="text-black" /><div className="absolute -top-1 -right-1 w-3 h-3 bg-[#C6A355] rounded-full border-2 border-white"></div></div>
                        <span className="font-bold text-black">Support</span>
                    </>
                )}
            </button>
        </div>
    );
};

export default ChatWidget;
