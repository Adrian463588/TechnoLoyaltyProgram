"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Loader2, Sparkles, User, Bot, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ChatbotWidget() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: "Halo! Saya LoyaltyBot. Ada yang bisa saya bantu terkait program loyalitas hari ini?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, messages]);

  const handleClear = () => {
    setMessages([
      { id: "welcome", role: "assistant", content: "Chat telah dihapus. Ada yang bisa saya bantu lagi?" }
    ]);
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    try {
      // Create a placeholder for the assistant's streaming response
      const assistantId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      const response = await fetch("/api/chatbot/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          userRole: session?.user?.role ?? "MITRA",
          userName: session?.user?.name ?? "Karyawan",
        }),
      });

      if (!response.ok) {
        let errorMsg = `Gagal menyambung ke chatbot (Status: ${response.status})`;
        try {
          const errData = await response.json();
          if (errData?.error) errorMsg = errData.error;
          else if (errData?.details) errorMsg = errData.details;
        } catch (e) {
          // ignore
        }
        throw new Error(errorMsg);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                assistantMessage += data.text;
                // Update the last message (the assistant placeholder) with the accumulated text
                setMessages((prev) => 
                  prev.map(m => m.id === assistantId ? { ...m, content: assistantMessage } : m)
                );
              }
            } catch (e) {
              console.error("Error parsing SSE chunk:", e);
            }
          }
        }
      }
    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { id: Date.now().toString(), role: "assistant", content: `Error: ${error.message || "Terjadi kesalahan"}` }
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [messages, session]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  const renderMessage = (content: string) => {
    if (!content) return null;
    
    const lines = content.split("\n");
    let currentList: { type: "ul" | "ol"; items: React.ReactNode[] } | null = null;
    const result: React.ReactNode[] = [];

    const processText = (text: string) => {
      // Handle bold **text** and italic *text* or _text_
      const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|__.*?__|_.*?_)/g);
      return parts.map((part, i) => {
        if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
          return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
        }
        if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
          return <em key={i} className="italic">{part.slice(1, -1)}</em>;
        }
        return part;
      });
    };

    const flushList = (key: number) => {
      if (currentList) {
        const ListTag = currentList.type;
        result.push(
          <ListTag key={`list-${key}`} className={cn(
            "my-2 ml-4 space-y-1",
            currentList.type === "ul" ? "list-disc" : "list-decimal"
          )}>
            {currentList.items.map((item, i) => (
              <li key={i} className="pl-1">{item}</li>
            ))}
          </ListTag>
        );
        currentList = null;
      }
    };

    lines.forEach((line, index) => {
      // Check for bullet point: * item or - item
      const bulletMatch = line.match(/^(\s*)[\*\-]\s+(.*)/);
      // Check for numbered list: 1. item
      const numberMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);

      if (bulletMatch) {
        if (!currentList || currentList.type !== "ul") {
          flushList(index);
          currentList = { type: "ul", items: [] };
        }
        currentList.items.push(processText(bulletMatch[2] ?? ""));
      } else if (numberMatch) {
        if (!currentList || currentList.type !== "ol") {
          flushList(index);
          currentList = { type: "ol", items: [] };
        }
        currentList.items.push(processText(numberMatch[3] ?? ""));
      } else {
        flushList(index);
        if (line.trim() === "") {
          result.push(<div key={index} className="h-2" />);
        } else {
          result.push(<div key={index} className="mb-1">{processText(line)}</div>);
        }
      }
    });

    flushList(lines.length);
    return result;
  };

  // Only render if session exists (user is logged in)
  if (!session) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="pointer-events-auto bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] shadow-2xl rounded-2xl w-[380px] max-w-[calc(100vw-2rem)] h-[550px] max-h-[calc(100vh-8rem)] flex flex-col mb-4 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[var(--color-surface)] px-4 py-3 border-b border-[var(--color-border-subtle)] flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--color-text-primary)] text-sm">LoyaltyBot</h3>
                  <p className="text-[10px] text-[var(--color-text-tertiary)] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    AI Assistant Active
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClear}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-base)] hover:text-[var(--color-text-primary)] transition-colors"
                  title="Clear Chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-base)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[var(--color-surface)]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 shrink-0 rounded-full flex items-center justify-center",
                    msg.role === "user" ? "bg-[var(--color-bg-subtle)]" : "bg-[var(--color-primary)]"
                  )}>
                    {msg.role === "user" ? <User className="w-4 h-4 text-[var(--color-text-secondary)]" /> : <Bot className="w-4 h-4 text-white" />}
                  </div>
                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm",
                    msg.role === "user" 
                      ? "bg-[var(--color-primary)] text-white rounded-tr-sm" 
                      : "bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] rounded-tl-sm"
                  )}>
                    {renderMessage(msg.content)}
                    {msg.content === "" && msg.role === "assistant" && (
                       <span className="flex items-center gap-1 h-5 mt-1">
                         <span className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce [animation-delay:-0.3s]" />
                         <span className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce [animation-delay:-0.15s]" />
                         <span className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce" />
                       </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-[var(--color-surface)] border-t border-[var(--color-border-subtle)]">
              <div className="relative flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ketik pesan Anda..."
                  className="w-full pl-4 pr-12 py-3 bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]/40 transition-all placeholder:text-[var(--color-text-muted)] text-[var(--color-text-primary)]"
                  disabled={isTyping}
                />
                <button
                  onClick={() => void sendMessage(input)}
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 p-2 rounded-lg bg-[var(--color-primary)] text-white disabled:opacity-40 disabled:bg-slate-300 transition-colors"
                >
                  {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "pointer-events-auto flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-300 hover:scale-105 active:scale-95",
          isOpen ? "bg-slate-800 text-white" : "bg-[var(--color-primary)] text-white"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
}
