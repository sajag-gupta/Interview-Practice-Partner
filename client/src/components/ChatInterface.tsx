import { useState, useEffect, useRef } from "react";
import { Send, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message } from "@shared/schema";

interface ChatInterfaceProps {
  messages?: Message[];
  onSendMessage?: (message: string) => void;
  isTyping?: boolean;
}

export function ChatInterface({ messages = [], onSendMessage, isTyping = false }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string>("");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSpeak = (text: string) => {
    speakText(text);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage?.(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">
                Start the interview to begin chatting...
              </p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              data-testid={`message-${message.role}-${message.id}`}
            >
              <div
                className={`max-w-[80%] rounded-md p-4 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : message.role === "system"
                    ? "bg-yellow-500/10 text-yellow-900 dark:text-yellow-100 border border-yellow-500/20"
                    : "bg-muted"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm flex-1">{message.content}</p>
                  {message.role === "assistant" && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 shrink-0"
                      onClick={() => handleSpeak(message.content)}
                    >
                      <Volume2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-md p-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-foreground rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-foreground rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                  <div className="w-2 h-2 bg-foreground rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && !isTyping && handleSend()}
            placeholder={isTyping ? "AI is processing..." : "Type your response... (Use /end, /feedback, or /change role for commands)"}
            data-testid="input-chat-message"
            disabled={isTyping}
          />
          <Button onClick={handleSend} size="icon" data-testid="button-send-message" disabled={!input.trim() || isTyping}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
