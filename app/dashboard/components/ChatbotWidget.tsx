'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
}

const EXAMPLE_QUERIES = [
  'Which district had the highest rainfall?',
  'What was the max rainfall in NASHIK?',
  'Compare coastal vs inland district rainfall',
  'Why does Konkan receive heavy rainfall?',
  'Show rainfall trend in Marathwada',
  'Which day had the highest single-day rainfall?',
];

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
      if (!hasGreeted) {
        setHasGreeted(true);
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content:
              '👋 Hello! I\'m your **Maharashtra Rainfall AI Assistant**.\n\nI can answer questions about district-wise rainfall data, help you identify patterns, and explain meteorological science behind Maharashtra\'s monsoon.\n\nAsk me anything about the rainfall dataset, or click one of the example queries below!',
          },
        ]);
      }
    }
  }, [isOpen, hasGreeted]);

  const sendMessage = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        suggestions: data.suggestions,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Sorry, I encountered an error: ${err.message}. Please try again.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatContent = (content: string) => {
    // Format **bold** text and section headers
    return content
      .replace(/\*\*(📊[^*]+)\*\*/g, '<span class="text-blue-700 font-bold text-sm">$1</span>')
      .replace(/\*\*(🔬[^*]+)\*\*/g, '<span class="text-emerald-700 font-bold text-sm">$1</span>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(📊[^*]+)\*/g, '<span class="text-blue-700 font-semibold text-sm">$1</span>')
      .replace(/\*(🔬[^*]+)\*/g, '<span class="text-emerald-700 font-semibold text-sm">$1</span>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-slate-700 hover:bg-slate-800 scale-90'
            : 'bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 scale-100 hover:scale-105'
        }`}
        title={isOpen ? 'Close chatbot' : 'Open AI Research Assistant'}
      >
        {isOpen ? (
          // Close / minimize icon
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          // Chat icon
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        )}
        {/* Pulse indicator when closed */}
        {!isOpen && (
          <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
        style={{ height: '560px' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-t-2xl px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">Maharashtra Rainfall AI</p>
            <p className="text-blue-200 text-xs">Powered by Gemini • IMD Data</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-300 text-xs font-medium">Live</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
          {messages.map((msg) => (
            <div key={msg.id}>
              <div
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-tr-sm'
                      : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm'
                  }`}
                  dangerouslySetInnerHTML={
                    msg.role === 'assistant'
                      ? { __html: formatContent(msg.content) }
                      : undefined
                  }
                >
                  {msg.role === 'user' ? msg.content : undefined}
                </div>
              </div>

              {/* Smart suggestions */}
              {msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-2 ml-9 flex flex-col gap-1.5">
                  <p className="text-xs text-black font-bold">You may also ask:</p>
                  {msg.suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className="text-left text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full border border-blue-100 hover:border-blue-200 transition-colors"
                    >
                      💬 {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Loading animation */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                </svg>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {/* Example queries (shown when only welcome message) */}
          {messages.length === 1 && messages[0].id === 'welcome' && !isLoading && (
            <div className="space-y-2 pt-1">
              <p className="text-xs text-black font-bold px-1">✨ Try asking:</p>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_QUERIES.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 border border-blue-100 px-2.5 py-1.5 rounded-full transition-colors text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-100 p-3 flex-shrink-0 bg-white rounded-b-2xl">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about rainfall data or meteorology…"
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none text-sm border-2 border-gray-400 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder:text-black placeholder:font-bold disabled:bg-gray-50 disabled:text-gray-900 max-h-24 overflow-y-auto text-black font-bold"
              style={{ lineHeight: '1.5' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:from-gray-200 disabled:to-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-sm"
            >
              {isLoading ? (
                <svg className="w-4 h-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-center text-xs text-gray-300 mt-2">Press Enter to send • Shift+Enter for newline</p>
        </div>
      </div>
    </>
  );
}
