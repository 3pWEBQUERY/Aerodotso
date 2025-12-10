"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  MessageCircle,
  Trash2,
  Pencil,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Globe,
  ArrowUp,
  Search,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RotateCcw,
  Check,
  FolderSearch,
  PanelRight,
  X,
  Home,
  ChevronRight,
  Upload,
  FileSearch,
  Image as ImageIcon,
  FileText,
  Link2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// AI Model definitions
interface AIModel {
  id: string;
  name: string;
  provider: "eden" | "openai" | "anthropic" | "google";
  icon: string;
}

const AI_MODELS: AIModel[] = [
  { id: "best", name: "Best", provider: "eden", icon: "✦" },
  { id: "gpt-5.1", name: "GPT-5.1", provider: "openai", icon: "◐" },
  { id: "gpt-5", name: "GPT-5", provider: "openai", icon: "◐" },
  { id: "gpt-4o", name: "GPT-4o", provider: "openai", icon: "◐" },
  { id: "claude-haiku-4.5", name: "Claude Haiku 4.5", provider: "anthropic", icon: "✳" },
  { id: "claude-sonnet-4.5", name: "Claude Sonnet 4.5", provider: "anthropic", icon: "✳" },
  { id: "claude-opus-4.5", name: "Claude Opus 4.5", provider: "anthropic", icon: "✳" },
  { id: "gemini-3-pro", name: "Gemini 3 Pro", provider: "google", icon: "✦" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "google", icon: "✦" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "google", icon: "✦" },
];

const PROVIDER_LABELS: Record<string, string> = {
  eden: "Eden",
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
};

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  browsedFiles?: boolean;
  rating?: "up" | "down" | null;
}

// Helper function to render message content with image support
const renderMessageLine = (line: string, index: number) => {
  // Check for markdown image syntax: ![alt](url)
  const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const imageUrlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg|avif))/gi;
  
  // Check for markdown images
  if (markdownImageRegex.test(line)) {
    const parts = line.split(markdownImageRegex);
    return (
      <div key={index} className="my-2">
        {line.match(markdownImageRegex)?.map((match, i) => {
          const urlMatch = match.match(/!\[([^\]]*)\]\(([^)]+)\)/);
          if (urlMatch) {
            return (
              <img
                key={i}
                src={urlMatch[2]}
                alt={urlMatch[1] || "Image"}
                className="max-w-full h-auto rounded-lg shadow-sm my-2"
              />
            );
          }
          return null;
        })}
      </div>
    );
  }
  
  // Check for direct image URLs
  if (imageUrlRegex.test(line)) {
    const urls = line.match(imageUrlRegex);
    return (
      <div key={index} className="my-2">
        {urls?.map((url, i) => (
          <img
            key={i}
            src={url}
            alt="Image"
            className="max-w-full h-auto rounded-lg shadow-sm my-2"
          />
        ))}
      </div>
    );
  }
  
  // Handle list items with bold
  if (line.startsWith("- **")) {
    const [label, value] = line.replace("- **", "").split(":**");
    return (
      <p key={index} className="flex items-start gap-2 my-1">
        <span className="text-gray-400">→</span>
        <span>
          <strong>{label}:</strong>
          {value}
        </span>
      </p>
    );
  }
  
  // Handle bold text
  if (line.includes("**")) {
    return (
      <p
        key={index}
        className="my-1"
        dangerouslySetInnerHTML={{
          __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
        }}
      />
    );
  }
  
  // Regular text or empty line
  return line ? <p key={index} className="my-1">{line}</p> : <br key={index} />;
};

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
}

interface OpenPanel {
  id: string;
  sessionId: string;
  width: number;
}

export default function WorkspaceChatPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params?.workspaceId;

  // Chat state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0]);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [openPanels, setOpenPanels] = useState<OpenPanel[]>([]);
  const [resizing, setResizing] = useState<string | null>(null);
  const [panelInputs, setPanelInputs] = useState<Record<string, string>>({});
  const [panelLoading, setPanelLoading] = useState<Record<string, boolean>>({});
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState("");
  
  // Attachment & Web Search state
  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const [workspaceBrowserOpen, setWorkspaceBrowserOpen] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [workspaceItems, setWorkspaceItems] = useState<{
    media: any[];
    notes: any[];
    links: any[];
  }>({ media: [], notes: [], links: [] });
  const [selectedWorkspaceItems, setSelectedWorkspaceItems] = useState<any[]>([]);
  const [workspaceBrowserTab, setWorkspaceBrowserTab] = useState<"media" | "notes" | "links">("media");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load workspace items for browser
  const loadWorkspaceItems = useCallback(async () => {
    if (!workspaceId) return;
    
    try {
      const [mediaRes, notesRes, linksRes] = await Promise.all([
        fetch(`/api/documents/list?workspaceId=${workspaceId}`),
        fetch(`/api/notes?workspaceId=${workspaceId}`),
        fetch(`/api/links?workspaceId=${workspaceId}`),
      ]);
      
      // Parse responses safely
      const mediaData = mediaRes.ok ? await mediaRes.json() : { documents: [] };
      const notesData = notesRes.ok ? await notesRes.json() : { notes: [] };
      const linksData = linksRes.ok ? await linksRes.json() : { links: [] };
      
      // Filter media for images only (check mime_type)
      const allDocs = mediaData.documents || [];
      const imageMedia = allDocs.filter((doc: any) => 
        doc.mime_type?.startsWith("image/")
      );
      
      console.log("Loaded workspace items:", { 
        media: imageMedia.length, 
        notes: (notesData.notes || []).length,
        links: (linksData.links || []).length 
      });
      
      setWorkspaceItems({
        media: imageMedia,
        notes: notesData.notes || [],
        links: linksData.links || [],
      });
    } catch (error) {
      console.error("Failed to load workspace items:", error);
      setWorkspaceItems({ media: [], notes: [], links: [] });
    }
  }, [workspaceId]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setUploadedFiles(prev => [...prev, ...Array.from(files)]);
    }
    setAttachmentOpen(false);
  };

  // Remove uploaded file
  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Toggle workspace item selection
  const toggleWorkspaceItem = (item: any) => {
    setSelectedWorkspaceItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      }
      return [...prev, item];
    });
  };

  // Remove selected workspace item
  const removeSelectedItem = (itemId: string) => {
    setSelectedWorkspaceItems(prev => prev.filter(i => i.id !== itemId));
  };

  // Update session title
  const updateSessionTitle = async (sessionId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    try {
      await fetch("/api/chat/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, title: newTitle.trim() }),
      });
    } catch (error) {
      console.error("Failed to update title:", error);
    }
    
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, title: newTitle.trim() } : s
    ));
    setEditingTitleId(null);
  };

  const isEditingRef = useRef(false);

  const startEditingTitle = (sessionId: string, currentTitle: string) => {
    isEditingRef.current = true;
    setEditingTitleId(sessionId);
    setEditingTitleValue(currentTitle);
    // Reset flag after a short delay
    setTimeout(() => {
      isEditingRef.current = false;
    }, 200);
  };

  const cancelEditing = () => {
    setEditingTitleId(null);
    setEditingTitleValue("");
  };

  const handleTitleBlur = (sessionId: string) => {
    // Don't process blur if we just started editing
    if (isEditingRef.current) return;
    
    setTimeout(() => {
      if (editingTitleValue.trim()) {
        updateSessionTitle(sessionId, editingTitleValue);
      } else {
        cancelEditing();
      }
    }, 150);
  };

  // Load chat sessions from database
  const loadSessions = useCallback(async () => {
    if (!workspaceId) return;
    
    try {
      const response = await fetch(`/api/chat/sessions?workspaceId=${workspaceId}`);
      const data = await response.json();
      
      if (response.ok && data.sessions) {
        const formattedSessions: ChatSession[] = data.sessions.map((s: any) => ({
          id: s.id,
          title: s.title,
          createdAt: new Date(s.created_at),
          messages: (s.chat_messages || []).map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.created_at),
            browsedFiles: m.browsed_files,
            rating: m.rating,
          })).sort((a: ChatMessage, b: ChatMessage) => 
            a.timestamp.getTime() - b.timestamp.getTime()
          ),
        }));
        setSessions(formattedSessions);
      }
    } catch (error) {
      console.error("Failed to load chat sessions:", error);
    }
  }, [workspaceId]);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Open a chat session in a panel (max 2)
  const openInPanel = (sessionId: string) => {
    if (openPanels.length >= 2) return;
    if (openPanels.some(p => p.sessionId === sessionId)) return;
    setOpenPanels(prev => [...prev, { id: crypto.randomUUID(), sessionId, width: 50 }]); // width in %
  };

  // Close a panel
  const closePanel = (panelId: string) => {
    setOpenPanels(prev => prev.filter(p => p.id !== panelId));
  };

  // Delete a chat session
  const deleteSession = async (sessionId: string) => {
    try {
      await fetch("/api/chat/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
    
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
    // Also close panel if open
    setOpenPanels(prev => prev.filter(p => p.sessionId !== sessionId));
  };

  // Handle resize
  const handleMouseDown = (panelId: string) => {
    setResizing(panelId);
  };

  useEffect(() => {
    if (!resizing) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const containerWidth = window.innerWidth;
      setOpenPanels(prev => prev.map(p => {
        if (p.id === resizing) {
          const delta = (e.movementX / containerWidth) * 100;
          const newWidth = Math.max(20, Math.min(80, p.width - delta));
          return { ...p, width: newWidth };
        }
        return p;
      }));
    };

    const handleMouseUp = () => setResizing(null);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing]);

  // Get active session
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // Group sessions by date
  const groupedSessions = sessions.reduce((acc, session) => {
    const today = new Date();
    const sessionDate = new Date(session.createdAt);
    const diffDays = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

    let group = "PAST WEEK";
    if (diffDays === 0) group = "TODAY";
    else if (diffDays === 1) group = "YESTERDAY";
    else if (diffDays <= 7) group = "PAST WEEK";
    else group = "OLDER";

    if (!acc[group]) acc[group] = [];
    acc[group].push(session);
    return acc;
  }, {} as Record<string, ChatSession[]>);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages]);

  // Filter models by search
  const filteredModels = AI_MODELS.filter((model) =>
    model.name.toLowerCase().includes(modelSearchQuery.toLowerCase())
  );

  // Group filtered models by provider
  const groupedModels = filteredModels.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, AIModel[]>);

  // Create new chat
  const handleNewChat = async () => {
    try {
      const response = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, title: "New Chat" }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.session) {
        const newSession: ChatSession = {
          id: data.session.id,
          title: data.session.title,
          messages: [],
          createdAt: new Date(data.session.created_at),
        };
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setInputValue("");
      }
    } catch (error) {
      console.error("Failed to create chat session:", error);
    }
  };

  // Send message (for main chat or panel)
  const handleSendMessage = async (targetSessionId?: string, inputOverride?: string) => {
    const question = inputOverride ?? inputValue;
    const isPanelMessage = !!targetSessionId;
    
    if (!question.trim()) return;
    if (isPanelMessage ? panelLoading[targetSessionId] : isLoading) return;

    let sessionId = targetSessionId || activeSessionId;

    // Create new session if none active (only for main chat)
    if (!sessionId && !isPanelMessage) {
      try {
        const res = await fetch("/api/chat/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            workspaceId, 
            title: question.slice(0, 50) + (question.length > 50 ? "..." : "") 
          }),
        });
        const data = await res.json();
        if (res.ok && data.session) {
          sessionId = data.session.id;
          const newSession: ChatSession = {
            id: data.session.id,
            title: data.session.title,
            messages: [],
            createdAt: new Date(data.session.created_at),
          };
          setSessions((prev) => [newSession, ...prev]);
          setActiveSessionId(sessionId);
        }
      } catch (error) {
        console.error("Failed to create session:", error);
        return;
      }
    }

    if (!sessionId) return;

    // Save user message to database
    let userMessageId = `msg-${Date.now()}`;
    try {
      const msgRes = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          role: "user",
          content: question,
        }),
      });
      const msgData = await msgRes.json();
      if (msgRes.ok && msgData.message) {
        userMessageId = msgData.message.id;
      }
    } catch (error) {
      console.error("Failed to save user message:", error);
    }

    // Add user message to UI
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: "user",
      content: question,
      timestamp: new Date(),
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              title: s.messages.length === 0 ? question.slice(0, 50) : s.title,
              messages: [...s.messages, userMessage],
            }
          : s
      )
    );

    // Clear input
    if (isPanelMessage) {
      setPanelInputs(prev => ({ ...prev, [targetSessionId]: "" }));
      setPanelLoading(prev => ({ ...prev, [targetSessionId]: true }));
    } else {
      setInputValue("");
      setIsLoading(true);
    }

    try {
      // Call the real AI API
      const response = await fetch("/api/chat/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          workspaceId,
          model: selectedModel.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Fehler bei der API-Anfrage");
      }

      // Save assistant message to database
      let assistantMessageId = `msg-${Date.now()}`;
      try {
        const msgRes = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            role: "assistant",
            content: data.answer,
            browsedFiles: data.browsedFiles,
          }),
        });
        const msgData = await msgRes.json();
        if (msgRes.ok && msgData.message) {
          assistantMessageId = msgData.message.id;
        }
      } catch (error) {
        console.error("Failed to save assistant message:", error);
      }

      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: data.answer,
        timestamp: new Date(),
        browsedFiles: data.browsedFiles,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, messages: [...s.messages, assistantMessage] }
            : s
        )
      );
    } catch (error) {
      console.error("Chat error:", error);
      
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: `**Fehler:** ${error instanceof Error ? error.message : "Verbindung zur KI fehlgeschlagen."}`,
        timestamp: new Date(),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, messages: [...s.messages, errorMessage] }
            : s
        )
      );
    } finally {
      if (isPanelMessage) {
        setPanelLoading(prev => ({ ...prev, [targetSessionId]: false }));
      } else {
        setIsLoading(false);
      }
    }
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Copy message
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // Rate message (like/dislike)
  const handleRate = (messageId: string, rating: "up" | "down") => {
    setSessions((prev) =>
      prev.map((session) => ({
        ...session,
        messages: session.messages.map((msg) =>
          msg.id === messageId
            ? { ...msg, rating: msg.rating === rating ? null : rating }
            : msg
        ),
      }))
    );
  };

  // Regenerate response
  const handleRegenerate = async (messageId: string) => {
    if (isLoading || !activeSession) return;

    // Find the user message before this assistant message
    const msgIndex = activeSession.messages.findIndex((m) => m.id === messageId);
    if (msgIndex <= 0) return;

    const userMessage = activeSession.messages[msgIndex - 1];
    if (userMessage.role !== "user") return;

    // Remove the assistant message and regenerate
    setSessions((prev) =>
      prev.map((session) =>
        session.id === activeSession.id
          ? {
              ...session,
              messages: session.messages.filter((m) => m.id !== messageId),
            }
          : session
      )
    );

    setIsLoading(true);

    try {
      const response = await fetch("/api/chat/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMessage.content,
          workspaceId,
          model: selectedModel.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Fehler bei der API-Anfrage");
      }

      const newAssistantMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: data.answer,
        timestamp: new Date(),
        browsedFiles: data.browsedFiles,
      };

      setSessions((prev) =>
        prev.map((session) =>
          session.id === activeSession.id
            ? { ...session, messages: [...session.messages, newAssistantMessage] }
            : session
        )
      );
    } catch (error) {
      console.error("Regenerate error:", error);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: `**Fehler:** ${error instanceof Error ? error.message : "Regenerierung fehlgeschlagen"}`,
        timestamp: new Date(),
      };

      setSessions((prev) =>
        prev.map((session) =>
          session.id === activeSession.id
            ? { ...session, messages: [...session.messages, errorMessage] }
            : session
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-56 border-r text-sm flex flex-col bg-gray-50/50">
        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            New Chat
          </button>
        </div>

        {/* My Chats */}
        <div className="px-3 pb-2">
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <Sparkles className="h-4 w-4" />
            My Chats
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-3 space-y-4">
          {Object.entries(groupedSessions).map(([group, groupSessions]) => (
            <div key={group}>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                {group}
              </p>
              <div className="space-y-0.5">
                {groupSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group relative flex items-center rounded-md text-xs transition-colors ${
                      activeSessionId === session.id
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {editingTitleId === session.id ? (
                      <div className="flex-1 flex items-center gap-2 px-2 py-1">
                        <MessageCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        <input
                          type="text"
                          value={editingTitleValue}
                          onChange={(e) => setEditingTitleValue(e.target.value)}
                          onBlur={() => handleTitleBlur(session.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              updateSessionTitle(session.id, editingTitleValue);
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              cancelEditing();
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 bg-white border rounded px-1 py-0.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveSessionId(session.id)}
                        onDoubleClick={() => startEditingTitle(session.id, session.title)}
                        className="flex-1 flex items-center gap-2 px-2 py-1.5 text-left min-w-0"
                      >
                        <MessageCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate max-w-[100px]">{session.title}</span>
                      </button>
                    )}
                    {/* Hover action buttons */}
                    {editingTitleId !== session.id && (
                      <div className="hidden group-hover:flex items-center gap-0.5 pr-1 flex-shrink-0">
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            startEditingTitle(session.id, session.title);
                          }}
                          className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                          title="Umbenennen"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openInPanel(session.id);
                          }}
                          className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                          title="Im Panel öffnen"
                        >
                          <PanelRight className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                          className="p-1 hover:bg-red-100 rounded text-gray-500 hover:text-red-600"
                          title="Löschen"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Trash */}
        <div className="border-t px-3 py-3">
          <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <Trash2 className="h-3.5 w-3.5" />
            Trash
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center gap-2 px-4 py-3 border-b text-sm text-muted-foreground">
          <span>←</span>
          <Sparkles className="h-4 w-4" />
          {activeSession && editingTitleId === activeSession.id ? (
            <input
              type="text"
              value={editingTitleValue}
              onChange={(e) => setEditingTitleValue(e.target.value)}
              onBlur={() => handleTitleBlur(activeSession.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  updateSessionTitle(activeSession.id, editingTitleValue);
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancelEditing();
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border rounded px-2 py-0.5 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
              autoFocus
            />
          ) : (
            <span 
              onMouseDown={(e) => {
                e.preventDefault();
                if (activeSession) startEditingTitle(activeSession.id, activeSession.title);
              }}
              className="cursor-pointer hover:text-foreground"
              title="Klicken zum Bearbeiten"
            >
              {activeSession?.title || "New Chat"}
            </span>
          )}
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {!activeSession || activeSession.messages.length === 0 ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center">
              <h2 className="text-xl font-medium text-gray-900 mb-8">Start a new chat</h2>

              {/* Input Box */}
              <div className="w-full max-w-2xl px-4">
                <div className="border rounded-xl bg-white shadow-sm">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything..."
                    className="w-full px-4 pt-4 pb-2 text-sm resize-none outline-none rounded-t-xl"
                    rows={2}
                  />
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  
                  {/* Uploaded files & selected items preview */}
                  {(uploadedFiles.length > 0 || selectedWorkspaceItems.length > 0) && (
                    <div className="flex flex-wrap gap-2 px-3 py-2 border-t">
                      {uploadedFiles.map((file, idx) => (
                        <Tooltip key={`file-${idx}`}>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1 text-xs cursor-default">
                              <ImageIcon className="h-3 w-3 text-gray-500" />
                              <span className="truncate max-w-[100px]">{file.name}</span>
                              <button
                                onClick={() => removeUploadedFile(idx)}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-white text-gray-900 shadow-lg rounded-lg max-w-xs [&>svg]:!bg-white [&>svg]:!fill-white"
                          >
                            <p className="text-xs font-medium truncate max-w-[200px]">{file.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      {selectedWorkspaceItems.map((item) => (
                        <Tooltip key={item.id}>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 bg-emerald-50 rounded-lg px-2 py-1 text-xs text-emerald-700 cursor-default">
                              {item.type === "image" ? <ImageIcon className="h-3 w-3" /> : 
                               item.type === "note" ? <FileText className="h-3 w-3" /> : 
                               <Link2 className="h-3 w-3" />}
                              <span className="truncate max-w-[120px]">{item.title || item.name || item.url}</span>
                              <button
                                onClick={() => removeSelectedItem(item.id)}
                                className="text-emerald-500 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-white text-gray-900 shadow-xl rounded-lg p-2 max-w-sm [&>svg]:!bg-white [&>svg]:!fill-white"
                          >
                            {item.type === "image" && (item.previewUrl || item.file_url) ? (
                              <img
                                src={item.previewUrl || item.file_url}
                                alt={item.name || item.title || "Image"}
                                className="max-h-56 w-auto rounded-md object-contain"
                              />
                            ) : item.type === "note" ? (
                              <div className="space-y-1 max-w-xs">
                                <p className="text-xs font-semibold truncate">
                                  {(item.title || "Untitled").replace(/<[^>]*>/g, "")}
                                </p>
                                <p className="text-[11px] text-gray-600 line-clamp-3">
                                  {(item.content || "").replace(/<[^>]*>/g, "")}
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-1 max-w-xs">
                                <p className="text-xs font-semibold truncate">{item.title || item.url || "Link"}</p>
                                {item.url && (
                                  <p className="text-[11px] text-gray-600 break-all">{item.url}</p>
                                )}
                              </div>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50/50 rounded-b-xl">
                    <div className="flex items-center gap-1">
                      {/* Attachment Button with Dropdown */}
                      <Popover open={attachmentOpen} onOpenChange={setAttachmentOpen}>
                        <PopoverTrigger asChild>
                          <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500">
                            <Paperclip className="h-4 w-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-1" align="start">
                          <button
                            onClick={() => {
                              fileInputRef.current?.click();
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
                          >
                            <Upload className="h-4 w-4" />
                            Upload
                          </button>
                          <button
                            onClick={() => {
                              setAttachmentOpen(false);
                              setWorkspaceBrowserOpen(true);
                              loadWorkspaceItems();
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
                          >
                            <FileSearch className="h-4 w-4" />
                            Find in Workspace
                          </button>
                        </PopoverContent>
                      </Popover>
                      
                      {/* Web Search Toggle */}
                      <button 
                        onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                        className={`p-1.5 rounded-md transition-colors ${
                          webSearchEnabled 
                            ? "bg-emerald-100 text-emerald-600" 
                            : "hover:bg-gray-100 text-gray-500"
                        }`}
                        title={webSearchEnabled ? "Web-Suche aktiviert" : "Web-Suche aktivieren"}
                      >
                        <Globe className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Model Selector */}
                      <Popover open={modelDropdownOpen} onOpenChange={setModelDropdownOpen}>
                        <PopoverTrigger asChild>
                          <button className="flex items-center gap-1.5 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md">
                            <Sparkles className="h-4 w-4 text-emerald-600" />
                            {selectedModel.name}
                            {modelDropdownOpen ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2" align="end">
                          {/* Search */}
                          <div className="flex items-center gap-2 px-2 py-1.5 border-b mb-2">
                            <Search className="h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search models..."
                              value={modelSearchQuery}
                              onChange={(e) => setModelSearchQuery(e.target.value)}
                              className="flex-1 text-sm outline-none bg-transparent"
                            />
                          </div>
                          {/* Models grouped by provider */}
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {Object.entries(groupedModels).map(([provider, models]) => (
                              <div key={provider}>
                                <p className="text-[10px] font-medium text-muted-foreground uppercase px-2 mb-1">
                                  {PROVIDER_LABELS[provider]}
                                </p>
                                {models.map((model) => (
                                  <button
                                    key={model.id}
                                    onClick={() => {
                                      setSelectedModel(model);
                                      setModelDropdownOpen(false);
                                      setModelSearchQuery("");
                                    }}
                                    className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md ${
                                      selectedModel.id === model.id
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "hover:bg-gray-100"
                                    }`}
                                  >
                                    <span
                                      className={`text-base ${
                                        model.provider === "anthropic"
                                          ? "text-orange-500"
                                          : model.provider === "openai"
                                          ? "text-gray-600"
                                          : model.provider === "google"
                                          ? "text-blue-500"
                                          : "text-emerald-600"
                                      }`}
                                    >
                                      {model.icon}
                                    </span>
                                    {model.name}
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>

                      {/* Send Button */}
                      <button
                        onClick={() => handleSendMessage()}
                        disabled={!inputValue.trim() || isLoading}
                        className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Workspace Browser Popover */}
              {workspaceBrowserOpen && (
                <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setWorkspaceBrowserOpen(false)}>
                  <div className="bg-white rounded-xl shadow-xl w-[900px] max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                      <h3 className="font-medium text-lg">Find in Workspace</h3>
                      <button onClick={() => setWorkspaceBrowserOpen(false)} className="p-1.5 hover:bg-gray-100 rounded">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex border-b">
                      {(["media", "notes", "links"] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setWorkspaceBrowserTab(tab)}
                          className={`flex-1 py-3 text-sm font-medium transition-colors ${
                            workspaceBrowserTab === tab
                              ? "text-emerald-600 border-b-2 border-emerald-600"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {tab === "media" ? `Media (${workspaceItems.media.length})` : 
                           tab === "notes" ? `Notes (${workspaceItems.notes.length})` : 
                           `Links (${workspaceItems.links.length})`}
                        </button>
                      ))}
                    </div>
                    
                    {/* Content */}
                    <div className="p-4 flex-1 overflow-y-auto">
                      {workspaceBrowserTab === "media" && (
                        <div className="grid grid-cols-5 gap-3">
                          {workspaceItems.media.length === 0 ? (
                            <p className="col-span-5 text-sm text-gray-500 text-center py-8">Keine Medien gefunden</p>
                          ) : (
                            workspaceItems.media.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => toggleWorkspaceItem({ ...item, type: "image" })}
                                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                  selectedWorkspaceItems.find(i => i.id === item.id)
                                    ? "border-emerald-500 ring-2 ring-emerald-200"
                                    : "border-transparent hover:border-gray-300"
                                }`}
                              >
                                <img src={item.previewUrl || item.file_url} alt={item.name} className="w-full h-full object-cover" />
                                {selectedWorkspaceItems.find(i => i.id === item.id) && (
                                  <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                    <Check className="h-6 w-6 text-emerald-600" />
                                  </div>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                      
                      {workspaceBrowserTab === "notes" && (
                        <div className="grid grid-cols-4 gap-3">
                          {workspaceItems.notes.length === 0 ? (
                            <p className="col-span-4 text-sm text-gray-500 text-center py-8">Keine Notizen gefunden</p>
                          ) : (
                            workspaceItems.notes.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => toggleWorkspaceItem({ ...item, type: "note" })}
                                className={`relative rounded-2xl bg-white hover:shadow-md transition-all cursor-pointer overflow-hidden shadow-sm border h-44 flex flex-col text-left ${
                                  selectedWorkspaceItems.find(i => i.id === item.id)
                                    ? "ring-2 ring-emerald-500 ring-offset-2 border-emerald-500"
                                    : "border-gray-100 hover:border-gray-200"
                                }`}
                              >
                                {/* Cover image */}
                                {item.cover_image && (
                                  <img src={item.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                                )}
                                {/* Selection indicator */}
                                {selectedWorkspaceItems.find(i => i.id === item.id) && (
                                  <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-md flex items-center justify-center z-10">
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                )}
                                {/* Content */}
                                <div className="relative z-10 p-3 flex-1 flex flex-col overflow-hidden">
                                  <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                                    {item.title?.replace(/<[^>]*>/g, "") || "Untitled"}
                                  </h3>
                                  <p className="text-xs text-gray-500 line-clamp-4 flex-1">
                                    {item.content?.replace(/<[^>]*>/g, "").substring(0, 150) || ""}
                                  </p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                      
                      {workspaceBrowserTab === "links" && (
                        <div className="grid grid-cols-5 gap-3">
                          {workspaceItems.links.length === 0 ? (
                            <p className="col-span-5 text-sm text-gray-500 text-center py-8">Keine Links gefunden</p>
                          ) : (
                            workspaceItems.links.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => toggleWorkspaceItem({ ...item, type: "link" })}
                                className={`relative h-44 overflow-hidden bg-gray-900 rounded-2xl transition-all cursor-pointer ${
                                  selectedWorkspaceItems.find(i => i.id === item.id)
                                    ? "ring-2 ring-emerald-500 ring-offset-2"
                                    : "hover:ring-2 hover:ring-gray-300"
                                }`}
                              >
                                {/* Thumbnail */}
                                {item.thumbnail_url ? (
                                  <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
                                    <Link2 className="h-8 w-8 text-white/50" />
                                  </div>
                                )}
                                {/* Selection indicator */}
                                {selectedWorkspaceItems.find(i => i.id === item.id) && (
                                  <div className="absolute top-2 left-2 w-5 h-5 bg-emerald-500 rounded-md flex items-center justify-center z-10">
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                )}
                                {/* Link type badge */}
                                <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-gray-800 rounded text-[10px] font-medium text-white">
                                  {item.link_type || "Website"}
                                </div>
                                {/* Bottom gradient with title */}
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-8 pb-2 px-2">
                                  <div className="flex items-center gap-1">
                                    <Link2 className="h-3 w-3 text-white/80 flex-shrink-0" />
                                    <span className="font-medium text-white text-xs line-clamp-2">
                                      {item.title || "Untitled"}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                      <span className="text-sm text-gray-500">
                        {selectedWorkspaceItems.length} ausgewählt
                      </span>
                      <button
                        onClick={() => setWorkspaceBrowserOpen(false)}
                        className="px-4 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
                      >
                        Fertig
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Messages */
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {activeSession.messages.map((message) => (
                <div key={message.id}>
                  {message.role === "user" ? (
                    /* User Message */
                    <div className="flex justify-end">
                      <div className="max-w-md bg-gray-100 rounded-2xl px-4 py-3">
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ) : (
                    /* Assistant Message */
                    <div className="space-y-3">
                      {/* Browsed files indicator */}
                      {message.browsedFiles && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border">
                            <FolderSearch className="h-4 w-4" />
                            <span>Browsed your files</span>
                            <Check className="h-4 w-4 text-emerald-600 ml-auto" />
                          </div>
                        </div>
                      )}

                      {/* Message content */}
                      <div className="prose prose-sm max-w-none">
                        {message.content.split("\n").map((line, i) => renderMessageLine(line, i))}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(message.content)}
                          className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600"
                          title="Kopieren"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRate(message.id, "up")}
                          className={`p-1.5 hover:bg-gray-100 rounded-md transition-colors ${
                            message.rating === "up"
                              ? "text-emerald-600 bg-emerald-50"
                              : "text-gray-400 hover:text-gray-600"
                          }`}
                          title="Gute Antwort"
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRate(message.id, "down")}
                          className={`p-1.5 hover:bg-gray-100 rounded-md transition-colors ${
                            message.rating === "down"
                              ? "text-red-500 bg-red-50"
                              : "text-gray-400 hover:text-gray-600"
                          }`}
                          title="Schlechte Antwort"
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRegenerate(message.id)}
                          disabled={isLoading}
                          className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Neu generieren"
                        >
                          <RotateCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="animate-pulse flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span>Thinking...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Input (when chat has messages) */}
        {activeSession && activeSession.messages.length > 0 && (
          <div className="p-4">
            <div className="max-w-2xl mx-auto">
              <div className="border rounded-xl bg-white shadow-sm">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  className="w-full px-4 pt-4 pb-2 text-sm resize-none outline-none rounded-t-xl"
                  rows={2}
                />
                <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50/50 rounded-b-xl">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500">
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500">
                      <Globe className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Model Selector */}
                    <Popover open={modelDropdownOpen} onOpenChange={setModelDropdownOpen}>
                      <PopoverTrigger asChild>
                        <button className="flex items-center gap-1.5 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md">
                          <Sparkles className="h-4 w-4 text-emerald-600" />
                          {selectedModel.name}
                          {modelDropdownOpen ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2" align="end">
                        {/* Search */}
                        <div className="flex items-center gap-2 px-2 py-1.5 border-b mb-2">
                          <Search className="h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search models..."
                            value={modelSearchQuery}
                            onChange={(e) => setModelSearchQuery(e.target.value)}
                            className="flex-1 text-sm outline-none bg-transparent"
                          />
                        </div>
                        {/* Models grouped by provider */}
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {Object.entries(groupedModels).map(([provider, models]) => (
                            <div key={provider}>
                              <p className="text-[10px] font-medium text-muted-foreground uppercase px-2 mb-1">
                                {PROVIDER_LABELS[provider]}
                              </p>
                              {models.map((model) => (
                                <button
                                  key={model.id}
                                  onClick={() => {
                                    setSelectedModel(model);
                                    setModelDropdownOpen(false);
                                    setModelSearchQuery("");
                                  }}
                                  className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md ${
                                    selectedModel.id === model.id
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "hover:bg-gray-100"
                                  }`}
                                >
                                  <span
                                    className={`text-base ${
                                      model.provider === "anthropic"
                                        ? "text-orange-500"
                                        : model.provider === "openai"
                                        ? "text-gray-600"
                                        : model.provider === "google"
                                        ? "text-blue-500"
                                        : "text-emerald-600"
                                    }`}
                                  >
                                    {model.icon}
                                  </span>
                                  {model.name}
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Send Button */}
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!inputValue.trim() || isLoading}
                      className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Open Panels */}
      {openPanels.map((panel, index) => {
        const session = sessions.find(s => s.id === panel.sessionId);
        if (!session) return null;
        
        // Calculate width: if 2 panels, split available space
        const panelWidth = openPanels.length === 1 
          ? `${panel.width}%` 
          : `${100 / openPanels.length}%`;
        
        return (
          <div
            key={panel.id}
            className="flex-shrink-0 border-l flex bg-white relative"
            style={{ width: panelWidth, minWidth: "300px" }}
          >
            {/* Resize Handle */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-emerald-500/50 z-10"
              onMouseDown={() => handleMouseDown(panel.id)}
            />
            
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Panel Header - same style as main */}
              <header className="flex items-center justify-between px-4 py-3 border-b text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>←</span>
                  <Sparkles className="h-4 w-4" />
                  <span>{session.title}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => closePanel(panel.id)} 
                  className="p-1 hover:bg-muted rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              {/* Panel Content */}
              {session.messages.length === 0 ? (
                /* Empty State - Start a new chat (same style as main) */
                <div className="flex-1 flex flex-col items-center justify-center">
                  <h2 className="text-xl font-medium text-gray-900 mb-8">Start a new chat</h2>
                  <div className="w-full max-w-2xl px-4">
                    <div className="border rounded-xl bg-white shadow-sm">
                      <textarea
                        value={panelInputs[session.id] || ""}
                        onChange={(e) => setPanelInputs(prev => ({ ...prev, [session.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(session.id, panelInputs[session.id]);
                          }
                        }}
                        placeholder="Ask anything..."
                        className="w-full px-4 pt-4 pb-2 text-sm resize-none outline-none rounded-t-xl"
                        rows={2}
                      />
                      <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50/50 rounded-b-xl">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500">
                            <Paperclip className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500">
                            <Globe className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Sparkles className="h-4 w-4 text-emerald-600" />
                            {selectedModel.name}
                          </span>
                          <button
                            onClick={() => handleSendMessage(session.id, panelInputs[session.id])}
                            disabled={!(panelInputs[session.id]?.trim()) || panelLoading[session.id]}
                            className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Messages View - same as main chat */
                <>
                  <div className="flex-1 overflow-y-auto px-4 py-6">
                    <div className="max-w-2xl mx-auto space-y-6">
                      {session.messages.map((message) => (
                        <div key={message.id}>
                          {message.role === "user" ? (
                            /* User Message */
                            <div className="flex justify-end">
                              <div className="max-w-[80%] bg-gray-100 rounded-2xl px-4 py-3">
                                <p className="text-sm">{message.content}</p>
                              </div>
                            </div>
                          ) : (
                            /* Assistant Message */
                            <div className="space-y-3">
                              {/* Browsed files indicator */}
                              {message.browsedFiles && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border">
                                    <FolderSearch className="h-4 w-4" />
                                    <span>Browsed your files</span>
                                    <Check className="h-4 w-4 text-emerald-600 ml-auto" />
                                  </div>
                                </div>
                              )}

                              {/* Message content */}
                              <div className="prose prose-sm max-w-none">
                                {message.content.split("\n").map((line, i) => renderMessageLine(line, i))}
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleCopy(message.content)}
                                  className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600"
                                  title="Kopieren"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleRate(message.id, "up")}
                                  className={`p-1.5 hover:bg-gray-100 rounded-md transition-colors ${
                                    message.rating === "up"
                                      ? "text-emerald-600 bg-emerald-50"
                                      : "text-gray-400 hover:text-gray-600"
                                  }`}
                                  title="Gute Antwort"
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleRate(message.id, "down")}
                                  className={`p-1.5 hover:bg-gray-100 rounded-md transition-colors ${
                                    message.rating === "down"
                                      ? "text-red-500 bg-red-50"
                                      : "text-gray-400 hover:text-gray-600"
                                  }`}
                                  title="Schlechte Antwort"
                                >
                                  <ThumbsDown className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleRegenerate(message.id)}
                                  disabled={panelLoading[session.id]}
                                  className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Neu generieren"
                                >
                                  <RotateCcw className={`h-4 w-4 ${panelLoading[session.id] ? "animate-spin" : ""}`} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* Panel Loading indicator */}
                      {panelLoading[session.id] && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="animate-pulse flex items-center gap-1">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                          <span>Thinking...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Panel Input - same style as main */}
                  <div className="p-4">
                    <div className="max-w-2xl mx-auto">
                      <div className="border rounded-xl bg-white shadow-sm">
                        <textarea
                          value={panelInputs[session.id] || ""}
                          onChange={(e) => setPanelInputs(prev => ({ ...prev, [session.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage(session.id, panelInputs[session.id]);
                            }
                          }}
                          placeholder="Ask anything..."
                          className="w-full px-4 pt-4 pb-2 text-sm resize-none outline-none rounded-t-xl"
                          rows={2}
                        />
                        <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50/50 rounded-b-xl">
                          <div className="flex items-center gap-1">
                            <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500">
                              <Paperclip className="h-4 w-4" />
                            </button>
                            <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500">
                              <Globe className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 text-sm text-gray-600">
                              <Sparkles className="h-4 w-4 text-emerald-600" />
                              {selectedModel.name}
                            </span>
                            <button
                              onClick={() => handleSendMessage(session.id, panelInputs[session.id])}
                              disabled={!(panelInputs[session.id]?.trim()) || panelLoading[session.id]}
                              className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
