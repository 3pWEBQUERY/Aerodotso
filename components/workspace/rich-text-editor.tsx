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
  Sparkles,
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
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface RichTextEditorProps {
  content: string;
  onUpdate: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const AI_OPTIONS = [
  { id: "improve", label: "Improve Writing", icon: Wand2 },
  { id: "fix", label: "Fix Spelling", icon: Check },
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
          class: "text-emerald-600 underline cursor-pointer",
        },
      }),
      Highlight.configure({
        HTMLAttributes: {
          class: "bg-yellow-200",
        },
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
      
      if (hasSelection) {
        // Get selection coordinates
        const { view } = editor;
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);
        
        // Position toolbar above the selection
        const containerRect = editorContainerRef.current?.getBoundingClientRect();
        if (containerRect) {
          setToolbarPosition({
            top: start.top - containerRect.top - 50,
            left: Math.min(start.left, end.left) - containerRect.left,
          });
        }
        setShowToolbar(true);
      } else {
        // Delay hiding to allow clicking toolbar buttons
        setTimeout(() => {
          // Check if any popover is open
          const openPopover = document.querySelector('[data-state="open"][data-radix-popper-content-wrapper]');
          if (!toolbarRef.current?.contains(document.activeElement) && !openPopover) {
            setShowToolbar(false);
            setShowAIMenu(false);
            setShowLinkInput(false);
            setAiResult(null);
          }
        }, 200);
      }
    },
  });

  // Sync content when it changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Get selected text
  const getSelectedText = useCallback(() => {
    if (!editor) return "";
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, " ");
  }, [editor]);

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
          ) : showAIMenu ? (
            // AI Menu
            <div className="w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              {/* AI Input */}
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gray-400 flex-shrink-0" />
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
                    className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400"
                    disabled={isProcessing}
                    autoFocus
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
          ) : (
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

              <div className="w-px h-5 bg-gray-200 mx-1" />

              {/* Formatting buttons */}
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-1.5 rounded transition-colors ${
                  editor.isActive("bold") ? "bg-gray-200" : "hover:bg-gray-100"
                }`}
                title="Bold"
              >
                <Bold className="h-4 w-4 text-gray-600" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-1.5 rounded transition-colors ${
                  editor.isActive("italic") ? "bg-gray-200" : "hover:bg-gray-100"
                }`}
                title="Italic"
              >
                <Italic className="h-4 w-4 text-gray-600" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`p-1.5 rounded transition-colors ${
                  editor.isActive("underline") ? "bg-gray-200" : "hover:bg-gray-100"
                }`}
                title="Underline"
              >
                <UnderlineIcon className="h-4 w-4 text-gray-600" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`p-1.5 rounded transition-colors ${
                  editor.isActive("strike") ? "bg-gray-200" : "hover:bg-gray-100"
                }`}
                title="Strikethrough"
              >
                <Strikethrough className="h-4 w-4 text-gray-600" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={`p-1.5 rounded transition-colors ${
                  editor.isActive("code") ? "bg-gray-200" : "hover:bg-gray-100"
                }`}
                title="Code"
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

              <div className="w-px h-5 bg-gray-200 mx-1" />

              {/* More formatting */}
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                className={`p-1.5 rounded transition-colors ${
                  editor.isActive("highlight") ? "bg-gray-200" : "hover:bg-gray-100"
                }`}
                title="Highlight"
              >
                <Highlighter className="h-4 w-4 text-gray-600" />
              </button>
              <button
                type="button"
                onClick={() => setShowLinkInput(true)}
                className={`p-1.5 rounded transition-colors ${
                  editor.isActive("link") ? "bg-gray-200" : "hover:bg-gray-100"
                }`}
                title="Add Link"
              >
                <Link2 className="h-4 w-4 text-gray-600" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`p-1.5 rounded transition-colors ${
                  editor.isActive("blockquote") ? "bg-gray-200" : "hover:bg-gray-100"
                }`}
                title="Quote"
              >
                <Quote className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          )}
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
