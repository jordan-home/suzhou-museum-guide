"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, MicOff } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t bg-white">
      <Input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="问我关于苏州博物馆的一切..."
        disabled={disabled}
        className="flex-1"
        style={{ borderRadius: "var(--szm-radius-xl, 16px)" }}
      />
      <Button
        type="submit"
        disabled={!text.trim() || disabled}
        size="icon"
        className="shrink-0"
        style={{
          backgroundColor: "var(--szm-blue, #6B9E8C)",
          borderRadius: "var(--szm-radius-full, 9999px)",
          width: 44,
          height: 44,
        }}
      >
        <Send size={18} />
      </Button>
    </form>
  );
}