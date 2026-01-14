import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X } from 'lucide-react';
import instantsearch from 'instantsearch.js';
import { chat } from 'instantsearch.js/es/widgets';
import { useStore } from '../context/StoreContext';

const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { addToCart, allProducts } = useStore();
    const searchInstance = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!searchInstance.current) {
            searchInstance.current = instantsearch({
                indexName: 'food', // Generic index, the chat uses agentId mainly
                searchClient: {
                    search: () => Promise.resolve({ results: [] }) as any, // Mock client as chat uses transport
                },
            });

            searchInstance.current.addWidgets([
                chat({
                    container: '#ais-chat-container',
                    agentId: import.meta.env.VITE_ALGOLIA_AGENT_ID,
                    templates: {
                        header: {
                            titleText: 'Doko Steward',
                        }
                    },
                    cssClasses: {
                        root: 'doko-chat-root',
                        container: 'doko-chat-container',
                        header: {
                            root: 'doko-chat-header',
                            title: 'doko-chat-title',
                        },
                        messages: {
                            root: 'doko-chat-messages',
                            content: 'doko-chat-messages-content',
                        },
                        message: {
                            root: 'doko-chat-message',
                            container: 'doko-chat-message-container',
                        },
                        prompt: {
                            root: 'doko-chat-prompt',
                            textarea: 'doko-chat-textarea',
                            submit: 'doko-chat-submit',
                        }
                    },
                    tools: {
                        addToCart: {
                            templates: {
                                layout: ({ message }: any, { html }: any) => {
                                    const input = message.input as any;
                                    return html`
                                        <div class="bg-black/5 p-3 rounded-xl border border-black/10 text-xs">
                                            <p class="font-bold">🛒 Purchasing Logic</p>
                                            <p class="opacity-60">Adding ${input.objectID} to bag...</p>
                                        </div>
                                    `;
                                }
                            },
                            onToolCall: async ({ message, addToolResult }: any) => {
                                const input = message.input as any;
                                const product = allProducts.find(p => p.id === input.objectID);
                                if (product) {
                                    addToCart(product, 1);
                                    addToolResult({
                                        output: {
                                            text: `Successfully added ${product.name} to your bag.`,
                                            done: true,
                                        }
                                    });
                                } else {
                                    addToolResult({
                                        output: {
                                            text: `I couldn't find that product in our catalog.`,
                                            done: false,
                                        }
                                    });
                                }
                            }
                        }
                    }
                })
            ]);

            searchInstance.current.start();
        }

        return () => {
            if (searchInstance.current) {
                searchInstance.current.dispose();
                searchInstance.current = null;
            }
        };
    }, [allProducts, addToCart]);

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end font-sans">
            <style>{`
        .doko-chat-root {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: white;
        }
        .doko-chat-container {
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        .doko-chat-header {
          display: none; /* We use our own header */
        }
        .doko-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          background: #fafafa;
        }
        .ais-Chat-message--user .ais-Chat-message-container {
            background: black !important;
            color: white !important;
            border-radius: 1.5rem 1.5rem 0 1.5rem !important;
        }
        .ais-Chat-message--assistant .ais-Chat-message-container {
            background: #f3f4f6 !important;
            color: black !important;
            border-radius: 1.5rem 1.5rem 1.5rem 0 !important;
        }
        .doko-chat-prompt {
            padding: 1.5rem;
            border-top: 1px solid #f3f4f6;
            background: white;
        }
        .doko-chat-textarea {
            width: 100%;
            border: 1.5px solid #e5e7eb;
            border-radius: 1rem;
            padding: 0.75rem 1rem;
            font-weight: 600;
            outline: none;
            transition: all 0.2s;
            resize: none;
        }
        .doko-chat-textarea:focus {
            border-color: black;
            background: white;
        }
        .doko-chat-submit {
            background: black;
            color: white;
            border-radius: 0.75rem;
            padding: 0.5rem 1rem;
            font-weight: bold;
            margin-top: 0.5rem;
        }
        @keyframes slideIn {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .label-animate {
          animation: slideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>

            {/* Chat Window */}
            <div
                className={`
          transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) transform origin-bottom-right
          ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8 pointer-events-none'}
          mb-6 w-[350px] sm:w-[420px] h-[650px] max-h-[85vh]
          bg-white rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden border border-gray-100
        `}
            >
                {/* Header */}
                <div className="bg-white px-7 py-6 flex items-center justify-between border-b border-gray-100 shrink-0">
                    <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-xl tracking-tight text-black flex items-center leading-none">
                            Doko Steward
                        </h3>
                        <span className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        </span>
                    </div>

                    <button
                        onClick={toggleChat}
                        className="text-gray-400 hover:text-black p-2 rounded-full transition-all"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Algolia Chat Container */}
                <div id="ais-chat-container" className="flex-1 overflow-hidden" />

                {/* Brand Footer */}
                <div className="flex justify-center items-center py-3 border-t border-gray-50 bg-white">
                    <span className="text-[10px] font-medium text-gray-400/80">Powered by <span className="text-blue-400">Algolia Agent Studio</span></span>
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
                            Steward
                        </span>
                    </>
                )}
            </button>
        </div>
    );
};

export default ChatWidget;
