"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { 
  ArrowLeft, Home, Link2, Star, Share2, MoreHorizontal, ExternalLink, 
  Pencil, Trash2, Info, ChevronRight, Users, PanelRight, Check,
  Play, Pause, Volume2, VolumeX, Maximize, MessageSquare, Clock,
  Send, Loader2, Search, ChevronDown, PenTool, Eraser, Type,
  Circle, Square, ArrowRight as Arrow, Download, Copy
} from "lucide-react";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LinkItem {
  id: string;
  url: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  video_url?: string;
  audio_url?: string;
  workspace_id: string;
  created_at: string;
  updated_at?: string;
  is_starred?: boolean;
}

interface Comment {
  id: string;
  link_id: string;
  user_id: string;
  content: string;
  timestamp_seconds?: number;
  frame_data?: string; // JSON string with drawing annotations
  created_at: string;
  user?: {
    name: string;
    avatar_url?: string;
  };
}

interface TranscriptSegment {
  id: string;
  link_id: string;
  start_time: number;
  end_time: number;
  text: string;
  speaker?: string;
}

// Extract YouTube video ID
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Format time display
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function LinkDetailPage() {
  const params = useParams<{ workspaceId: string; linkId: string }>();
  const router = useRouter();
  const workspaceId = params?.workspaceId;
  const linkId = params?.linkId;
  
  const [link, setLink] = useState<LinkItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarred, setIsStarred] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [infoMenuOpen, setInfoMenuOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleValue, setEditingTitleValue] = useState("");
  
  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentAtTimestamp, setCommentAtTimestamp] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  // Transcript state
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"comments" | "transcript">("comments");
  
  // Text-to-Speech state (ElevenLabs)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [speakingSegmentId, setSpeakingSegmentId] = useState<string | null>(null);
  
  // Video processing state
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  
  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingTool, setDrawingTool] = useState<"pen" | "eraser" | "text" | "circle" | "square" | "arrow">("pen");
  const [drawingColor, setDrawingColor] = useState("#ff0000");
  const [drawings, setDrawings] = useState<any[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Check if URL is a video
  const youtubeVideoId = link ? extractYouTubeVideoId(link.url) : null;
  const isYouTube = !!youtubeVideoId;

  // Fetch link
  const fetchLink = useCallback(async () => {
    if (!linkId) return;
    try {
      const response = await fetch(`/api/links/${linkId}`);
      if (response.ok) {
        const { link } = await response.json();
        setLink(link);
        setIsStarred(link.is_starred || false);
        setEditingTitleValue(link.title || "");
      } else {
        router.push(`/workspace/${workspaceId}/links`);
      }
    } catch (error) {
      console.error("Failed to fetch link:", error);
    } finally {
      setLoading(false);
    }
  }, [linkId, workspaceId, router]);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!linkId) return;
    try {
      const response = await fetch(`/api/links/${linkId}/comments`);
      if (response.ok) {
        const { comments } = await response.json();
        setComments(comments || []);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  }, [linkId]);

  // Fetch transcript
  const fetchTranscript = useCallback(async () => {
    if (!linkId) return;
    try {
      const response = await fetch(`/api/links/${linkId}/transcript`);
      if (response.ok) {
        const { transcript } = await response.json();
        setTranscript(transcript || []);
      }
    } catch (error) {
      console.error("Failed to fetch transcript:", error);
    }
  }, [linkId]);

  useEffect(() => {
    fetchLink();
    fetchComments();
    fetchTranscript();
  }, [fetchLink, fetchComments, fetchTranscript]);

  // Toggle starred
  const toggleStarred = async () => {
    if (!linkId) return;
    const newStarred = !isStarred;
    setIsStarred(newStarred);
    try {
      await fetch(`/api/links/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_starred: newStarred }),
      });
    } catch (error) {
      setIsStarred(!newStarred);
      console.error("Failed to update star:", error);
    }
  };

  // Delete link
  const handleDelete = async () => {
    if (!linkId) return;
    try {
      const response = await fetch(`/api/links/${linkId}`, { method: "DELETE" });
      if (response.ok) {
        router.push(`/workspace/${workspaceId}/links`);
      }
    } catch (error) {
      console.error("Failed to delete link:", error);
    }
  };

  // Rename link
  const saveEditingTitle = async () => {
    if (!linkId || !editingTitleValue.trim()) {
      setIsEditingTitle(false);
      return;
    }
    try {
      await fetch(`/api/links/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editingTitleValue }),
      });
      setLink(prev => prev ? { ...prev, title: editingTitleValue } : null);
    } catch (error) {
      console.error("Failed to rename link:", error);
    }
    setIsEditingTitle(false);
  };

  const startEditingTitle = () => {
    setEditingTitleValue(link?.title || "");
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 100);
  };

  // Add comment
  const addComment = async () => {
    if (!newComment.trim() || !linkId) return;
    setIsSubmittingComment(true);
    try {
      const response = await fetch(`/api/links/${linkId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          timestamp_seconds: commentAtTimestamp ? currentTime : null,
          frame_data: drawings.length > 0 ? JSON.stringify(drawings) : null,
        }),
      });
      if (response.ok) {
        const { comment } = await response.json();
        setComments(prev => [...prev, comment]);
        setNewComment("");
        setDrawings([]);
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Generate transcript
  const generateTranscript = async () => {
    if (!linkId || !link?.url) return;
    setIsTranscribing(true);
    try {
      const response = await fetch(`/api/links/${linkId}/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link.url }),
      });
      if (response.ok) {
        const { transcript } = await response.json();
        setTranscript(transcript || []);
      }
    } catch (error) {
      console.error("Failed to generate transcript:", error);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Process video - download, store, and transcribe with Gemini
  const processVideo = async () => {
    if (!linkId || !link?.url) return;
    setIsProcessingVideo(true);
    setProcessingStatus("Video wird heruntergeladen...");
    
    try {
      const response = await fetch(`/api/links/${linkId}/process-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (response.ok) {
        const result = await response.json();
        setProcessingStatus("Fertig!");
        
        // Refresh link data to get video_url
        await fetchLink();
        
        // Update transcript
        if (result.transcript) {
          setTranscript(result.transcript);
        } else {
          await fetchTranscript();
        }
      } else {
        const error = await response.json();
        setProcessingStatus(`Fehler: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to process video:", error);
      setProcessingStatus("Fehler beim Verarbeiten");
    } finally {
      setIsProcessingVideo(false);
      setTimeout(() => setProcessingStatus(""), 5000);
    }
  };

  // Jump to timestamp
  const jumpToTimestamp = (seconds: number) => {
    if (youtubeVideoId) {
      // For YouTube, we need to use postMessage to the iframe
      const iframe = document.querySelector("iframe") as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "seekTo", args: [seconds, true] }),
          "*"
        );
      }
    }
  };

  // Copy transcript
  const copyTranscript = () => {
    const text = transcript.map(s => `[${formatTime(s.start_time)}] ${s.text}`).join("\n");
    navigator.clipboard.writeText(text);
  };

  // Speak transcript segment using Browser Web Speech API
  const speakText = async (text: string, segmentId?: string) => {
    // Stop current speech if playing
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // If clicking same segment, just stop
    if (speakingSegmentId === segmentId) {
      setIsSpeaking(false);
      setSpeakingSegmentId(null);
      return;
    }

    if (!window.speechSynthesis) {
      alert("Text-to-Speech wird in diesem Browser nicht unterstützt");
      return;
    }

    setIsSpeaking(true);
    setSpeakingSegmentId(segmentId || null);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE"; // German
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Try to get a German voice
    const voices = window.speechSynthesis.getVoices();
    const germanVoice = voices.find(v => v.lang.startsWith("de")) || voices[0];
    if (germanVoice) {
      utterance.voice = germanVoice;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingSegmentId(null);
    };

    utterance.onerror = (e) => {
      console.error("Speech error:", e);
      setIsSpeaking(false);
      setSpeakingSegmentId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Speak entire transcript
  const speakFullTranscript = () => {
    const fullText = transcript.map(s => s.text).join(". ");
    speakText(fullText, "full");
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingSegmentId(null);
  };

  // Filter transcript by search
  const filteredTranscript = transcript.filter(s =>
    s.text.toLowerCase().includes(transcriptSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push(`/workspace/${workspaceId}/links`)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-gray-500" />
          </button>
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={`/workspace/${workspaceId}`}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>
            <span className="text-gray-300">/</span>
            <div className="flex items-center gap-1 text-gray-700">
              <Link2 className="h-3.5 w-3.5" />
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editingTitleValue}
                  onChange={(e) => setEditingTitleValue(e.target.value)}
                  onBlur={saveEditingTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEditingTitle();
                    if (e.key === "Escape") setIsEditingTitle(false);
                  }}
                  className="font-medium bg-white border border-[var(--accent-primary)] rounded px-1 py-0.5 outline-none min-w-[100px]"
                />
              ) : (
                <span 
                  className="font-medium cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded truncate max-w-[300px]"
                  onClick={startEditingTitle}
                  title={link?.title || "Untitled Link"}
                >
                  {link?.title || "Untitled Link"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {link?.created_at ? new Date(link.created_at).toLocaleDateString("de-DE") : ""}
          </span>
          <button
            type="button"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Share
          </button>
          <button
            type="button"
            onClick={toggleStarred}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Star className={`h-4 w-4 ${isStarred ? "text-amber-500 fill-amber-500" : "text-gray-400"}`} />
          </button>
          
          {/* More Menu */}
          <Popover open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreHorizontal className="h-4 w-4 text-gray-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-1" align="end">
              <a
                href={link?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <ExternalLink className="h-4 w-4 text-gray-500" />
                Open original link
              </a>
              
              <button
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => {
                  toggleStarred();
                  setMoreMenuOpen(false);
                }}
              >
                <Star className={`h-4 w-4 ${isStarred ? "text-amber-500" : "text-gray-500"}`} />
                {isStarred ? "Unstar" : "Star"}
              </button>
              
              <button
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => {
                  setMoreMenuOpen(false);
                  startEditingTitle();
                }}
              >
                <Pencil className="h-4 w-4 text-gray-500" />
                Rename
              </button>
              
              <div className="h-px bg-gray-100 my-1" />
              
              <button
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                onClick={() => {
                  setMoreMenuOpen(false);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
              
              <div className="h-px bg-gray-100 my-1" />
              
              {/* Information submenu */}
              <Popover open={infoMenuOpen} onOpenChange={setInfoMenuOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <Info className="h-4 w-4 text-gray-500" />
                      Information
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" side="left" align="end">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>Visible to</span>
                      <span className="text-[var(--accent-primary-light)] font-medium">Workspace members</span>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="text-xs text-gray-500 space-y-1">
                      <p><span className="font-medium">Created:</span> {link?.created_at ? new Date(link.created_at).toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" }) : "Unknown"}</p>
                      <p><span className="font-medium">URL:</span> <span className="break-all">{link?.url}</span></p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video/Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video Player */}
          <div className="relative bg-black flex items-center justify-center" style={{ height: "50%" }}>
            {/* Show stored video if available */}
            {link?.video_url ? (
              <video
                ref={videoRef}
                src={link.video_url}
                className="w-full h-full"
                controls
                controlsList="nodownload"
              />
            ) : isYouTube ? (
              <>
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1&rel=0`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                {/* Process Video Button */}
                <button
                  type="button"
                  onClick={processVideo}
                  disabled={isProcessingVideo}
                  className="absolute bottom-4 right-4 px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm rounded-lg shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessingVideo ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {processingStatus || "Verarbeite..."}
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Video verarbeiten
                    </>
                  )}
                </button>
              </>
            ) : link?.thumbnail_url ? (
              <div className="w-full h-full flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={link.thumbnail_url} alt="" className="max-w-full max-h-full object-contain" />
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors"
                >
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                    <ExternalLink className="h-6 w-6 text-gray-800" />
                  </div>
                </a>
              </div>
            ) : (
              <a
                href={link?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-4 text-white/70 hover:text-white transition-colors"
              >
                <Link2 className="h-12 w-12" />
                <span className="text-sm">Open link in new tab</span>
              </a>
            )}

            {/* Drawing Canvas Overlay */}
            {isDrawingMode && (
              <canvas
                ref={canvasRef}
                className="absolute inset-0 cursor-crosshair"
                style={{ pointerEvents: "all" }}
              />
            )}
          </div>

          {/* Drawing Toolbar */}
          {isYouTube && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b">
              <button
                type="button"
                onClick={() => setIsDrawingMode(!isDrawingMode)}
                className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 ${
                  isDrawingMode ? "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]" : "hover:bg-gray-100"
                }`}
              >
                <PenTool className="h-4 w-4" />
                {isDrawingMode ? "Exit Drawing" : "Draw on Frame"}
              </button>
              
              {isDrawingMode && (
                <>
                  <div className="h-6 w-px bg-gray-200" />
                  <div className="flex items-center gap-1">
                    {(["pen", "eraser", "text", "circle", "square", "arrow"] as const).map((tool) => (
                      <button
                        key={tool}
                        type="button"
                        onClick={() => setDrawingTool(tool)}
                        className={`p-1.5 rounded ${drawingTool === tool ? "bg-[var(--accent-primary)]/20" : "hover:bg-gray-100"}`}
                      >
                        {tool === "pen" && <PenTool className="h-4 w-4" />}
                        {tool === "eraser" && <Eraser className="h-4 w-4" />}
                        {tool === "text" && <Type className="h-4 w-4" />}
                        {tool === "circle" && <Circle className="h-4 w-4" />}
                        {tool === "square" && <Square className="h-4 w-4" />}
                        {tool === "arrow" && <Arrow className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                  <div className="h-6 w-px bg-gray-200" />
                  <input
                    type="color"
                    value={drawingColor}
                    onChange={(e) => setDrawingColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                </>
              )}
            </div>
          )}

          {/* Link Info */}
          <div className="p-4 border-b">
            <h1 className="text-xl font-semibold text-gray-900 mb-1">{link?.title || "Untitled"}</h1>
            {link?.description && (
              <p className="text-sm text-muted-foreground mb-2">{link.description}</p>
            )}
            <a
              href={link?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline break-all"
            >
              {link?.url}
            </a>
          </div>
        </div>

        {/* Sidebar - Comments & Transcript */}
        <div className="w-96 border-l flex flex-col bg-gray-50">
          {/* Tabs */}
          <div className="flex border-b bg-white">
            <button
              type="button"
              onClick={() => setActiveTab("comments")}
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                activeTab === "comments"
                  ? "text-[var(--accent-primary-light)] border-b-2 border-[var(--accent-primary)]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              Comments ({comments.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("transcript")}
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                activeTab === "transcript"
                  ? "text-[var(--accent-primary-light)] border-b-2 border-[var(--accent-primary)]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Clock className="h-4 w-4" />
              Transcript
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "comments" ? (
              <div className="p-4 space-y-4">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No comments yet. Add the first one!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center text-sm font-medium text-[var(--accent-primary)]">
                          {comment.user?.name?.charAt(0) || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{comment.user?.name || "Unknown"}</span>
                            {comment.timestamp_seconds !== null && comment.timestamp_seconds !== undefined && (
                              <button
                                type="button"
                                onClick={() => jumpToTimestamp(comment.timestamp_seconds!)}
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <Clock className="h-3 w-3" />
                                {formatTime(comment.timestamp_seconds)}
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                          {comment.frame_data && (
                            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                              <PenTool className="h-3 w-3" />
                              Has annotation
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground mt-1 block">
                            {new Date(comment.created_at).toLocaleString("de-DE")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="p-4">
                {/* Transcript Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search in transcript..."
                    value={transcriptSearch}
                    onChange={(e) => setTranscriptSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                  />
                </div>

                {transcript.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground mb-4">
                      No transcript available yet.
                    </p>
                    {isYouTube && (
                      <button
                        type="button"
                        onClick={generateTranscript}
                        disabled={isTranscribing}
                        className="px-4 py-2 bg-[var(--accent-primary)] text-white text-sm rounded-lg hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 flex items-center gap-2 mx-auto"
                      >
                        {isTranscribing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Transcribing...
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4" />
                            Generate Transcript
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Transcript Controls */}
                    <div className="flex items-center justify-between mb-3 pb-2 border-b">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={isSpeaking ? stopSpeaking : speakFullTranscript}
                          className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 ${
                            isSpeaking && speakingSegmentId === "full"
                              ? "bg-red-100 text-red-600 hover:bg-red-200"
                              : "bg-[var(--accent-primary)]/20 text-[var(--accent-primary-light)] hover:bg-[var(--accent-primary)]/30"
                          }`}
                        >
                          {isSpeaking && speakingSegmentId === "full" ? (
                            <>
                              <VolumeX className="h-3 w-3" />
                              Stop
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-3 w-3" />
                              Vorlesen
                            </>
                          )}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={copyTranscript}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </button>
                    </div>
                    
                    {/* Transcript Segments */}
                    <div className="space-y-1">
                      {filteredTranscript.map((segment) => (
                        <div
                          key={segment.id}
                          className={`group flex items-start gap-2 p-2 rounded hover:bg-white transition-colors ${
                            speakingSegmentId === segment.id ? "bg-[var(--accent-primary)]/10 ring-1 ring-[var(--accent-primary)]/30" : ""
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => speakText(segment.text, segment.id)}
                            className={`flex-shrink-0 p-1 rounded ${
                              speakingSegmentId === segment.id
                                ? "text-[var(--accent-primary-light)]"
                                : "text-gray-400 hover:text-[var(--accent-primary-light)] opacity-0 group-hover:opacity-100"
                            }`}
                            title="Vorlesen"
                          >
                            {speakingSegmentId === segment.id ? (
                              <VolumeX className="h-3.5 w-3.5" />
                            ) : (
                              <Volume2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => jumpToTimestamp(segment.start_time)}
                            className="flex-1 text-left"
                          >
                            <span className="text-xs text-blue-600 font-mono">
                              {formatTime(segment.start_time)}
                            </span>
                            <p className="text-sm text-gray-700 mt-0.5">{segment.text}</p>
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Comment Input */}
          {activeTab === "comments" && (
            <div className="p-4 border-t bg-white">
              <div className="flex items-center gap-2 mb-2">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={commentAtTimestamp}
                    onChange={(e) => setCommentAtTimestamp(e.target.checked)}
                    className="rounded"
                  />
                  Add at current timestamp
                </label>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addComment()}
                  className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                />
                <button
                  type="button"
                  onClick={addComment}
                  disabled={!newComment.trim() || isSubmittingComment}
                  className="px-3 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary-hover)] disabled:opacity-50"
                >
                  {isSubmittingComment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this link?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The link and all its comments will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
