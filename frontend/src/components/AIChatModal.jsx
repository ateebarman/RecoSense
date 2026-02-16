import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    Send,
    Sparkles,
    Bot,
    User,
    Loader2,
    AlertCircle,
    MessageSquare,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAIAnalysis, askAIQuestion } from '../services/api';

const AIChatWorkspace = ({ asin, productTitle, isOpen, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(true);
    const [error, setError] = useState(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (isOpen && asin && messages.length === 0) {
            initialAnalysis();
        }
    }, [isOpen, asin]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const initialAnalysis = async () => {
        try {
            setAnalyzing(true);
            setError(null);
            const res = await getAIAnalysis(asin);
            setMessages([{
                role: 'assistant',
                content: res.data.analysis
            }]);
        } catch (err) {
            setError('Failed to reach RecoSense AI. Check key or connection.');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const history = messages.map(m => ({ role: m.role, content: m.content }));
            const res = await askAIQuestion({ asin, question: userMsg, history });
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.answer }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'I encountered an error. Please try again.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="ai-workspace-overlay">
                    <motion.div
                        className="ai-workspace-box"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    >
                        {/* Header */}
                        <div className="ai-workspace-header">
                            <div className="flex items-center gap-3">
                                <Sparkles size={20} className="text-[#8b5cf6]" />
                                <span className="text-white font-bold tracking-tight">RecoSense AI</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 rounded-full text-[#94a3b8] transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div ref={scrollRef} className="ai-workspace-content scroll-smooth">
                            {analyzing ? (
                                <div className="ai-workspace-welcome">
                                    <div className="ai-workspace-avatar">
                                        <Bot size={40} />
                                    </div>
                                    <h2 className="text-white">Analyzing Product...</h2>
                                    <p>I'm reading community sentiment and technical specs to give you a summary.</p>
                                    <div className="mt-8">
                                        <Loader2 className="animate-spin text-[#8b5cf6] mx-auto" size={32} />
                                    </div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="ai-workspace-welcome">
                                    <div className="ai-workspace-avatar">
                                        <Bot size={40} />
                                    </div>
                                    <h2 className="text-white">Hello!</h2>
                                    <p>I'm your AI shopping assistant. Ask me anything about <strong>{productTitle}</strong>!</p>

                                    <div className="grid grid-cols-2 gap-4 mt-12 max-w-md mx-auto">
                                        {['Is it worth it?', 'Battery life?', 'Camera quality?', 'Compare price'].map(q => (
                                            <button
                                                key={q}
                                                onClick={() => { setInput(q); }}
                                                className="p-4 bg-white/5 border border-white/5 rounded-2xl text-xs text-white hover:bg-white/10 transition-colors"
                                            >
                                                "{q}"
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    {messages.map((m, idx) => (
                                        <div
                                            key={idx}
                                            className={`ai-workspace-msg ${m.role === 'user' ? 'ai-workspace-user' : 'ai-workspace-bot'
                                                }`}
                                        >
                                            {m.content}
                                        </div>
                                    ))}
                                    {loading && (
                                        <div className="ai-workspace-msg ai-workspace-bot animate-pulse">
                                            Thinking...
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer Input */}
                        <div className="ai-workspace-footer">
                            <form onSubmit={handleSend} className="ai-workspace-input-bar">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your question here..."
                                    disabled={loading || analyzing}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || loading || analyzing}
                                    className={`ai-workspace-send ${input.trim() ? 'active' : ''}`}
                                >
                                    <Send size={20} />
                                </button>
                            </form>
                            <div className="mt-4 flex justify-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-dim">Active Shopping Session</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AIChatWorkspace;
