"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { 
  ArrowLeft, Home, Link2, Star, Share2, MoreHorizontal, ExternalLink, 
  Pencil, Trash2, Info, ChevronRight, Users, PanelRight, Check,
  Play, Pause, Volume2, VolumeX, Maximize, MessageSquare, Clock,
  Send, Loader2, Search, ChevronDown, PenTool, Eraser, Type,
  Circle, Square, ArrowRight as Arrow, Download, Copy, Sparkles, Zap, Brain,
  FileText, Tag, RefreshCw, Globe, Youtube
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
  // AI Analysis fields
  ai_summary?: string;
  ai_key_takeaways?: string[];
  ai_topics?: { name: string; startTime: number; endTime: number; relevance: number }[];
  ai_sentiment?: string;
  ai_duration_seconds?: number;
  ai_language?: string;
  ai_analyzed_at?: string;
  processing_status?: string;
}

interface Comment {
  id: string;
  link_id: string;
  user_id: string;
  content: string;
  timestamp_seconds?: number;
  frame_data?: string;
  drawing_data?: any;
  is_resolved?: boolean;
  parent_comment_id?: string;
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
  confidence?: number;
  is_highlight?: boolean;
  highlight_category?: string;
}

interface Chapter {
  id: string;
  link_id: string;
  title: string;
  start_time: number;
  end_time?: number;
  description?: string;
  is_ai_generated: boolean;
}

interface Highlight {
  id: string;
  link_id: string;
  start_time: number;
  end_time?: number;
  text: string;
  category: "key_point" | "action_item" | "question" | "decision" | "important";
  importance: number;
  context?: string;
}

interface VisualTag {
  id: string;
  link_id: string;
  tag: string;
  category: string;
  confidence?: number;
  first_appearance: number;
  appearances?: { start: number; end: number }[];
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
  const [activeTab, setActiveTab] = useState<"comments" | "transcript" | "summary">("transcript");
  
  // Video AI Analysis state
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [visualTags, setVisualTags] = useState<VisualTag[]>([]);
  const [showHighlightsOnly, setShowHighlightsOnly] = useState(false);
  const [highlightFilter, setHighlightFilter] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  
  // Text-to-Speech state (ElevenLabs)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [speakingSegmentId, setSpeakingSegmentId] = useState<string | null>(null);
  
  // Video processing state
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  
  // Gemini Analysis state
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<"flash" | "pro">("flash");
  
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

  // Fetch chapters
  const fetchChapters = useCallback(async () => {
    if (!linkId) return;
    try {
      const response = await fetch(`/api/links/${linkId}/chapters`);
      if (response.ok) {
        const { chapters } = await response.json();
        setChapters(chapters || []);
      }
    } catch (error) {
      console.error("Failed to fetch chapters:", error);
    }
  }, [linkId]);

  // Fetch highlights
  const fetchHighlights = useCallback(async () => {
    if (!linkId) return;
    try {
      const response = await fetch(`/api/links/${linkId}/highlights`);
      if (response.ok) {
        const { highlights } = await response.json();
        setHighlights(highlights || []);
      }
    } catch (error) {
      console.error("Failed to fetch highlights:", error);
    }
  }, [linkId]);

  // Fetch visual tags
  const fetchVisualTags = useCallback(async () => {
    if (!linkId) return;
    try {
      const response = await fetch(`/api/links/${linkId}/visual-tags`);
      if (response.ok) {
        const { tags } = await response.json();
        setVisualTags(tags || []);
      }
    } catch (error) {
      console.error("Failed to fetch visual tags:", error);
    }
  }, [linkId]);

  useEffect(() => {
    fetchLink();
    fetchComments();
    fetchTranscript();
    fetchChapters();
    fetchHighlights();
    fetchVisualTags();
  }, [fetchLink, fetchComments, fetchTranscript, fetchChapters, fetchHighlights, fetchVisualTags]);

  // Update active chapter based on current time
  useEffect(() => {
    if (chapters.length > 0 && currentTime > 0) {
      const current = chapters.find(
        (c) => currentTime >= c.start_time && (!c.end_time || currentTime < c.end_time)
      );
      setActiveChapter(current || null);
    }
  }, [currentTime, chapters]);

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

  // Analyze link with Gemini
  const analyzeLink = async () => {
    if (!link?.url) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const response = await fetch("/api/links/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: link.url, 
          title: link.title || link.url,
          description: link.description,
          model: selectedModel 
        }),
      });
      const data = await response.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error("Failed to analyze link:", error);
    } finally {
      setIsAnalyzing(false);
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
        
        // Refresh all data after processing
        await Promise.all([
          fetchLink(),
          fetchTranscript(),
          fetchChapters(),
          fetchHighlights(),
          fetchVisualTags(),
        ]);
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
    
    // Function to set voice and speak
    const speakWithVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const germanVoice = voices.find(v => v.lang.startsWith("de")) || voices[0];
      if (germanVoice) {
        utterance.voice = germanVoice;
      }

      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingSegmentId(null);
      };

      utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
        // Ignore 'interrupted' errors (happens when user clicks stop)
        if (e.error !== "interrupted") {
          console.error("Speech error:", e.error);
        }
        setIsSpeaking(false);
        setSpeakingSegmentId(null);
      };

      window.speechSynthesis.speak(utterance);
    };

    // Voices may not be loaded yet, wait for them
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      speakWithVoice();
    } else {
      // Wait for voices to load
      window.speechSynthesis.onvoiceschanged = () => {
        speakWithVoice();
      };
      // Fallback: speak without specific voice after short delay
      setTimeout(() => {
        if (!window.speechSynthesis.speaking) {
          speakWithVoice();
        }
      }, 100);
    }
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
          <div className="relative bg-black flex items-center justify-center group" style={{ height: "55%" }}>
            {/* Show stored video if available - Custom Player */}
            {link?.video_url ? (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  src={link.video_url}
                  className="w-full h-full"
                  onClick={() => {
                    if (videoRef.current) {
                      if (isPlaying) videoRef.current.pause();
                      else videoRef.current.play();
                    }
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onTimeUpdate={() => {
                    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                  }}
                  onLoadedMetadata={() => {
                    if (videoRef.current) setDuration(videoRef.current.duration);
                  }}
                />
                
                {/* Custom Video Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Timeline with Chapters & Highlights */}
                  <div className="relative mb-3">
                    {/* Progress Bar */}
                    <div 
                      className="h-1.5 bg-white/30 rounded-full cursor-pointer relative"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const percent = (e.clientX - rect.left) / rect.width;
                        if (videoRef.current) {
                          videoRef.current.currentTime = percent * duration;
                        }
                      }}
                    >
                      {/* Chapter Markers */}
                      {chapters.map((chapter) => (
                        <div
                          key={chapter.id}
                          className="absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-green-400 rounded-full"
                          style={{ left: `${(chapter.start_time / duration) * 100}%` }}
                          title={chapter.title}
                        />
                      ))}
                      {/* Highlight Markers */}
                      {highlights.map((highlight) => (
                        <div
                          key={highlight.id}
                          className="absolute top-1/2 -translate-y-1/2 w-1.5 h-3 bg-yellow-400 rounded-full"
                          style={{ left: `${(highlight.start_time / duration) * 100}%` }}
                          title={highlight.text}
                        />
                      ))}
                      {/* Comment Markers */}
                      {comments.filter(c => c.timestamp_seconds).map((comment) => (
                        <div
                          key={comment.id}
                          className="absolute top-1/2 -translate-y-1/2 w-1.5 h-3 bg-blue-400 rounded-full"
                          style={{ left: `${((comment.timestamp_seconds || 0) / duration) * 100}%` }}
                          title={comment.content}
                        />
                      ))}
                      {/* Progress */}
                      <div 
                        className="absolute top-0 left-0 h-full bg-[var(--accent-primary)] rounded-full"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      />
                    </div>
                    {/* Current Chapter Display */}
                    {activeChapter && (
                      <div className="absolute -top-6 left-0 text-xs text-white/80 bg-black/50 px-2 py-0.5 rounded">
                        📍 {activeChapter.title}
                      </div>
                    )}
                  </div>
                  
                  {/* Controls Row */}
                  <div className="flex items-center gap-3">
                    {/* Play/Pause */}
                    <button
                      type="button"
                      onClick={() => {
                        if (videoRef.current) {
                          if (isPlaying) videoRef.current.pause();
                          else videoRef.current.play();
                        }
                      }}
                      className="text-white hover:text-[var(--accent-primary)] transition-colors"
                    >
                      {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    </button>
                    
                    {/* Time Display */}
                    <span className="text-white text-xs font-mono">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                    
                    {/* Spacer */}
                    <div className="flex-1" />
                    
                    {/* Playback Speed */}
                    <select
                      value={playbackSpeed}
                      onChange={(e) => {
                        const speed = parseFloat(e.target.value);
                        setPlaybackSpeed(speed);
                        if (videoRef.current) videoRef.current.playbackRate = speed;
                      }}
                      className="bg-white/20 text-white text-xs px-2 py-1 rounded border-none outline-none cursor-pointer"
                    >
                      <option value="0.5">0.5x</option>
                      <option value="0.75">0.75x</option>
                      <option value="1">1x</option>
                      <option value="1.25">1.25x</option>
                      <option value="1.5">1.5x</option>
                      <option value="2">2x</option>
                    </select>
                    
                    {/* Volume */}
                    <button
                      type="button"
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.muted = !isMuted;
                          setIsMuted(!isMuted);
                        }
                      }}
                      className="text-white hover:text-[var(--accent-primary)] transition-colors"
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </button>
                    
                    {/* Fullscreen */}
                    <button
                      type="button"
                      onClick={() => {
                        if (videoRef.current) {
                          if (document.fullscreenElement) {
                            document.exitFullscreen();
                          } else {
                            videoRef.current.requestFullscreen();
                          }
                        }
                      }}
                      className="text-white hover:text-[var(--accent-primary)] transition-colors"
                    >
                      <Maximize className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {/* Play Button Overlay */}
                {!isPlaying && (
                  <button
                    type="button"
                    onClick={() => videoRef.current?.play()}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <Play className="h-8 w-8 text-gray-800 ml-1" />
                    </div>
                  </button>
                )}
              </div>
            ) : isYouTube ? (
              <>
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1&rel=0`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                {/* Process Video Button - Prominent */}
                <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={processVideo}
                    disabled={isProcessingVideo}
                    className="px-5 py-2.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-medium rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50 transition-all hover:scale-105"
                  >
                    {isProcessingVideo ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {processingStatus || "Verarbeite..."}
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Mit Gemini 3 Flash analysieren
                      </>
                    )}
                  </button>
                  {!isProcessingVideo && (
                    <span className="text-xs text-white/70 bg-black/50 px-2 py-1 rounded">
                      Video herunterladen, transkribieren & analysieren
                    </span>
                  )}
                </div>
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

          {/* Link Info & Analysis Panel */}
          <div className="flex-1 overflow-y-auto">
            {/* Link Header */}
            <div className="p-6 border-b bg-gradient-to-br from-white to-gray-50/50">
              <div className="flex items-start gap-4">
                {link?.thumbnail_url && (
                  <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={link.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-semibold text-gray-900 mb-1 line-clamp-2">{link?.title || "Untitled"}</h1>
                  {link?.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{link.description}</p>
                  )}
                  <a
                    href={link?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline break-all flex items-center gap-1.5"
                  >
                    <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{link?.url}</span>
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                </div>
              </div>
            </div>

            {/* Video Processing Status - Only for YouTube */}
            {isYouTube && (
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-100 to-orange-100">
                      <Youtube className="h-4 w-4 text-red-600" />
                    </div>
                    <h2 className="text-sm font-semibold text-gray-800">Video-Verarbeitung</h2>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {link?.processing_status === "completed" && link?.video_url ? (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Heruntergeladen & Analysiert
                      </span>
                    ) : link?.processing_status === "processing" ? (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Wird verarbeitet...
                      </span>
                    ) : link?.ai_summary && !link?.video_url ? (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Analysiert (ohne Video)
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                        Nicht verarbeitet
                      </span>
                    )}
                    
                    {/* Re-Process Button */}
                    <button
                      type="button"
                      onClick={processVideo}
                      disabled={isProcessingVideo}
                      className="px-3 py-1.5 text-xs bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white rounded-lg flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                    >
                      {isProcessingVideo ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {processingStatus || "Verarbeite..."}
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3" />
                          {link?.video_url ? "Erneut verarbeiten" : "Video verarbeiten"}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className={`p-3 rounded-lg ${link?.video_url ? "bg-green-50" : "bg-gray-50"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Download className={`h-4 w-4 ${link?.video_url ? "text-green-600" : "text-gray-400"}`} />
                      <span className="text-xs font-medium text-gray-700">Video</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {link?.video_url ? "Im Bucket gespeichert" : "Nicht heruntergeladen"}
                    </p>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${transcript.length > 0 ? "bg-green-50" : "bg-gray-50"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className={`h-4 w-4 ${transcript.length > 0 ? "text-green-600" : "text-gray-400"}`} />
                      <span className="text-xs font-medium text-gray-700">Transkript</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {transcript.length > 0 ? `${transcript.length} Segmente` : "Nicht erstellt"}
                    </p>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${link?.ai_summary ? "bg-green-50" : "bg-gray-50"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className={`h-4 w-4 ${link?.ai_summary ? "text-green-600" : "text-gray-400"}`} />
                      <span className="text-xs font-medium text-gray-700">KI-Analyse</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {link?.ai_summary ? "Zusammenfassung erstellt" : "Nicht analysiert"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Summary, Transcript & Comments */}
        <div className="w-[420px] border-l flex flex-col bg-gray-50">
          {/* Tabs */}
          <div className="flex border-b bg-white">
            <button
              type="button"
              onClick={() => setActiveTab("summary")}
              className={`flex-1 px-3 py-3 text-xs font-medium flex items-center justify-center gap-1.5 ${
                activeTab === "summary"
                  ? "text-[var(--accent-primary-light)] border-b-2 border-[var(--accent-primary)]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Summary
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("transcript")}
              className={`flex-1 px-3 py-3 text-xs font-medium flex items-center justify-center gap-1.5 ${
                activeTab === "transcript"
                  ? "text-[var(--accent-primary-light)] border-b-2 border-[var(--accent-primary)]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Transcript
              {transcript.length > 0 && <span className="text-[10px] bg-gray-200 px-1.5 rounded-full">{transcript.length}</span>}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("comments")}
              className={`flex-1 px-3 py-3 text-xs font-medium flex items-center justify-center gap-1.5 ${
                activeTab === "comments"
                  ? "text-[var(--accent-primary-light)] border-b-2 border-[var(--accent-primary)]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Comments
              {comments.length > 0 && <span className="text-[10px] bg-gray-200 px-1.5 rounded-full">{comments.length}</span>}
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Summary Tab */}
            {activeTab === "summary" && (
              <div className="p-4 space-y-4">
                {/* AI Summary */}
                {link?.ai_summary ? (
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1 rounded-md bg-purple-100">
                        <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                      </div>
                      <span className="text-xs font-semibold text-gray-700">KI-Zusammenfassung</span>
                      {link.ai_language && (
                        <span className="ml-auto text-[10px] uppercase bg-gray-100 px-1.5 py-0.5 rounded font-medium">
                          {link.ai_language}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{link.ai_summary}</p>
                    
                    {/* Sentiment */}
                    {link.ai_sentiment && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          link.ai_sentiment === "positive" ? "bg-green-100 text-green-700" :
                          link.ai_sentiment === "negative" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {link.ai_sentiment === "positive" ? "😊 Positiv" : 
                           link.ai_sentiment === "negative" ? "😔 Negativ" : 
                           "😐 Neutral"}
                        </span>
                        {link.ai_duration_seconds && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {Math.floor(link.ai_duration_seconds / 60)}:{String(Math.floor(link.ai_duration_seconds % 60)).padStart(2, '0')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                    <Sparkles className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">Noch keine KI-Analyse vorhanden</p>
                    <button
                      type="button"
                      onClick={processVideo}
                      disabled={isProcessingVideo}
                      className="px-4 py-2 bg-[var(--accent-primary)] text-white text-sm rounded-lg hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 flex items-center gap-2 mx-auto"
                    >
                      {isProcessingVideo ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {processingStatus || "Verarbeite..."}
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4" />
                          Mit Gemini 3 Flash analysieren
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Key Takeaways */}
                {link?.ai_key_takeaways && link.ai_key_takeaways.length > 0 && (
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-blue-500" />
                      Key Takeaways
                    </h3>
                    <ul className="space-y-2">
                      {link.ai_key_takeaways.map((takeaway: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {takeaway}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Chapters */}
                {chapters.length > 0 && (
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-green-500" />
                      Kapitel ({chapters.length})
                    </h3>
                    <div className="space-y-1">
                      {chapters.map((chapter) => (
                        <button
                          key={chapter.id}
                          type="button"
                          onClick={() => jumpToTimestamp(chapter.start_time)}
                          className={`w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors ${
                            activeChapter?.id === chapter.id ? "bg-[var(--accent-primary)]/10 ring-1 ring-[var(--accent-primary)]/30" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-blue-600 font-mono">{formatTime(chapter.start_time)}</span>
                            <span className="text-sm font-medium text-gray-800">{chapter.title}</span>
                          </div>
                          {chapter.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 ml-12">{chapter.description}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Highlights */}
                {highlights.length > 0 && (
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 text-yellow-500" />
                      AI Highlights ({highlights.length})
                    </h3>
                    <div className="space-y-2">
                      {highlights.slice(0, 5).map((highlight) => (
                        <button
                          key={highlight.id}
                          type="button"
                          onClick={() => jumpToTimestamp(highlight.start_time)}
                          className="w-full text-left p-2 rounded-lg hover:bg-gray-50 border-l-2 transition-colors"
                          style={{
                            borderLeftColor: 
                              highlight.category === "key_point" ? "#8b5cf6" :
                              highlight.category === "action_item" ? "#f59e0b" :
                              highlight.category === "question" ? "#3b82f6" :
                              highlight.category === "decision" ? "#10b981" :
                              "#6b7280"
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-blue-600 font-mono">{formatTime(highlight.start_time)}</span>
                            <span className={`px-1.5 py-0.5 text-[10px] rounded ${
                              highlight.category === "key_point" ? "bg-purple-100 text-purple-700" :
                              highlight.category === "action_item" ? "bg-amber-100 text-amber-700" :
                              highlight.category === "question" ? "bg-blue-100 text-blue-700" :
                              highlight.category === "decision" ? "bg-green-100 text-green-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {highlight.category === "key_point" ? "Key Point" :
                               highlight.category === "action_item" ? "Action" :
                               highlight.category === "question" ? "Frage" :
                               highlight.category === "decision" ? "Entscheidung" :
                               "Wichtig"}
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              ★ {highlight.importance}/10
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{highlight.text}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visual Tags */}
                {visualTags.length > 0 && (
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-indigo-500" />
                      Erkannte Elemente ({visualTags.length})
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {visualTags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => jumpToTimestamp(tag.first_appearance)}
                          className={`px-2 py-1 text-xs rounded-full border hover:bg-gray-50 ${
                            tag.category === "person" ? "border-pink-200 bg-pink-50 text-pink-700" :
                            tag.category === "object" ? "border-blue-200 bg-blue-50 text-blue-700" :
                            tag.category === "scene" ? "border-green-200 bg-green-50 text-green-700" :
                            tag.category === "action" ? "border-orange-200 bg-orange-50 text-orange-700" :
                            tag.category === "emotion" ? "border-purple-200 bg-purple-50 text-purple-700" :
                            "border-gray-200 bg-gray-50 text-gray-700"
                          }`}
                        >
                          {tag.tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === "comments" && (
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
            )}

            {/* Transcript Tab */}
            {activeTab === "transcript" && (
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
