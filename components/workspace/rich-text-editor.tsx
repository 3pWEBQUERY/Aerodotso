"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  Link2,
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
  Quote,
  Highlighter,
  PenLine,
  List,
} from "lucide-react";

// AI Text Generate Icon
const AITextIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className}
    viewBox="0 0 24 24" 
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M21.13,7.52c-.67-.19-1.29-.49-1.82-.91-1.16-.91-1.64-2.11-1.83-2.74-.12-.43-.84-.43-.96,0-.18.64-.67,1.84-1.83,2.74-.54.42-1.15.73-1.82.91-.22.06-.37.26-.37.48s.15.42.37.48c.67.19,1.29.49,1.82.91,1.16.91,1.64,2.11,1.83,2.74.06.21.26.36.48.36s.42-.15.48-.36c.18-.64.67-1.84,1.83-2.74.54-.42,1.15-.73,1.82-.91.22-.06.37-.26.37-.48s-.15-.42-.37-.48ZM18.69,8.61c-.81.64-1.35,1.39-1.69,2.06-.35-.67-.88-1.42-1.69-2.06-.3-.23-.61-.43-.94-.61.33-.17.65-.38.94-.61.81-.64,1.35-1.39,1.69-2.06.35.67.88,1.42,1.69,2.06.3.23.61.43.94.61-.33.17-.65.38-.94.61Z"/>
    <path d="M17,13.5c-.28,0-.5.22-.5.5v4c0,1.38-1.12,2.5-2.5,2.5H6c-1.38,0-2.5-1.12-2.5-2.5v-7c0-1.38,1.12-2.5,2.5-2.5h5c.28,0,.5-.22.5-.5s-.22-.5-.5-.5h-5c-1.93,0-3.5,1.57-3.5,3.5v7c0,1.93,1.57,3.5,3.5,3.5h8c1.93,0,3.5-1.57,3.5-3.5v-4c0-.28-.22-.5-.5-.5Z"/>
    <path d="M7.54,11.81l-2,5c-.1.26.02.55.28.65.25.1.55-.02.65-.28l.67-1.69h1.72l.67,1.69c.08.2.27.31.46.31.06,0,.12-.01.19-.04.26-.1.38-.39.28-.65l-2-5c-.15-.38-.78-.38-.93,0ZM7.54,14.5l.46-1.15.46,1.15h-.92Z"/>
    <path d="M12,12.5h.5v4h-.5c-.28,0-.5.22-.5.5s.22.5.5.5h2c.28,0,.5-.22.5-.5s-.22-.5-.5-.5h-.5v-4h.5c.28,0,.5-.22.5-.5s-.22-.5-.5-.5h-2c-.28,0-.5.22-.5.5s.22.5.5.5Z"/>
  </svg>
);
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

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

interface RichTextEditorProps {
  content: string;
  onUpdate: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const AI_OPTIONS = [
  { id: "fix", label: "Check spelling", icon: Check },
  { id: "improve", label: "Improve Writing", icon: Wand2 },
  { id: "translate", label: "Translate...", icon: Languages },
  { id: "simplify", label: "Simplify", icon: Minimize2 },
];

export function RichTextEditor({ content, onUpdate, placeholder = "Start writing...", className }: RichTextEditorProps) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [showGeneratePopover, setShowGeneratePopover] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [showTocPopover, setShowTocPopover] = useState(false);
  const [headings, setHeadings] = useState<{ level: number; text: string; id: string }[]>([]);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[var(--accent-primary-light)] underline cursor-pointer",
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: "outline-none min-h-[300px]",
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const hasSelection = from !== to;
      
      // Get selection coordinates
      const { view } = editor;
      const coords = view.coordsAtPos(from);
      
      // Position toolbar above the cursor/selection
      const containerRect = editorContainerRef.current?.getBoundingClientRect();
      if (containerRect) {
        if (hasSelection) {
          const end = view.coordsAtPos(to);
          setToolbarPosition({
            top: coords.top - containerRect.top - 50,
            left: Math.min(coords.left, end.left) - containerRect.left,
          });
        } else {
          setToolbarPosition({
            top: coords.top - containerRect.top - 50,
            left: coords.left - containerRect.left,
          });
        }
      }
      
      // Store selected text if there's a selection
      if (hasSelection) {
        setSelectedText(editor.state.doc.textBetween(from, to, " "));
      }
      
      // Always show toolbar when editor is focused
      setShowToolbar(true);
    },
  });

  // Sync content when it changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Extract headings from editor content for TOC
  useEffect(() => {
    if (!editor) return;
    
    const extractHeadings = () => {
      const doc = editor.state.doc;
      const extractedHeadings: { level: number; text: string; id: string }[] = [];
      let headingIndex = 0;
      
      doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          const level = node.attrs.level;
          const text = node.textContent;
          if (text.trim()) {
            extractedHeadings.push({
              level,
              text,
              id: `heading-${headingIndex++}`,
            });
          }
        }
      });
      
      setHeadings(extractedHeadings);
    };
    
    extractHeadings();
    
    // Listen for content changes
    editor.on('update', extractHeadings);
    return () => {
      editor.off('update', extractHeadings);
    };
  }, [editor]);

  // Scroll to heading
  const scrollToHeading = (index: number) => {
    if (!editor) return;
    
    const doc = editor.state.doc;
    let currentIndex = 0;
    let targetPos = 0;
    
    doc.descendants((node, pos) => {
      if (node.type.name === 'heading' && node.textContent.trim()) {
        if (currentIndex === index) {
          targetPos = pos;
          return false;
        }
        currentIndex++;
      }
    });
    
    // Focus the editor at that position first
    editor.chain().focus().setTextSelection(targetPos + 1).run();
    
    // Get the DOM element and scroll it into view
    const domAtPos = editor.view.domAtPos(targetPos);
    const element = domAtPos.node as HTMLElement;
    if (element && element.scrollIntoView) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Fallback: use coordinates
      const coords = editor.view.coordsAtPos(targetPos);
      window.scrollTo({
        top: window.scrollY + coords.top - 100,
        behavior: 'smooth'
      });
    }
  };

  // Hide toolbar when clicking outside (but not when generate popover is open)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't handle if generate popover is open
      if (showGeneratePopover) return;
      
      const target = event.target as Node;
      const isInsideEditor = editorContainerRef.current?.contains(target);
      const isInsideToolbar = toolbarRef.current?.contains(target);
      // Check for any open popovers (Radix UI)
      const openPopovers = document.querySelectorAll('[data-state="open"][data-radix-popper-content-wrapper]');
      let isInsidePopover = false;
      openPopovers.forEach((popover) => {
        if (popover.contains(target)) {
          isInsidePopover = true;
        }
      });
      
      if (!isInsideEditor && !isInsideToolbar && !isInsidePopover) {
        setShowToolbar(false);
        setShowAIMenu(false);
        setShowLinkInput(false);
        setAiResult(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showGeneratePopover]);

  // Get selected text (use stored selection or current selection)
  const getSelectedText = useCallback(() => {
    if (!editor) return "";
    // First try to get current selection
    const { from, to } = editor.state.selection;
    const currentSelection = editor.state.doc.textBetween(from, to, " ");
    // Return current selection if exists, otherwise return stored selection
    return currentSelection || selectedText;
  }, [editor, selectedText]);

  // Process text with AI
  const processWithAI = async (action: string, customPrompt?: string) => {
    const selectedText = getSelectedText();
    if (!selectedText) return;

    setIsProcessing(true);
    setAiResult(null);

    try {
      const response = await fetch("/api/notes/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: selectedText,
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

  // Apply AI result
  const applyAIResult = () => {
    if (!aiResult || !editor) return;
    editor.chain().focus().deleteSelection().insertContent(aiResult).run();
    setShowAIMenu(false);
    setAiResult(null);
    setShowToolbar(false);
    setSelectedText(""); // Clear stored selection
  };

  // Handle AI option click
  const handleAIOptionClick = (optionId: string) => {
    if (optionId === "translate") {
      setAiPrompt("Translate to English");
    } else {
      processWithAI(optionId);
    }
  };

  // Apply link
  const applyLink = () => {
    if (!editor || !linkUrl.trim()) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
    setShowLinkInput(false);
    setLinkUrl("");
  };

  // Generate text with AI
  const generateTextWithAI = async () => {
    if (!generatePrompt.trim()) return;

    setIsGenerating(true);
    setGeneratedText(null);

    try {
      const response = await fetch("/api/notes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: generatePrompt }),
      });

      if (!response.ok) {
        throw new Error("AI generation failed");
      }

      const data = await response.json();
      setGeneratedText(data.result);
    } catch (error) {
      console.error("AI generation error:", error);
      setGeneratedText("Error generating text. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Convert markdown to HTML
  const markdownToHtml = (text: string): string => {
    let html = text;
    // Convert headings (must be done in order from most # to least)
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    // Convert bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Convert italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Convert line breaks to paragraphs
    html = html.split('\n\n').map(p => {
      if (p.startsWith('<h') || p.trim() === '') return p;
      return `<p>${p}</p>`;
    }).join('');
    // Convert single line breaks within paragraphs
    html = html.replace(/(?<!>)\n(?!<)/g, '<br>');
    return html;
  };

  // Insert generated text
  const insertGeneratedText = () => {
    if (!generatedText || !editor) return;
    const htmlContent = markdownToHtml(generatedText);
    editor.chain().focus().insertContent(htmlContent).run();
    setShowGeneratePopover(false);
    setGeneratedText(null);
    setGeneratePrompt("");
  };

  if (!editor) return null;

  const getCurrentHeading = () => {
    if (editor.isActive("heading", { level: 1 })) return "Heading 1";
    if (editor.isActive("heading", { level: 2 })) return "Heading 2";
    if (editor.isActive("heading", { level: 3 })) return "Heading 3";
    if (editor.isActive("heading", { level: 4 })) return "Heading 4";
    return "Paragraph";
  };

  const getCurrentAlignment = () => {
    if (editor.isActive({ textAlign: "center" })) return "center";
    if (editor.isActive({ textAlign: "right" })) return "right";
    return "left";
  };

  return (
    <div ref={editorContainerRef} className={`relative ${className}`}>
      {/* Floating Toolbar */}
      {showToolbar && (
        <div
          ref={toolbarRef}
          style={{
            position: "absolute",
            top: toolbarPosition.top,
            left: Math.max(0, toolbarPosition.left),
            zIndex: 50,
          }}
          className="animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {showLinkInput ? (
            // Link input
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-lg border border-gray-200">
              <Link2 className="h-4 w-4 text-gray-400" />
              <input
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
                autoFocus
              />
              <button
                type="button"
                onClick={applyLink}
                disabled={!linkUrl.trim()}
                className="px-2 py-1 bg-[var(--accent-primary)] text-white rounded text-xs font-medium hover:bg-[var(--accent-primary-hover)] disabled:opacity-50"
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
          ) : showAIMenu ? (
            // AI Menu
            <div className="w-80 rounded-lg shadow-lg border border-[var(--workspace-sidebar-border)] overflow-hidden" style={{ backgroundColor: 'var(--workspace-sidebar)' }}>
              {/* AI Input */}
              <div className="p-3 border-b" style={{ borderColor: 'var(--workspace-sidebar-border)' }}>
                <div className="flex items-center gap-2">
                  <AIIcon className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)] flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Ask AI anything..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && aiPrompt.trim()) {
                        processWithAI("custom", aiPrompt);
                      }
                    }}
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
                  {!getSelectedText() ? (
                    <div className="px-4 py-3 text-sm text-[var(--workspace-sidebar-muted-foreground)] text-center">
                      Bitte markieren Sie zuerst Text, um AI-Funktionen zu nutzen.
                    </div>
                  ) : (
                    AI_OPTIONS.map((option) => (
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
                    ))
                  )}
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
          ) : (
            // Main formatting toolbar
            <TooltipProvider delayDuration={300}>
              <div className="flex items-center gap-0.5 px-2 py-1.5 rounded-lg shadow-lg border border-[var(--workspace-sidebar-border)]" style={{ backgroundColor: 'var(--workspace-sidebar)' }}>
                {/* AI Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        // Prevent default to keep text selection
                        e.preventDefault();
                        // Store current selection immediately on mousedown
                        if (editor) {
                          const { from, to } = editor.state.selection;
                          if (from !== to) {
                            setSelectedText(editor.state.doc.textBetween(from, to, " "));
                          }
                        }
                      }}
                      onClick={() => {
                        setShowAIMenu(true);
                      }}
                      className="p-1.5 hover:bg-[var(--workspace-sidebar-muted)] rounded transition-colors"
                    >
                      <AIIcon className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>AI Actions</TooltipContent>
                </Tooltip>

                {/* Generate Text Button */}
                <Popover open={showGeneratePopover} onOpenChange={setShowGeneratePopover}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="p-1.5 hover:bg-[var(--workspace-sidebar-muted)] rounded transition-colors"
                    >
                      <AITextIcon className="h-6 w-6 text-[var(--workspace-sidebar-muted-foreground)]" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-80 p-0" 
                    align="start" 
                    side="bottom"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onInteractOutside={(e) => e.preventDefault()}
                  >
                    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--workspace-sidebar)' }}>
                      {/* Header */}
                      <div className="p-3 border-b" style={{ borderColor: 'var(--workspace-sidebar-border)' }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AITextIcon className="h-6 w-6 text-[var(--accent-primary-light)]" />
                            <span className="text-sm font-medium text-[var(--workspace-sidebar-foreground)]">Generate Text</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setShowGeneratePopover(false);
                              setGeneratedText(null);
                              setGeneratePrompt("");
                            }}
                            className="p-1 hover:bg-[var(--workspace-sidebar-muted)] rounded transition-colors"
                          >
                            <X className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
                          </button>
                        </div>
                      </div>

                      {/* Input */}
                      <div className="p-3 border-b" style={{ borderColor: 'var(--workspace-sidebar-border)' }}>
                        <textarea
                          placeholder="Describe what you want to write..."
                          value={generatePrompt}
                          onChange={(e) => setGeneratePrompt(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey && generatePrompt.trim()) {
                              e.preventDefault();
                              generateTextWithAI();
                            }
                          }}
                          className="w-full text-sm bg-transparent outline-none text-[var(--workspace-sidebar-foreground)] placeholder:text-[var(--workspace-sidebar-muted-foreground)] resize-none min-h-[60px]"
                          disabled={isGenerating}
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            type="button"
                            onClick={generateTextWithAI}
                            disabled={isGenerating || !generatePrompt.trim()}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-primary-light)] text-white rounded-lg text-xs font-medium hover:bg-[var(--accent-primary)] transition-colors disabled:opacity-50"
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <AITextIcon className="h-3 w-3" />
                                Generate
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Result */}
                      {generatedText && (
                        <div className="p-3 border-b" style={{ borderColor: 'var(--workspace-sidebar-border)', backgroundColor: 'var(--workspace-sidebar-muted)' }}>
                          <p className="text-sm text-[var(--workspace-sidebar-foreground)] whitespace-pre-wrap mb-3 max-h-[200px] overflow-y-auto">{generatedText}</p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={insertGeneratedText}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-primary-light)] text-white rounded-lg text-xs font-medium hover:bg-[var(--accent-primary)] transition-colors"
                            >
                              <PenLine className="h-3 w-3" />
                              Insert
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setGeneratedText(null);
                                setGeneratePrompt("");
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors text-[var(--workspace-sidebar-foreground)]"
                              style={{ borderColor: 'var(--workspace-sidebar-border)' }}
                            >
                              <X className="h-3 w-3" />
                              Clear
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--workspace-sidebar-border)' }} />

              {/* Heading dropdown */}
              <Popover onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1 px-2 py-1 hover:bg-[var(--workspace-sidebar-muted)] rounded text-sm text-[var(--workspace-sidebar-foreground)]"
                  >
                    <Type className="h-4 w-4" />
                    <span>{getCurrentHeading()}</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-1" align="start">
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-100 ${
                      editor.isActive("heading", { level: 1 }) ? "bg-gray-100 font-medium" : ""
                    }`}
                  >
                    <Heading1 className="h-4 w-4 text-gray-500" />
                    Heading 1
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-100 ${
                      editor.isActive("heading", { level: 2 }) ? "bg-gray-100 font-medium" : ""
                    }`}
                  >
                    <Heading2 className="h-4 w-4 text-gray-500" />
                    Heading 2
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-100 ${
                      editor.isActive("heading", { level: 3 }) ? "bg-gray-100 font-medium" : ""
                    }`}
                  >
                    <Heading3 className="h-4 w-4 text-gray-500" />
                    Heading 3
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-100 ${
                      editor.isActive("heading", { level: 4 }) ? "bg-gray-100 font-medium" : ""
                    }`}
                  >
                    <Heading4 className="h-4 w-4 text-gray-500" />
                    Heading 4
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().setParagraph().run()}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-100 ${
                      editor.isActive("paragraph") && !editor.isActive("heading") ? "bg-gray-100 font-medium" : ""
                    }`}
                  >
                    <Pilcrow className="h-4 w-4 text-gray-500" />
                    Paragraph
                  </button>
                </PopoverContent>
              </Popover>

              <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--workspace-sidebar-border)' }} />

              {/* Formatting buttons */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-1.5 rounded transition-colors ${
                      editor.isActive("bold") ? "bg-[var(--workspace-sidebar-muted)]" : "hover:bg-[var(--workspace-sidebar-muted)]"
                    }`}
                  >
                    <Bold className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>Bold</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-1.5 rounded transition-colors ${
                      editor.isActive("italic") ? "bg-[var(--workspace-sidebar-muted)]" : "hover:bg-[var(--workspace-sidebar-muted)]"
                    }`}
                  >
                    <Italic className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>Italic</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`p-1.5 rounded transition-colors ${
                      editor.isActive("underline") ? "bg-[var(--workspace-sidebar-muted)]" : "hover:bg-[var(--workspace-sidebar-muted)]"
                    }`}
                  >
                    <UnderlineIcon className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>Underline</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={`p-1.5 rounded transition-colors ${
                      editor.isActive("strike") ? "bg-[var(--workspace-sidebar-muted)]" : "hover:bg-[var(--workspace-sidebar-muted)]"
                    }`}
                  >
                    <Strikethrough className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>Strikethrough</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={`p-1.5 rounded transition-colors ${
                      editor.isActive("code") ? "bg-[var(--workspace-sidebar-muted)]" : "hover:bg-[var(--workspace-sidebar-muted)]"
                    }`}
                  >
                    <Code className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>Code</TooltipContent>
              </Tooltip>

              <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--workspace-sidebar-border)' }} />

              {/* Alignment dropdown */}
              <Popover onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1 px-2 py-1 hover:bg-[var(--workspace-sidebar-muted)] rounded text-sm text-[var(--workspace-sidebar-foreground)]"
                  >
                    {getCurrentAlignment() === "left" && <AlignLeft className="h-4 w-4" />}
                    {getCurrentAlignment() === "center" && <AlignCenter className="h-4 w-4" />}
                    {getCurrentAlignment() === "right" && <AlignRight className="h-4 w-4" />}
                    <span className="capitalize">{getCurrentAlignment()}</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-32 p-1" align="start">
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign("left").run()}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-100 ${
                      editor.isActive({ textAlign: "left" }) ? "bg-gray-100 font-medium" : ""
                    }`}
                  >
                    <AlignLeft className="h-4 w-4 text-gray-500" />
                    Left
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign("center").run()}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-100 ${
                      editor.isActive({ textAlign: "center" }) ? "bg-gray-100 font-medium" : ""
                    }`}
                  >
                    <AlignCenter className="h-4 w-4 text-gray-500" />
                    Center
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign("right").run()}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-100 ${
                      editor.isActive({ textAlign: "right" }) ? "bg-gray-100 font-medium" : ""
                    }`}
                  >
                    <AlignRight className="h-4 w-4 text-gray-500" />
                    Right
                  </button>
                </PopoverContent>
              </Popover>

              <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--workspace-sidebar-border)' }} />

              {/* Highlight color picker */}
              <Popover onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={`p-1.5 rounded transition-colors ${
                      editor.isActive("highlight") ? "bg-[var(--workspace-sidebar-muted)]" : "hover:bg-[var(--workspace-sidebar-muted)]"
                    }`}
                  >
                    <Highlighter className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-gray-500 font-medium">Highlight Color</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().setHighlight({ color: '#fef08a' }).run()}
                        className="w-6 h-6 rounded-full bg-yellow-200 hover:ring-2 ring-yellow-400 transition-all"
                        title="Yellow"
                      />
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().setHighlight({ color: '#bbf7d0' }).run()}
                        className="w-6 h-6 rounded-full bg-green-200 hover:ring-2 ring-green-400 transition-all"
                        title="Green"
                      />
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().setHighlight({ color: '#bfdbfe' }).run()}
                        className="w-6 h-6 rounded-full bg-blue-200 hover:ring-2 ring-blue-400 transition-all"
                        title="Blue"
                      />
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().setHighlight({ color: '#fecaca' }).run()}
                        className="w-6 h-6 rounded-full bg-red-200 hover:ring-2 ring-red-400 transition-all"
                        title="Red"
                      />
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().setHighlight({ color: '#e9d5ff' }).run()}
                        className="w-6 h-6 rounded-full bg-purple-200 hover:ring-2 ring-purple-400 transition-all"
                        title="Purple"
                      />
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().setHighlight({ color: '#fed7aa' }).run()}
                        className="w-6 h-6 rounded-full bg-orange-200 hover:ring-2 ring-orange-400 transition-all"
                        title="Orange"
                      />
                    </div>
                    {editor.isActive("highlight") && (
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().unsetHighlight().run()}
                        className="text-xs text-gray-500 hover:text-gray-700 mt-1"
                      >
                        Remove highlight
                      </button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setShowLinkInput(true)}
                    className={`p-1.5 rounded transition-colors ${
                      editor.isActive("link") ? "bg-[var(--workspace-sidebar-muted)]" : "hover:bg-[var(--workspace-sidebar-muted)]"
                    }`}
                  >
                    <Link2 className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>Add Link</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`p-1.5 rounded transition-colors ${
                      editor.isActive("blockquote") ? "bg-[var(--workspace-sidebar-muted)]" : "hover:bg-[var(--workspace-sidebar-muted)]"
                    }`}
                  >
                    <Quote className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>Quote</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
          )}
        </div>
      )}

      {/* TOC Panel - Fixed Top Right of Page (Always Open) */}
      {headings.length > 0 && (
        <div className="fixed top-20 right-6 z-50 w-64 rounded-lg shadow-lg border border-[var(--workspace-sidebar-border)] overflow-hidden" style={{ backgroundColor: 'var(--workspace-sidebar)' }}>
          <div className="p-3 border-b" style={{ borderColor: 'var(--workspace-sidebar-border)' }}>
            <div className="flex items-center gap-2">
              <List className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
              <span className="text-sm font-medium text-[var(--workspace-sidebar-foreground)]">Table of Contents</span>
            </div>
          </div>
          <div className="p-2 max-h-[400px] overflow-y-auto overflow-x-hidden">
            {headings.map((heading, index) => (
              <button
                key={heading.id}
                type="button"
                onClick={() => scrollToHeading(index)}
                className="w-full text-left px-3 py-2 text-sm rounded hover:bg-[var(--workspace-sidebar-muted)] transition-colors text-[var(--workspace-sidebar-foreground)] overflow-hidden"
                style={{ paddingLeft: `${(heading.level - 1) * 12 + 12}px` }}
              >
                <span className="block truncate">{heading.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Editor Styles */}
      <style jsx global>{`
        .ProseMirror {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror h1 {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.2;
          margin-bottom: 0.5rem;
          color: #111827;
        }
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 1.3;
          margin-bottom: 0.5rem;
          color: #111827;
        }
        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.4;
          margin-bottom: 0.5rem;
          color: #111827;
        }
        .ProseMirror h4 {
          font-size: 1.1rem;
          font-weight: 600;
          line-height: 1.4;
          margin-bottom: 0.5rem;
          color: #111827;
        }
        .ProseMirror p {
          margin-bottom: 0.75rem;
          color: #374151;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 1rem;
          margin-left: 0;
          margin-bottom: 0.75rem;
          color: #6b7280;
          font-style: italic;
        }
        .ProseMirror code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: ui-monospace, monospace;
          font-size: 0.875em;
          color: #dc2626;
        }
        .ProseMirror strong {
          font-weight: 700;
        }
        .ProseMirror em {
          font-style: italic;
        }
        .ProseMirror u {
          text-decoration: underline;
        }
        .ProseMirror s {
          text-decoration: line-through;
        }
        .ProseMirror mark {
          background-color: #fef08a;
          padding: 0.125rem 0;
          border-radius: 0.125rem;
        }
        .ProseMirror a {
          color: #059669;
          text-decoration: underline;
          cursor: pointer;
        }
        .ProseMirror a:hover {
          color: #047857;
        }
      `}</style>
    </div>
  );
}
