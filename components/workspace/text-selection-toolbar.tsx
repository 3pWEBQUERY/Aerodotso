"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
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
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-lg border border-gray-200">
          <Link2 className="h-4 w-4 text-gray-400" />
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
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400 min-w-[200px]"
          />
          <button
            type="button"
            onClick={applyLink}
            disabled={!linkUrl.trim()}
            className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl("");
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-3 w-3 text-gray-500" />
          </button>
        </div>
      ) : !showAIMenu ? (
        // Main formatting toolbar
        <div className="flex items-center gap-0.5 px-2 py-1.5 bg-white rounded-lg shadow-lg border border-gray-200">
          {/* AI Button */}
          <button
            type="button"
            onClick={() => setShowAIMenu(true)}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="AI Actions"
          >
            <Sparkles className="h-4 w-4 text-gray-600" />
          </button>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Heading dropdown */}
          <Popover onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm text-gray-700"
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

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Formatting buttons */}
          <button
            type="button"
            onClick={() => applyFormatting("**")}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Bold (**text**)"
          >
            <Bold className="h-4 w-4 text-gray-600" />
          </button>
          <button
            type="button"
            onClick={() => applyFormatting("*")}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Italic (*text*)"
          >
            <Italic className="h-4 w-4 text-gray-600" />
          </button>
          <button
            type="button"
            onClick={() => applyFormatting("<u>", "</u>")}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Underline"
          >
            <Underline className="h-4 w-4 text-gray-600" />
          </button>
          <button
            type="button"
            onClick={() => applyFormatting("~~")}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Strikethrough (~~text~~)"
          >
            <Strikethrough className="h-4 w-4 text-gray-600" />
          </button>
          <button
            type="button"
            onClick={() => applyFormatting("`")}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Code (`text`)"
          >
            <Code className="h-4 w-4 text-gray-600" />
          </button>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Alignment dropdown */}
          <Popover onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm text-gray-700"
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

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Font style dropdown */}
          <Popover onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm text-gray-700"
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

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Additional actions */}
          <button
            type="button"
            onClick={() => applyFormatting("  ", "")}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Indent"
          >
            <IndentIncrease className="h-4 w-4 text-gray-600" />
          </button>
          <button
            type="button"
            onClick={() => setShowLinkInput(true)}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Add Link"
          >
            <Link2 className="h-4 w-4 text-gray-600" />
          </button>
          <button
            type="button"
            onClick={() => applyFormatting("> ")}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Quote"
          >
            <MessageSquare className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      ) : (
        // AI Menu
        <div className="w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {/* AI Input */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <input
                ref={aiInputRef}
                type="text"
                placeholder="Ask AI anything..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={handleCustomPrompt}
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400"
                disabled={isProcessing}
              />
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            </div>
          </div>

          {/* AI Result */}
          {aiResult && (
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{aiResult}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={applyAIResult}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
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
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
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
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <option.icon className="h-4 w-4 text-gray-400" />
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {/* Back button */}
          <div className="p-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setShowAIMenu(false);
                setAiResult(null);
                setAiPrompt("");
              }}
              className="w-full text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back to formatting
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
