"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatPanelProps {
  documentId?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function ChatPanel({ documentId }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!input.trim() || isSending) return;
    const question = input.trim();

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setError(null);
    setIsSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, documentId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Chat.");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer ?? "Keine Antwort." },
      ]);
    } catch (err: any) {
      setError(err.message ?? "Fehler beim Chat.");
    } finally {
      setIsSending(false);
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto space-y-2 p-3 text-sm">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Stelle eine Frage an die KI. In einer späteren Version wird sie den
            Inhalt deines Dokuments mit einbeziehen.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "text-right text-foreground"
                : "text-left text-muted-foreground"
            }
          >
            {m.content}
          </div>
        ))}
      </div>
      <div className="border-t p-3 space-y-2">
        <Textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Frag die KI – z. B. bitte um eine Erklärung oder Lernhilfe."
        />
        <Button className="w-full" onClick={send} disabled={isSending || !input.trim()}>
          {isSending ? "Sende..." : "Senden"}
        </Button>
        {error && (
          <p className="text-xs text-destructive text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
