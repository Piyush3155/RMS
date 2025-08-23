"use client"
import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, X, Loader2 } from "lucide-react";

const AIAssistantPage = ({ onClose }: { onClose?: () => void }) => {
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  // Call the backend AI API and show typing indicator while waiting
  const callAI = async (userMessage: string) => {
    setIsTyping(true);
    try {
      const res = await fetch("/api/v1/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage }),
      });

      const payload = await res.json();

      if (!res.ok) {
        const errMsg = payload?.error || payload?.message || "Failed to fetch AI response.";
        setMessages((prev) => [...prev, { text: `Error: ${errMsg}`, isUser: false }]);
        return;
      }

      // API is expected to return { message: string, data: [...] }
      const aiMessage = payload?.message ?? "No response from assistant.";
      setMessages((prev) => [...prev, { text: aiMessage, isUser: false }]);

      // Optionally append raw data as a follow-up message for debugging/visibility (kept minimal)
      if (payload?.data && Array.isArray(payload.data) && payload.data.length > 0) {
        // Keep JSON compact to avoid huge messages; user can extend as needed
        const dataPreview = JSON.stringify(payload.data.slice(0, 5), null, 2);
        setMessages((prev) => [...prev, { text: `Data: ${dataPreview}`, isUser: false }]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setMessages((prev) => [...prev, { text: `Error: ${msg}`, isUser: false }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() === "") return;

    const userMessage = input;
    setMessages((prev) => [...prev, { text: userMessage, isUser: true }]);
    setInput("");

    // Call backend AI
    await callAI(userMessage);
  };

  const clearChat = () => {
    setMessages([]);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="w-full max-w-xl mx-auto h-[600px] bg-gradient-to-br from-slate-50 to-amber-50 rounded-xl overflow-hidden shadow-sm border border-amber-100 relative">
      {/* optional close from parent */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 text-amber-400 hover:text-amber-600 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Header */}
      <div className="bg-amber-100/60 backdrop-blur-sm p-4 border-b border-amber-100 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Sparkles className="text-amber-300 h-5 w-5" />
          <h2 className="text-gray-800 font-medium">AI Assistant</h2>
        </div>
        <button
          onClick={clearChat}
          className="text-amber-400 hover:text-amber-600 transition-colors"
          aria-label="Clear chat"
        >
         
        </button>
      </div>

      {/* Messages container */}
      <div className="p-4 h-[calc(100%-132px)] overflow-y-auto bg-slate-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="h-12 w-12 text-amber-300 mb-4" />
            <h3 className="text-gray-800 text-xl mb-2">How can I help you today?</h3>
            <p className="text-gray-600 text-sm max-w-xs">
              Ask me anything and I&apos;ll do my best to assist you!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.isUser
                      ? "bg-amber-300 text-gray-900 rounded-tr-none"
                      : "bg-white text-gray-800 rounded-tl-none border border-slate-200"
                  } animate-fade-in`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-2xl bg-white text-gray-700 rounded-tl-none border border-slate-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-amber-200 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-amber-200 animate-pulse delay-75"></div>
                    <div className="w-2 h-2 rounded-full bg-amber-200 animate-pulse delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className={`p-4 border-t ${isFocused ? "border-amber-300/60 bg-white" : "border-slate-100 bg-white"} transition-colors duration-200`}
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Type your message..."
            className="w-full bg-white border border-slate-200 rounded-full py-3 pl-4 pr-12 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300/70"
          />
          <button
            type="submit"
            disabled={input.trim() === ""}
            className={`absolute right-1 rounded-full p-2 ${
              input.trim() === ""
                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                : "text-gray-900 bg-amber-300 hover:bg-amber-200"
            } transition-colors`}
            aria-label="Send message"
          >
            {isTyping ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>

      <style>
        {`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }

        .delay-75 {
          animation-delay: 0.2s;
        }

        .delay-150 {
          animation-delay: 0.4s;
        }
        `}
      </style>
    </div>
  );
};

export default AIAssistantPage;
