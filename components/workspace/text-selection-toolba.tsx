"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  Link2,
  MessageSquare,
  Type,
  Wand2,
  Languages,
  Minimize2,
  Loader2,
  Check,
  X,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Pilcrow,
  IndentDecrease,
  IndentIncrease,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// AI Icon (white version)
const AIIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className}
    viewBox="0 0 122.3 122.28" 
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g>
      <g>
        <path d="M62.84,76.47c-2.1,0-3.79-1.7-3.79-3.79v-15.4c0-2.13-1.73-3.86-3.86-3.86s-3.86,1.73-3.86,3.86v15.4c0,2.1-1.7,3.79-3.79,3.79s-3.79-1.7-3.79-3.79v-15.4c0-6.31,5.14-11.45,11.45-11.45s11.45,5.14,11.45,11.45v15.4c0,2.1-1.7,3.79-3.79,3.79Z"/>
        <path d="M62.84,68.09h-15.32c-2.1,0-3.79-1.7-3.79-3.79s1.7-3.79,3.79-3.79h15.32c2.1,0,3.79,1.7,3.79,3.79s-1.7,3.79-3.79,3.79Z"/>
        <path d="M74.8,76.47c-2.1,0-3.79-1.7-3.79-3.79v-23.06c0-2.1,1.7-3.79,3.79-3.79s3.79,1.7,3.79,3.79v23.06c0,2.1-1.7,3.79-3.79,3.79Z"/>
      </g>
      <path d="M105.4,64.94c-1.25,0-2.48-.62-3.2-1.76-5.25-8.25-11.73-16.26-19.27-23.8C53.5,9.96,22.48,1.45,11.97,11.96c-6.46,6.47-5.74,19.93,1.95,36.02,.9,1.89,.1,4.16-1.79,5.06-1.89,.9-4.15,.1-5.06-1.79C-2.19,31.84-2.36,15.57,6.61,6.59c15.21-15.21,51.09-3.17,81.68,27.42,7.93,7.93,14.76,16.37,20.31,25.09,1.13,1.77,.6,4.11-1.16,5.24-.63,.4-1.34,.59-2.03,.59Z"/>
      <path d="M97.83,122.25c-17.92,0-42.51-12.7-63.79-33.98-7.93-7.93-14.76-16.37-20.31-25.09-1.13-1.77-.6-4.11,1.16-5.24,1.77-1.13,4.12-.6,5.24,1.16,5.25,8.25,11.73,16.26,19.27,23.8,24.15,24.15,53.14,37,67.43,29.93,1.87-.93,4.15-.17,5.08,1.71,.93,1.88,.16,4.15-1.71,5.08-3.56,1.77-7.75,2.61-12.38,2.61Z"/>
      <path d="M113.03,116.81c-.97,0-1.94-.37-2.68-1.11-1.48-1.48-1.48-3.88,0-5.37,1.22-1.21,2.19-2.69,2.9-4.38,.81-1.93,3.04-2.84,4.96-2.04,1.93,.81,2.84,3.03,2.04,4.96-1.09,2.61-2.62,4.91-4.54,6.82-.74,.74-1.71,1.11-2.68,1.11Z"/>
      <path d="M116.75,111.21c-.49,0-.99-.1-1.46-.3-1.93-.81-2.84-3.03-2.03-4.96,3.05-7.27,1.28-18.81-4.85-31.64-.9-1.89-.1-4.16,1.79-5.06,1.89-.9,4.16-.1,5.06,1.79,7.16,15,8.94,28.44,5,37.84-.61,1.45-2.02,2.33-3.5,2.33Z"/>
      <path d="M61.17,109.17c-1.25,0-2.48-.62-3.2-1.76-1.13-1.77-.6-4.11,1.16-5.24,8.25-5.25,16.26-11.73,23.8-19.27,29.42-29.42,37.93-60.44,27.42-70.95-6.28-6.28-19.33-5.75-34.9,1.42-1.91,.88-4.16,.04-5.03-1.86-.88-1.9-.05-4.16,1.86-5.03,18.85-8.69,34.69-8.65,43.44,.11,15.21,15.21,3.17,51.09-27.42,81.68-7.93,7.93-16.37,14.76-25.09,20.31-.63,.4-1.34,.59-2.03,.59Z"/>
      <path d="M24.64,122.28c-7.46,0-13.65-2.2-18.03-6.58-15.21-15.21-3.17-51.09,27.42-81.68,7.77-7.77,16.04-14.5,24.59-19.98,1.76-1.14,4.11-.62,5.24,1.14,1.13,1.76,.62,4.11-1.14,5.24-8.08,5.2-15.93,11.58-23.32,18.97-13.47,13.47-23.63,28.54-28.63,42.44-4.59,12.77-4.15,23.16,1.2,28.51,6.14,6.14,18.85,5.76,34-1.01,1.91-.85,4.16,0,5.01,1.91s0,4.16-1.91,5.01c-9,4.03-17.3,6.03-24.43,6.03Z"/>
    </g>
  </svg>
);

interface TextSelectionToolbarProps {
  containerRef: React.RefObject<HTMLElement | null>;
  onTextReplace?: (newText: string) => void;
}

interface SelectionInfo {
  text: string;
  rect: DOMRect;
  inputElement: HTMLInputElement | HTMLTextAreaElement | null;
  start: number;
  end: number;
}

const AI_OPTIONS = [
  { id: "improve", label: "Improve Writing", icon: Wand2 },
  { id: "fix", label: "Fix Spelling", icon: Check },
  { id: "translate", label: "Translate...", icon: Languages },
  { id: "simplify", label: "Simplify", icon: Minimize2 },
];

const HEADING_OPTIONS = [
  { id: "h1", label: "Heading 1", prefix: "# ", icon: Heading1 },
  { id: "h2", label: "Heading 2", prefix: "## ", icon: Heading2 },
  { id: "h3", label: "Heading 3", prefix: "### ", icon: Heading3 },
  { id: "h4", label: "Heading 4", prefix: "#### ", icon: Heading4 },
  { id: "p", label: "Paragraph", prefix: "", icon: Pilcrow },
];

const ALIGNMENT_OPTIONS = [
  { id: "left", label: "Left", icon: AlignLeft },
  { id: "center", label: "Center", icon: AlignCenter },
  { id: "right", label: "Right", icon: AlignRight },
];

export function TextSelectionToolbar({ containerRef, onTextReplace }: TextSelectionToolbarProps) {
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [currentHeading, setCurrentHeading] = useState("h1");
  const [currentAlignment, setCurrentAlignment] = useState("left");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  // Get selection from input/textarea elements
  const getInputSelection = useCallback((): SelectionInfo | null => {
    const activeElement = document.activeElement;
    
    if (
      activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLTextAreaElement
    ) {
      const start = activeElement.selectionStart ?? 0;
      const end = activeElement.selectionEnd ?? 0;
      
      if (start !== end) {
        const text = activeElement.value.substring(start, end);
        
        // Get the position of the selection
        const tempSpan = document.createElement("span");
        tempSpan.style.cssText = window.getComputedStyle(activeElement).cssText;
        tempSpan.style.position = "absolute";
        tempSpan.style.visibility = "hidden";
        tempSpan.style.whiteSpace = "pre-wrap";
        tempSpan.textContent = activeElement.value.substring(0, start);
        document.body.appendChild(tempSpan);
        
        const inputRect = activeElement.getBoundingClientRect();
        const spanRect = tempSpan.getBoundingClientRect();
        
        document.body.removeChild(tempSpan);
        
        // Create a synthetic rect for the selection
        const rect = new DOMRect(
          inputRect.left + (spanRect.width % inputRect.width),
          inputRect.top + Math.floor(spanRect.width / inputRect.width) * parseFloat(window.getComputedStyle(activeElement).lineHeight || "20"),
          100,
          20
        );
        
        return {
          text,
          rect: inputRect, // Use input rect for positioning
          inputElement: activeElement,
          start,
          end,
        };
      }
    }
    
    return null;
  }, []);

  // Handle selection change
  const handleSelectionChange = useCallback(() => {
    const inputSelection = getInputSelection();
    
    if (inputSelection && inputSelection.text.trim().length > 0) {
      setSelection(inputSelection);
      setShowAIMenu(false);
      setAiResult(null);
    } else {
      // Small delay to prevent flickering when clicking toolbar
      setTimeout(() => {
        // Don't hide if a popover is open or if clicking inside toolbar
        if (!toolbarRef.current?.contains(document.activeElement) && !isPopoverOpen) {
          // Also check if any radix popover is open
          const openPopover = document.querySelector('[data-state="open"][data-radix-popper-content-wrapper]');
          if (!openPopover) {
            setSelection(null);
            setShowAIMenu(false);
            setAiResult(null);
          }
        }
      }, 150);
    }
  }, [getInputSelection, isPopoverOpen]);

  // Listen for selection changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseUp = () => {
      setTimeout(handleSelectionChange, 10);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.shiftKey || e.key === "Shift") {
        setTimeout(handleSelectionChange, 10);
      }
    };

    container.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("keyup", handleKeyUp);
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [containerRef, handleSelectionChange]);

  // Focus AI input when menu opens
  useEffect(() => {
    if (showAIMenu && aiInputRef.current) {
      aiInputRef.current.focus();
    }
  }, [showAIMenu]);

  // Focus link input when shown
  useEffect(() => {
    if (showLinkInput && linkInputRef.current) {
      linkInputRef.current.focus();
    }
  }, [showLinkInput]);

  // Apply text replacement to input
  const applyTextReplacement = useCallback((newText: string) => {
    if (!selection || !selection.inputElement) return;

    const input = selection.inputElement;
    const newValue =
      input.value.substring(0, selection.start) +
      newText +
      input.value.substring(selection.end);

    // Trigger the change using native setter
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      input instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype,
      "value"
    )?.set;

    nativeInputValueSetter?.call(input, newValue);

    const event = new Event("input", { bubbles: true });
    input.dispatchEvent(event);

    // Call callback if provided
    onTextReplace?.(newValue);

    // Reset selection
    setSelection(null);
  }, [selection, onTextReplace]);

  // Apply formatting (wrap text with markdown syntax)
  const applyFormatting = useCallback((prefix: string, suffix: string = prefix) => {
    if (!selection) return;
    const formattedText = `${prefix}${selection.text}${suffix}`;
    applyTextReplacement(formattedText);
  }, [selection, applyTextReplacement]);

  // Apply heading
  const applyHeading = useCallback((headingId: string) => {
    if (!selection) return;
    const heading = HEADING_OPTIONS.find(h => h.id === headingId);
    if (!heading) return;
    
    // For headings, we prefix the line
    const formattedText = `${heading.prefix}${selection.text}`;
    applyTextReplacement(formattedText);
    setCurrentHeading(headingId);
  }, [selection, applyTextReplacement]);

  // Apply link
  const applyLink = useCallback(() => {
    if (!selection || !linkUrl.trim()) return;
    const formattedText = `[${selection.text}](${linkUrl})`;
    applyTextReplacement(formattedText);
    setShowLinkInput(false);
    setLinkUrl("");
  }, [selection, linkUrl, applyTextReplacement]);

  // Process text with AI
  const processWithAI = async (action: string, customPrompt?: string) => {
    if (!selection) return;

    setIsProcessing(true);
    setAiResult(null);

    try {
      const response = await fetch("/api/notes/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: selection.text,
          action,
          customPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error("AI processing failed");
      }

      const data = await response.json();
      setAiResult(data.result);
    } catch (error) {
      console.error("AI processing error:", error);
      setAiResult("Error processing text. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply AI result to the text
  const applyAIResult = () => {
    if (!aiResult || !selection) return;
    applyTextReplacement(aiResult);
    setShowAIMenu(false);
    setAiResult(null);
  };

  // Handle AI option click
  const handleAIOptionClick = (optionId: string) => {
    if (optionId === "translate") {
      setAiPrompt("Translate to English");
      aiInputRef.current?.focus();
    } else {
      processWithAI(optionId);
    }
  };

  // Handle custom AI prompt
  const handleCustomPrompt = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && aiPrompt.trim()) {
      processWithAI("custom", aiPrompt);
    }
  };

  if (!selection) return null;

  // Calculate toolbar position
  const toolbarStyle: React.CSSProperties = {
    position: "fixed",
    left: Math.max(10, selection.rect.left),
    top: Math.max(10, selection.rect.top - 50),
    zIndex: 9999,
  };

  return (
    <div
      ref={toolbarRef}
      style={toolbarStyle}
      className="animate-in fade-in-0 zoom-in-95 duration-150"
    >
      {showLinkInput ? (
        // Link input
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg border border-[var(--workspace-sidebar-border)]" style={{ backgroundColor: 'var(--workspace-sidebar)' }}>
          <Link2 className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
          <input
            ref={linkInputRef}
            type="text"
            placeholder="Enter URL..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyLink();
              if (e.key === "Escape") {
                setShowLinkInput(false);
                setLinkUrl("");
              }
            }}
            className="flex-1 text-sm bg-transparent outline-none text-[var(--workspace-sidebar-foreground)] placeholder:text-[var(--workspace-sidebar-muted-foreground)] min-w-[200px]"
          />
          <button
            type="button"
            onClick={applyLink}
            disabled={!linkUrl.trim()}
            className="px-2 py-1 bg-[var(--accent-primary-light)] text-white rounded text-xs font-medium hover:bg-[var(--accent-primary)] disabled:opacity-50"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl("");
            }}
            className="p-1 hover:bg-[var(--workspace-sidebar-muted)] rounded"
          >
            <X className="h-3 w-3 text-[var(--workspace-sidebar-muted-foreground)]" />
          </button>
        </div>
      ) : !showAIMenu ? (
        // Main formatting toolbar
        <div className="flex items-center gap-0.5 px-2 py-1.5 rounded-lg shadow-lg border border-[var(--workspace-sidebar-border)]" style={{ backgroundColor: 'var(--workspace-sidebar)' }}>
          {/* AI Button */}
          <button
            type="button"
            onClick={() => setShowAIMenu(true)}
            className="p-1.5 hover:bg-[var(--workspace-sidebar-muted)] rounded transition-colors"
            title="AI Actions"
          >
            <AIIcon className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
          </button>

          <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--workspace-sidebar-border)' }} />

          {/* Heading dropdown */}
          <Popover onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 px-2 py-1 hover:bg-[var(--workspace-sidebar-muted)] rounded text-sm text-[var(--workspace-sidebar-foreground)]"
              >
                <Type className="h-4 w-4" />
                <span>{HEADING_OPTIONS.find(h => h.id === currentHeading)?.label || "Heading 1"}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1" align="start">
              {HEADING_OPTIONS.map((heading) => (
                <button
                  key={heading.id}
                  type="button"
                  onClick={() => applyHeading(heading.id)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-100 ${
                    currentHeading === heading.id ? "bg-gray-100 font-medium" : ""
                  }`}
                >
                  <heading.icon className="h-4 w-4 text-gray-500" />
                  {heading.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--workspace-sidebar-border)' }} />

          {/* Formatting buttons */}
          <button
            type="button"
            onClick={() => applyFormatting("**")}
            className="p-1.5 hover:bg-[var(--workspace-sidebar-muted)] rounded transition-colors"
            title="Bold (**text**)"
          >
            <Bold className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
          </button>
          <button
            type="button"
            onClick={() => applyFormatting("*")}
            className="p-1.5 hover:bg-[var(--workspace-sidebar-muted)] rounded transition-colors"
            title="Italic (*text*)"
          >
            <Italic className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
          </button>
          <button
            type="button"
            onClick={() => applyFormatting("<u>", "</u>")}
            className="p-1.5 hover:bg-[var(--workspace-sidebar-muted)] rounded transition-colors"
            title="Underline"
          >
            <Underline className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
          </button>
          <button
            type="button"
            onClick={() => applyFormatting("~~")}
            className="p-1.5 hover:bg-[var(--workspace-sidebar-muted)] rounded transition-colors"
            title="Strikethrough (~~text~~)"
          >
            <Strikethrough className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
          </button>
          <button
            type="button"
            onClick={() => applyFormatting("`")}
            className="p-1.5 hover:bg-[var(--workspace-sidebar-muted)] rounded transition-colors"
            title="Code (`text`)"
          >
            <Code className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
          </button>

          <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--workspace-sidebar-border)' }} />

          {/* Alignment dropdown */}
          <Popover onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 px-2 py-1 hover:bg-[var(--workspace-sidebar-muted)] rounded text-sm text-[var(--workspace-sidebar-foreground)]"
              >
                {currentAlignment === "left" && <AlignLeft className="h-4 w-4" />}
                {currentAlignment === "center" && <AlignCenter className="h-4 w-4" />}
                {currentAlignment === "right" && <AlignRight className="h-4 w-4" />}
                <span className="capitalize">{currentAlignment}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-32 p-1" align="start">
              {ALIGNMENT_OPTIONS.map((align) => (
                <button
                  key={align.id}
                  type="button"
                  onClick={() => {
                    setCurrentAlignment(align.id);
                    // For plain text, we can add alignment markers
                    if (align.id === "center") {
                      applyFormatting("<center>", "</center>");
                    } else if (align.id === "right") {
                      applyFormatting("<div align=\"right\">", "</div>");
                    }
                    // Left is default, no formatting needed
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-100 ${
                    currentAlignment === align.id ? "bg-gray-100 font-medium" : ""
                  }`}
                >
                  <align.icon className="h-4 w-4 text-gray-500" />
                  {align.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--workspace-sidebar-border)' }} />

          {/* Font style dropdown */}
          <Popover onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 px-2 py-1 hover:bg-[var(--workspace-sidebar-muted)] rounded text-sm text-[var(--workspace-sidebar-foreground)]"
              >
                <span className="font-medium">A</span>
                <span>Default</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-36 p-1" align="start">
              <button
                type="button"
                onClick={() => {/* Default - no change */}}
                className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-gray-100"
              >
                Default
              </button>
              <button
                type="button"
                onClick={() => applyFormatting("<small>", "</small>")}
                className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-gray-100"
              >
                <small>Small</small>
              </button>
              <button
                type="button"
                onClick={() => applyFormatting("<mark>", "</mark>")}
                className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-gray-100"
              >
                <mark>Highlight</mark>
              </button>
              <button
                type="button"
                onClick={() => applyFormatting("<sup>", "</sup>")}
                className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-gray-100"
              >
                Superscript<sup>x</sup>
              </button>
              <button
                type="button"
                onClick={() => applyFormatting("<sub>", "</sub>")}
                className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-gray-100"
              >
                Subscript<sub>x</sub>
              </button>
            </PopoverContent>
          </Popover>

          <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--workspace-sidebar-border)' }} />

          {/* Additional actions */}
          <button
            type="button"
            onClick={() => applyFormatting("  ", "")}
            className="p-1.5 hover:bg-[var(--workspace-sidebar-muted)] rounded transition-colors"
            title="Indent"
          >
            <IndentIncrease className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
          </button>
          <button
            type="button"
            onClick={() => setShowLinkInput(true)}
            className="p-1.5 hover:bg-[var(--workspace-sidebar-muted)] rounded transition-colors"
            title="Add Link"
          >
            <Link2 className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
          </button>
          <button
            type="button"
            onClick={() => applyFormatting("> ")}
            className="p-1.5 hover:bg-[var(--workspace-sidebar-muted)] rounded transition-colors"
            title="Quote"
          >
            <MessageSquare className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
          </button>
        </div>
      ) : (
        // AI Menu
        <div className="w-80 rounded-lg shadow-lg border border-[var(--workspace-sidebar-border)] overflow-hidden" style={{ backgroundColor: 'var(--workspace-sidebar)' }}>
          {/* AI Input */}
          <div className="p-3 border-b" style={{ borderColor: 'var(--workspace-sidebar-border)' }}>
            <div className="flex items-center gap-2">
              <AIIcon className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)] flex-shrink-0" />
              <input
                ref={aiInputRef}
                type="text"
                placeholder="Ask AI anything..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={handleCustomPrompt}
                className="flex-1 text-sm bg-transparent outline-none text-[var(--workspace-sidebar-foreground)] placeholder:text-[var(--workspace-sidebar-muted-foreground)]"
                disabled={isProcessing}
              />
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin text-[var(--workspace-sidebar-muted-foreground)]" />}
            </div>
          </div>

          {/* AI Result */}
          {aiResult && (
            <div className="p-3 border-b" style={{ borderColor: 'var(--workspace-sidebar-border)', backgroundColor: 'var(--workspace-sidebar-muted)' }}>
              <p className="text-sm text-[var(--workspace-sidebar-foreground)] whitespace-pre-wrap mb-3">{aiResult}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={applyAIResult}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-primary-light)] text-white rounded-lg text-xs font-medium hover:bg-[var(--accent-primary)] transition-colors"
                >
                  <Check className="h-3 w-3" />
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAiResult(null);
                    setShowAIMenu(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors text-[var(--workspace-sidebar-foreground)]" style={{ borderColor: 'var(--workspace-sidebar-border)' }}
                >
                  <X className="h-3 w-3" />
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* AI Options */}
          {!aiResult && (
            <div className="py-1">
              {AI_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleAIOptionClick(option.id)}
                  disabled={isProcessing}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)] transition-colors disabled:opacity-50"
                >
                  <option.icon className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {/* Back button */}
          <div className="p-2 border-t" style={{ borderColor: 'var(--workspace-sidebar-border)' }}>
            <button
              type="button"
              onClick={() => {
                setShowAIMenu(false);
                setAiResult(null);
                setAiPrompt("");
              }}
              className="w-full text-xs text-[var(--workspace-sidebar-muted-foreground)] hover:text-[var(--workspace-sidebar-foreground)] transition-colors"
            >
              ← Back to formatting
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
