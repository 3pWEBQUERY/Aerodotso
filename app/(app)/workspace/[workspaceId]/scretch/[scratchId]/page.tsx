"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { 
  ArrowLeft, 
  Home, 
  Pencil, 
  Star, 
  Download,
  Undo2,
  Redo2,
  Eraser,
  Square,
  Circle,
  Minus,
  Type,
  Move,
  MousePointer2,
  Palette,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trash2,
  Pipette,
  PenTool,
  Brush,
  Crop,
  Lasso,
  Wand2,
  History,
  Sun,
  Image as ImageIcon,
  Layers,
  Copy,
  ChevronDown,
  Hand,
  Triangle,
  Hexagon,
  RectangleHorizontal,
  CircleDot,
  Blend,
  Droplet,
  Sparkles,
} from "lucide-react";
import { ItemHeaderActions } from "@/components/shared/item-header-actions";
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

interface Scratch {
  id: string;
  title: string;
  data: DrawingData;
  workspace_id: string;
  created_at: string;
  updated_at: string;
  is_starred?: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface DrawingElement {
  id: string;
  type: "pencil" | "line" | "rectangle" | "circle" | "eraser" | "text";
  points: Point[];
  color: string;
  strokeWidth: number;
  text?: string;
  filled?: boolean;
  cornerRadius?: number;
}

interface DrawingData {
  elements: DrawingElement[];
  appState: {
    backgroundColor?: string;
  };
}

type Tool = "select" | "pencil" | "line" | "rectangle" | "circle" | "eraser" | "text" | "pan" | "brush" | "eyedropper" | "crop" | "lasso" | "wand" | "pen" | "gradient" | "blur" | "dodge";

const COLORS = [
  "#000000", "#374151", "#6B7280", "#9CA3AF",
  "#EF4444", "#F97316", "#F59E0B", "#EAB308",
  "#22C55E", "#10B981", "#14B8A6", "#06B6D4",
  "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7",
  "#EC4899", "#F43F5E", "#FFFFFF", "#F3F4F6",
];

const STROKE_WIDTHS = [2, 4, 6, 8, 12, 16];
const BRUSH_SIZES = [1, 2, 4, 8, 16, 32, 64];

export default function ScratchPage() {
  const params = useParams<{ workspaceId: string; scratchId: string }>();
  const router = useRouter();
  const workspaceId = params?.workspaceId;
  const scratchId = params?.scratchId;
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [scratch, setScratch] = useState<Scratch | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isStarred, setIsStarred] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleValue, setEditingTitleValue] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  // Drawing state
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [currentTool, setCurrentTool] = useState<Tool>("pencil");
  const [currentColor, setCurrentColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [rectangleFilled, setRectangleFilled] = useState(false);
  const [circleFilled, setCircleFilled] = useState(false);
  const [rectangleCornerRadius, setRectangleCornerRadius] = useState(0);
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(null);
  const [history, setHistory] = useState<DrawingElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Advanced tool states
  const [foregroundColor, setForegroundColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [brushSize, setBrushSize] = useState(8);
  const [brushHardness, setBrushHardness] = useState(100);
  const [brushOpacity, setBrushOpacity] = useState(100);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  
  // Text input state
  const [textInput, setTextInput] = useState<{ visible: boolean; x: number; y: number; value: string; editingId?: string }>({
    visible: false,
    x: 0,
    y: 0,
    value: "",
    editingId: undefined,
  });
  
  // Selection state
  const [selectionBox, setSelectionBox] = useState<{ start: Point; end: Point } | null>(null);
  const [selectedElements, setSelectedElements] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0,
  });
  
  // Uploaded image state
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Fetch scratch
  const fetchScratch = useCallback(async () => {
    if (!scratchId) return;
    try {
      const response = await fetch(`/api/scratches/${scratchId}`);
      if (response.ok) {
        const { scratch } = await response.json();
        setScratch(scratch);
        setTitle(scratch.title || "");
        setIsStarred(scratch.is_starred || false);
        if (scratch.data?.elements) {
          setElements(scratch.data.elements);
          setHistory([scratch.data.elements]);
        }
        // Load uploaded image if available - use public image proxy API
        if (scratch.data?.uploadedImage?.storagePath) {
          const imageUrl = `/api/scratches/${scratchId}/image`;
          console.log("Loading image from proxy:", imageUrl);
          
          const img = new window.Image();
          img.onload = () => {
            console.log("Image loaded successfully:", img.width, "x", img.height);
            setUploadedImage(img);
            setUploadedImageUrl(imageUrl);
          };
          img.onerror = (e: Event | string) => {
            console.error("Failed to load image:", e);
          };
          img.src = imageUrl;
        }
      } else {
        router.push(`/workspace/${workspaceId}/scretch`);
      }
    } catch (error) {
      console.error("Failed to fetch scratch:", error);
    } finally {
      setLoading(false);
    }
  }, [scratchId, workspaceId, router]);

  useEffect(() => {
    fetchScratch();
  }, [fetchScratch]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set canvas size
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
    
    // Clear and set background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply transformations
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);
    
    // Draw uploaded image as background if available
    if (uploadedImage) {
      // Center the image on the canvas
      const imgX = (canvas.width / scale - uploadedImage.width) / 2 - offset.x / scale;
      const imgY = (canvas.height / scale - uploadedImage.height) / 2 - offset.y / scale;
      ctx.drawImage(uploadedImage, imgX, imgY);
    }
    
    // Draw all elements
    [...elements, currentElement].filter(Boolean).forEach((element) => {
      if (!element) return;
      
      const isSelected = selectedElements.has(element.id);
      
      ctx.strokeStyle = element.type === "eraser" ? "#FFFFFF" : element.color;
      ctx.lineWidth = element.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      // Draw selection highlight
      if (isSelected) {
        ctx.save();
        ctx.strokeStyle = "#8B5CF6";
        ctx.lineWidth = element.strokeWidth + 4;
        ctx.globalAlpha = 0.3;
      }
      
      switch (element.type) {
        case "pencil":
        case "eraser":
          if (element.points.length > 0) {
            ctx.beginPath();
            ctx.moveTo(element.points[0].x, element.points[0].y);
            element.points.forEach((point) => {
              ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
          }
          break;
          
        case "line":
          if (element.points.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(element.points[0].x, element.points[0].y);
            ctx.lineTo(element.points[1].x, element.points[1].y);
            ctx.stroke();
          }
          break;
          
        case "rectangle":
          if (element.points.length >= 2) {
            const [start, end] = element.points;
            const x = Math.min(start.x, end.x);
            const y = Math.min(start.y, end.y);
            const w = Math.abs(end.x - start.x);
            const h = Math.abs(end.y - start.y);
            const r = element.cornerRadius || 0;
            
            if (r > 0) {
              // Draw rounded rectangle
              ctx.beginPath();
              ctx.moveTo(x + r, y);
              ctx.lineTo(x + w - r, y);
              ctx.quadraticCurveTo(x + w, y, x + w, y + r);
              ctx.lineTo(x + w, y + h - r);
              ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
              ctx.lineTo(x + r, y + h);
              ctx.quadraticCurveTo(x, y + h, x, y + h - r);
              ctx.lineTo(x, y + r);
              ctx.quadraticCurveTo(x, y, x + r, y);
              ctx.closePath();
              
              if (element.filled) {
                ctx.fillStyle = element.color;
                ctx.fill();
              } else {
                ctx.stroke();
              }
            } else {
              // Draw regular rectangle
              if (element.filled) {
                ctx.fillStyle = element.color;
                ctx.fillRect(x, y, w, h);
              } else {
                ctx.strokeRect(x, y, w, h);
              }
            }
          }
          break;
          
        case "circle":
          if (element.points.length >= 2) {
            const [center, edge] = element.points;
            const radius = Math.sqrt(
              Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
            );
            ctx.beginPath();
            ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
            if (element.filled) {
              ctx.fillStyle = element.color;
              ctx.fill();
            } else {
              ctx.stroke();
            }
          }
          break;
          
        case "text":
          if (element.text && element.points.length > 0) {
            ctx.fillStyle = element.color;
            ctx.font = `${element.strokeWidth * 4}px sans-serif`;
            ctx.fillText(element.text, element.points[0].x, element.points[0].y);
          }
          break;
      }
      
      // Restore after selection highlight
      if (isSelected) {
        ctx.restore();
        // Draw element again normally on top
        ctx.strokeStyle = element.type === "eraser" ? "#FFFFFF" : element.color;
        ctx.lineWidth = element.strokeWidth;
        switch (element.type) {
          case "pencil":
          case "eraser":
            if (element.points.length > 0) {
              ctx.beginPath();
              ctx.moveTo(element.points[0].x, element.points[0].y);
              element.points.forEach((point) => {
                ctx.lineTo(point.x, point.y);
              });
              ctx.stroke();
            }
            break;
          case "line":
            if (element.points.length >= 2) {
              ctx.beginPath();
              ctx.moveTo(element.points[0].x, element.points[0].y);
              ctx.lineTo(element.points[1].x, element.points[1].y);
              ctx.stroke();
            }
            break;
          case "rectangle":
            if (element.points.length >= 2) {
              const [start, end] = element.points;
              ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
            }
            break;
          case "circle":
            if (element.points.length >= 2) {
              const [center, edge] = element.points;
              const radius = Math.sqrt(Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2));
              ctx.beginPath();
              ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
              ctx.stroke();
            }
            break;
          case "text":
            if (element.text && element.points.length > 0) {
              ctx.fillStyle = element.color;
              ctx.font = `${element.strokeWidth * 4}px sans-serif`;
              ctx.fillText(element.text, element.points[0].x, element.points[0].y);
            }
            break;
        }
      }
    });
    
    // Draw selection box
    if (selectionBox) {
      ctx.strokeStyle = "rgba(139, 92, 246, 0.8)";
      ctx.fillStyle = "rgba(139, 92, 246, 0.1)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      
      const x = Math.min(selectionBox.start.x, selectionBox.end.x);
      const y = Math.min(selectionBox.start.y, selectionBox.end.y);
      const w = Math.abs(selectionBox.end.x - selectionBox.start.x);
      const h = Math.abs(selectionBox.end.y - selectionBox.start.y);
      
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }
    
    ctx.restore();
  }, [elements, currentElement, scale, offset, selectedElements, selectionBox, uploadedImage]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };
    
    window.addEventListener("resize", handleResize);
    handleResize();
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Save function
  const saveScratch = useCallback(async (newElements: DrawingElement[]) => {
    if (!scratchId) return;
    setSaving(true);
    
    try {
      // Generate thumbnail
      const canvas = canvasRef.current;
      const thumbnail = canvas?.toDataURL("image/png", 0.5);
      
      await fetch(`/api/scratches/${scratchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          data: { elements: newElements, appState: {} },
          thumbnail,
        }),
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save scratch:", error);
    } finally {
      setSaving(false);
    }
  }, [scratchId]);

  // Debounced auto-save
  const saveWithDebounce = useCallback((newElements: DrawingElement[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveScratch(newElements), 1500);
  }, [saveScratch]);

  // Get canvas coordinates
  const getCanvasPoint = (e: React.MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offset.x) / scale,
      y: (e.clientY - rect.top - offset.y) / scale,
    };
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Ignore right-click (context menu)
    if (e.button === 2) return;
    
    // Close text input if clicking elsewhere
    if (textInput.visible) {
      submitTextInput();
      return;
    }
    
    // Close context menu on left click
    if (contextMenu.visible) {
      setContextMenu({ visible: false, x: 0, y: 0 });
    }
    
    if (currentTool === "pan") {
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      return;
    }
    
    const point = getCanvasPoint(e);
    
    // Eyedropper tool - pick color from canvas
    if (currentTool === "eyedropper") {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = `#${[pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, '0')).join('')}`;
      setForegroundColor(hex);
      setCurrentColor(hex);
      return;
    }
    
    // Blur tool - apply blur effect to canvas area
    if (currentTool === "blur") {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(e.clientX - rect.left);
      const y = Math.floor(e.clientY - rect.top);
      const radius = Math.floor(brushSize / 2);
      
      // Apply box blur to area around cursor
      const size = radius * 2;
      if (x - radius >= 0 && y - radius >= 0 && x + radius < canvas.width && y + radius < canvas.height) {
        const imageData = ctx.getImageData(x - radius, y - radius, size, size);
        const data = imageData.data;
        
        // Simple box blur
        const blurred = new Uint8ClampedArray(data.length);
        for (let i = 0; i < size; i++) {
          for (let j = 0; j < size; j++) {
            let r = 0, g = 0, b = 0, a = 0, count = 0;
            for (let di = -1; di <= 1; di++) {
              for (let dj = -1; dj <= 1; dj++) {
                const ni = i + di, nj = j + dj;
                if (ni >= 0 && ni < size && nj >= 0 && nj < size) {
                  const idx = (ni * size + nj) * 4;
                  r += data[idx]; g += data[idx + 1]; b += data[idx + 2]; a += data[idx + 3];
                  count++;
                }
              }
            }
            const idx = (i * size + j) * 4;
            blurred[idx] = r / count; blurred[idx + 1] = g / count; blurred[idx + 2] = b / count; blurred[idx + 3] = a / count;
          }
        }
        
        for (let i = 0; i < data.length; i++) data[i] = blurred[i];
        ctx.putImageData(imageData, x - radius, y - radius);
      }
      setIsDrawing(true);
      return;
    }
    
    // Dodge tool - lighten canvas area (like Photoshop dodge)
    if (currentTool === "dodge") {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(e.clientX - rect.left);
      const y = Math.floor(e.clientY - rect.top);
      const radius = Math.floor(brushSize / 2);
      
      // Lighten pixels in area
      const size = radius * 2;
      if (x - radius >= 0 && y - radius >= 0 && x + radius < canvas.width && y + radius < canvas.height) {
        const imageData = ctx.getImageData(x - radius, y - radius, size, size);
        const data = imageData.data;
        const strength = brushOpacity / 100 * 0.3; // Dodge strength based on opacity
        
        for (let i = 0; i < data.length; i += 4) {
          // Calculate distance from center for soft falloff
          const px = (i / 4) % size;
          const py = Math.floor((i / 4) / size);
          const dist = Math.sqrt(Math.pow(px - radius, 2) + Math.pow(py - radius, 2));
          const falloff = Math.max(0, 1 - dist / radius);
          
          // Lighten RGB values
          data[i] = Math.min(255, data[i] + (255 - data[i]) * strength * falloff);
          data[i + 1] = Math.min(255, data[i + 1] + (255 - data[i + 1]) * strength * falloff);
          data[i + 2] = Math.min(255, data[i + 2] + (255 - data[i + 2]) * strength * falloff);
        }
        
        ctx.putImageData(imageData, x - radius, y - radius);
      }
      setIsDrawing(true);
      return;
    }
    
    // Lasso and Wand tools work like selection
    if (currentTool === "lasso" || currentTool === "wand") {
      // For now, treat like select tool
      setSelectedElements(new Set());
      setSelectionBox({ start: point, end: point });
      setIsDrawing(true);
      return;
    }
    
    // Crop tool - for now just shows selection
    if (currentTool === "crop") {
      setSelectionBox({ start: point, end: point });
      setIsDrawing(true);
      return;
    }
    
    // Selection tool - check if clicking on an element or starting selection box
    if (currentTool === "select") {
      // Check if clicking on an already selected element to drag
      if (selectedElements.size > 0) {
        const clickedOnSelected = elements.some((el) => {
          if (!selectedElements.has(el.id)) return false;
          return el.points.some((p) => 
            Math.abs(p.x - point.x) < 20 && Math.abs(p.y - point.y) < 20
          );
        });
        if (clickedOnSelected) {
          setIsDragging(true);
          setDragStart(point);
          return;
        }
      }
      
      // Check if clicking on any element to select it
      const clickedElement = elements.find((el) => {
        if (el.type === "text" && el.points.length > 0) {
          // For text, check if click is near the text position
          const textPoint = el.points[0];
          return Math.abs(textPoint.x - point.x) < 50 && Math.abs(textPoint.y - point.y) < 20;
        }
        return el.points.some((p) => 
          Math.abs(p.x - point.x) < 15 && Math.abs(p.y - point.y) < 15
        );
      });
      
      if (clickedElement) {
        setSelectedElements(new Set([clickedElement.id]));
        setIsDragging(true);
        setDragStart(point);
        return;
      }
      
      // Start new selection box
      setSelectedElements(new Set());
      setSelectionBox({ start: point, end: point });
      setIsDrawing(true);
      return;
    }
    
    // Text tool - show text input at click position
    if (currentTool === "text") {
      e.preventDefault();
      e.stopPropagation();
      const canvas = canvasRef.current;
      if (!canvas) {
        console.error("Canvas ref not available");
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      console.log("Text tool clicked at:", x, y);
      setTextInput({
        visible: true,
        x: x,
        y: y,
        value: "",
      });
      setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
        }
      }, 50);
      return;
    }
    
    setIsDrawing(true);
    
    // Map new tools to existing element types
    let elementType: DrawingElement["type"] = "pencil";
    if (currentTool === "pencil" || currentTool === "brush" || currentTool === "pen" || currentTool === "gradient") {
      elementType = "pencil";
    } else if (currentTool === "eraser") {
      elementType = "eraser";
    } else if (currentTool === "line") {
      elementType = "line";
    } else if (currentTool === "rectangle") {
      elementType = "rectangle";
    } else if (currentTool === "circle") {
      elementType = "circle";
    }
    
    const newElement: DrawingElement = {
      id: Date.now().toString(),
      type: elementType,
      points: [point],
      color: foregroundColor,
      strokeWidth: brushSize,
      filled: currentTool === "rectangle" ? rectangleFilled : currentTool === "circle" ? circleFilled : undefined,
      cornerRadius: currentTool === "rectangle" ? rectangleCornerRadius : undefined,
    };
    
    setCurrentElement(newElement);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }
    
    // Dragging selected elements
    if (isDragging && dragStart && selectedElements.size > 0) {
      const point = getCanvasPoint(e);
      const dx = point.x - dragStart.x;
      const dy = point.y - dragStart.y;
      
      setElements((prev) =>
        prev.map((el) => {
          if (!selectedElements.has(el.id)) return el;
          return {
            ...el,
            points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
          };
        })
      );
      setDragStart(point);
      return;
    }
    
    // Selection box drawing for select, lasso, wand, crop tools
    if ((currentTool === "select" || currentTool === "lasso" || currentTool === "wand" || currentTool === "crop") && isDrawing && selectionBox) {
      const point = getCanvasPoint(e);
      setSelectionBox({ ...selectionBox, end: point });
      return;
    }
    
    // Blur tool - apply blur effect while dragging
    if (currentTool === "blur" && isDrawing) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(e.clientX - rect.left);
      const y = Math.floor(e.clientY - rect.top);
      const radius = Math.floor(brushSize / 2);
      
      const size = radius * 2;
      if (x - radius >= 0 && y - radius >= 0 && x + radius < canvas.width && y + radius < canvas.height) {
        const imageData = ctx.getImageData(x - radius, y - radius, size, size);
        const data = imageData.data;
        const blurred = new Uint8ClampedArray(data.length);
        
        for (let i = 0; i < size; i++) {
          for (let j = 0; j < size; j++) {
            let r = 0, g = 0, b = 0, a = 0, count = 0;
            for (let di = -1; di <= 1; di++) {
              for (let dj = -1; dj <= 1; dj++) {
                const ni = i + di, nj = j + dj;
                if (ni >= 0 && ni < size && nj >= 0 && nj < size) {
                  const idx = (ni * size + nj) * 4;
                  r += data[idx]; g += data[idx + 1]; b += data[idx + 2]; a += data[idx + 3];
                  count++;
                }
              }
            }
            const idx = (i * size + j) * 4;
            blurred[idx] = r / count; blurred[idx + 1] = g / count; blurred[idx + 2] = b / count; blurred[idx + 3] = a / count;
          }
        }
        
        for (let i = 0; i < data.length; i++) data[i] = blurred[i];
        ctx.putImageData(imageData, x - radius, y - radius);
      }
      return;
    }
    
    // Dodge tool - lighten while dragging
    if (currentTool === "dodge" && isDrawing) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(e.clientX - rect.left);
      const y = Math.floor(e.clientY - rect.top);
      const radius = Math.floor(brushSize / 2);
      
      const size = radius * 2;
      if (x - radius >= 0 && y - radius >= 0 && x + radius < canvas.width && y + radius < canvas.height) {
        const imageData = ctx.getImageData(x - radius, y - radius, size, size);
        const data = imageData.data;
        const strength = brushOpacity / 100 * 0.15;
        
        for (let i = 0; i < data.length; i += 4) {
          const px = (i / 4) % size;
          const py = Math.floor((i / 4) / size);
          const dist = Math.sqrt(Math.pow(px - radius, 2) + Math.pow(py - radius, 2));
          const falloff = Math.max(0, 1 - dist / radius);
          
          data[i] = Math.min(255, data[i] + (255 - data[i]) * strength * falloff);
          data[i + 1] = Math.min(255, data[i + 1] + (255 - data[i + 1]) * strength * falloff);
          data[i + 2] = Math.min(255, data[i + 2] + (255 - data[i + 2]) * strength * falloff);
        }
        
        ctx.putImageData(imageData, x - radius, y - radius);
      }
      return;
    }
    
    if (!isDrawing || !currentElement) return;
    
    const point = getCanvasPoint(e);
    
    // Freehand drawing tools (pencil, brush, pen, eraser, gradient)
    const freehandTools = ["pencil", "brush", "pen", "eraser", "gradient"];
    if (freehandTools.includes(currentTool) || currentElement.type === "pencil" || currentElement.type === "eraser") {
      setCurrentElement({
        ...currentElement,
        points: [...currentElement.points, point],
      });
    } else {
      setCurrentElement({
        ...currentElement,
        points: [currentElement.points[0], point],
      });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    
    // Finish dragging elements
    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
      addToHistory(elements);
      saveWithDebounce(elements);
      return;
    }
    
    // Finish selection box and select elements (for select, lasso, wand tools)
    if ((currentTool === "select" || currentTool === "lasso" || currentTool === "wand") && selectionBox) {
      const selected = new Set<string>();
      const minX = Math.min(selectionBox.start.x, selectionBox.end.x);
      const maxX = Math.max(selectionBox.start.x, selectionBox.end.x);
      const minY = Math.min(selectionBox.start.y, selectionBox.end.y);
      const maxY = Math.max(selectionBox.start.y, selectionBox.end.y);
      
      elements.forEach((element) => {
        // Check if any point of the element is within the selection box
        const isInBox = element.points.some(
          (p) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY
        );
        if (isInBox) {
          selected.add(element.id);
        }
      });
      
      setSelectedElements(selected);
      setSelectionBox(null);
      setIsDrawing(false);
      return;
    }
    
    // Finish crop selection
    if (currentTool === "crop" && selectionBox) {
      // For now, just clear the selection box (crop functionality would need more implementation)
      setSelectionBox(null);
      setIsDrawing(false);
      return;
    }
    
    if (isDrawing && currentElement) {
      const newElements = [...elements, currentElement];
      setElements(newElements);
      addToHistory(newElements);
      saveWithDebounce(newElements);
    }
    
    setIsDrawing(false);
    setCurrentElement(null);
  };
  
  // Submit text input
  const submitTextInput = () => {
    if (textInput.value.trim()) {
      // Check if editing existing text
      if (textInput.editingId) {
        const newElements = elements.map((el) => {
          if (el.id === textInput.editingId) {
            return { ...el, text: textInput.value, color: currentColor };
          }
          return el;
        });
        setElements(newElements);
        addToHistory(newElements);
        saveWithDebounce(newElements);
      } else {
        // Creating new text
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const point: Point = {
          x: (textInput.x - offset.x) / scale,
          y: (textInput.y - offset.y) / scale,
        };
        
        const newElement: DrawingElement = {
          id: Date.now().toString(),
          type: "text",
          points: [point],
          color: currentColor,
          strokeWidth,
          text: textInput.value,
        };
        
        const newElements = [...elements, newElement];
        setElements(newElements);
        addToHistory(newElements);
        saveWithDebounce(newElements);
      }
    } else if (textInput.editingId) {
      // If editing and text is empty, delete the element
      const newElements = elements.filter((el) => el.id !== textInput.editingId);
      setElements(newElements);
      addToHistory(newElements);
      saveWithDebounce(newElements);
    }
    
    setTextInput({ visible: false, x: 0, y: 0, value: "", editingId: undefined });
  };
  
  // Double-click to edit text
  const handleDoubleClick = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e);
    
    // Find text element at click position
    const textElement = elements.find((el) => {
      if (el.type !== "text" || !el.points.length) return false;
      const textPoint = el.points[0];
      // Check if click is near the text position
      return Math.abs(textPoint.x - point.x) < 100 && Math.abs(textPoint.y - point.y) < 30;
    });
    
    if (textElement) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      
      // Calculate screen position of the text
      const screenX = textElement.points[0].x * scale + offset.x;
      const screenY = textElement.points[0].y * scale + offset.y;
      
      setCurrentColor(textElement.color);
      setTextInput({
        visible: true,
        x: screenX,
        y: screenY - 56, // Adjust for header
        value: textElement.text || "",
        editingId: textElement.id,
      });
      
      setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
          textInputRef.current.select();
        }
      }, 50);
    }
  };
  
  // Delete selected elements
  const deleteSelectedElements = () => {
    if (selectedElements.size === 0) return;
    const newElements = elements.filter((el) => !selectedElements.has(el.id));
    setElements(newElements);
    addToHistory(newElements);
    saveWithDebounce(newElements);
    setSelectedElements(new Set());
    setContextMenu({ visible: false, x: 0, y: 0 });
  };
  
  // Duplicate selected elements
  const duplicateSelectedElements = () => {
    if (selectedElements.size === 0) return;
    
    const selectedEls = elements.filter((el) => selectedElements.has(el.id));
    const duplicatedEls = selectedEls.map((el) => ({
      ...el,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      points: el.points.map((p) => ({ x: p.x + 20, y: p.y + 20 })), // Offset by 20px
    }));
    
    const newElements = [...elements, ...duplicatedEls];
    setElements(newElements);
    addToHistory(newElements);
    saveWithDebounce(newElements);
    
    // Select the duplicated elements
    setSelectedElements(new Set(duplicatedEls.map((el) => el.id)));
    setContextMenu({ visible: false, x: 0, y: 0 });
  };
  
  // Context menu handler
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (selectedElements.size > 0) {
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
      });
    }
  };
  
  // Close context menu on click outside
  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  };
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (textInput.visible || isEditingTitle) return;
      
      // Delete selected elements
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedElements.size > 0) {
          e.preventDefault();
          deleteSelectedElements();
        }
      }
      
      // Escape - deselect and close panels
      if (e.key === "Escape") {
        setSelectedElements(new Set());
        setShowHistoryPanel(false);
      }
      
      // Photoshop-style keyboard shortcuts
      const key = e.key.toLowerCase();
      
      // Tool shortcuts
      if (key === "v") { e.preventDefault(); setCurrentTool("select"); }
      if (key === "l") { e.preventDefault(); setCurrentTool("lasso"); }
      if (key === "w") { e.preventDefault(); setCurrentTool("wand"); }
      if (key === "c" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setCurrentTool("crop"); }
      if (key === "b") { e.preventDefault(); setCurrentTool("brush"); }
      if (key === "n" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setCurrentTool("pencil"); }
      if (key === "e") { e.preventDefault(); setCurrentTool("eraser"); }
      if (key === "i") { e.preventDefault(); setCurrentTool("eyedropper"); }
      if (key === "p") { e.preventDefault(); setCurrentTool("pen"); }
      if (key === "t") { e.preventDefault(); setCurrentTool("text"); }
      if (key === "u") { e.preventDefault(); setCurrentTool("line"); }
      if (key === "g") { e.preventDefault(); setCurrentTool("gradient"); }
      if (key === "o") { e.preventDefault(); setCurrentTool("dodge"); }
      if (key === "h") { e.preventDefault(); setCurrentTool("pan"); }
      
      // Swap foreground/background colors
      if (key === "x") {
        e.preventDefault();
        const temp = foregroundColor;
        setForegroundColor(backgroundColor);
        setBackgroundColor(temp);
      }
      
      // Reset colors to default
      if (key === "d") {
        e.preventDefault();
        setForegroundColor("#000000");
        setBackgroundColor("#FFFFFF");
        setCurrentColor("#000000");
      }
      
      // Zoom shortcuts
      if (key === "z") { e.preventDefault(); setCurrentTool("pan"); }
      if (key === "+" || key === "=") { e.preventDefault(); zoomIn(); }
      if (key === "-") { e.preventDefault(); zoomOut(); }
      if (key === "0" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); resetView(); }
      
      // Undo/Redo
      if ((e.metaKey || e.ctrlKey) && key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      
      // Brush size shortcuts
      if (key === "[") { e.preventDefault(); setStrokeWidth(Math.max(1, strokeWidth - 2)); setBrushSize(Math.max(1, brushSize - 2)); }
      if (key === "]") { e.preventDefault(); setStrokeWidth(Math.min(64, strokeWidth + 2)); setBrushSize(Math.min(100, brushSize + 2)); }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElements, textInput.visible, isEditingTitle, foregroundColor, backgroundColor, strokeWidth, brushSize, historyIndex, history]);

  // History management
  const addToHistory = (newElements: DrawingElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
      saveWithDebounce(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
      saveWithDebounce(history[newIndex]);
    }
  };

  const clearCanvas = () => {
    setElements([]);
    addToHistory([]);
    saveWithDebounce([]);
  };

  // Zoom functions
  const zoomIn = () => setScale((s) => Math.min(s * 1.2, 5));
  const zoomOut = () => setScale((s) => Math.max(s / 1.2, 0.2));
  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // Toggle starred
  const toggleStarred = async () => {
    if (!scratchId) return;
    const newStarred = !isStarred;
    setIsStarred(newStarred);
    
    try {
      await fetch(`/api/scratches/${scratchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_starred: newStarred }),
      });
    } catch (error) {
      console.error("Failed to toggle star:", error);
      setIsStarred(!newStarred);
    }
  };

  // Delete scratch
  const deleteScratch = async () => {
    if (!scratchId) return;
    
    try {
      await fetch(`/api/scratches/${scratchId}`, { method: "DELETE" });
      router.push(`/workspace/${workspaceId}/scretch`);
    } catch (error) {
      console.error("Failed to delete scratch:", error);
    }
  };

  // Inline title editing
  const startEditingTitle = () => {
    setEditingTitleValue(title || "");
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const saveEditingTitle = async () => {
    if (!editingTitleValue.trim()) {
      setIsEditingTitle(false);
      return;
    }
    const newTitle = editingTitleValue.trim();
    setTitle(newTitle);
    setIsEditingTitle(false);
    try {
      await fetch(`/api/scratches/${scratchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save title:", error);
    }
  };

  const cancelEditingTitle = () => {
    setIsEditingTitle(false);
    setEditingTitleValue("");
  };

  // Move scratch to folder
  const handleMove = async (folderId: string | null) => {
    if (!scratchId) return;
    try {
      await fetch(`/api/scratches/${scratchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: folderId }),
      });
      setCurrentFolderId(folderId);
    } catch (error) {
      console.error("Failed to move scratch:", error);
      throw error;
    }
  };

  // Delete scratch handler
  const handleDelete = async () => {
    if (!scratchId) return;
    try {
      await fetch(`/api/scratches/${scratchId}`, { method: "DELETE" });
      router.push(`/workspace/${workspaceId}/scretch`);
    } catch (error) {
      console.error("Failed to delete scratch:", error);
      throw error;
    }
  };

  // Format last saved time
  const formatLastSaved = () => {
    if (!lastSaved) return "Edited now";
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
    if (diff < 5) return "Edited now";
    if (diff < 60) return `Edited ${diff}s ago`;
    return `Edited ${Math.floor(diff / 60)}m ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Photoshop-style tools organized in groups
  const toolGroups: { id: string; tools: { id: Tool; icon: any; label: string; shortcut?: string }[] }[] = [
    {
      id: "selection",
      tools: [
        { id: "select", icon: MousePointer2, label: "Move Tool", shortcut: "V" },
        { id: "lasso", icon: Lasso, label: "Lasso Tool", shortcut: "L" },
        { id: "wand", icon: Wand2, label: "Quick Selection", shortcut: "W" },
        { id: "crop", icon: Crop, label: "Crop Tool", shortcut: "C" },
      ],
    },
    {
      id: "drawing",
      tools: [
        { id: "brush", icon: Brush, label: "Brush Tool", shortcut: "B" },
        { id: "pencil", icon: Pencil, label: "Pencil Tool", shortcut: "N" },
        { id: "eraser", icon: Eraser, label: "Eraser Tool", shortcut: "E" },
        { id: "eyedropper", icon: Pipette, label: "Eyedropper", shortcut: "I" },
      ],
    },
    {
      id: "shapes",
      tools: [
        { id: "pen", icon: PenTool, label: "Pen Tool", shortcut: "P" },
        { id: "text", icon: Type, label: "Text Tool", shortcut: "T" },
        { id: "line", icon: Minus, label: "Line Tool", shortcut: "U" },
        { id: "rectangle", icon: Square, label: "Rectangle Tool" },
        { id: "circle", icon: Circle, label: "Ellipse Tool" },
      ],
    },
    {
      id: "effects",
      tools: [
        { id: "gradient", icon: Blend, label: "Gradient Tool", shortcut: "G" },
        { id: "blur", icon: Droplet, label: "Blur Tool" },
        { id: "dodge", icon: Sun, label: "Dodge/Burn", shortcut: "O" },
      ],
    },
    {
      id: "navigation",
      tools: [
        { id: "pan", icon: Hand, label: "Hand Tool", shortcut: "H" },
      ],
    },
  ];
  
  // Flat tools list for legacy compatibility
  const tools = toolGroups.flatMap(g => g.tools);
  
  // Swap foreground/background colors
  const swapColors = () => {
    const temp = foregroundColor;
    setForegroundColor(backgroundColor);
    setBackgroundColor(temp);
  };
  
  // Reset colors to default
  const resetColors = () => {
    setForegroundColor("#000000");
    setBackgroundColor("#FFFFFF");
  };
  
  // Handle eyedropper color pick
  const handleEyedropper = (e: React.MouseEvent) => {
    if (currentTool !== "eyedropper") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${[pixel[0], pixel[1], pixel[2]].map(x => x.toString(16).padStart(2, '0')).join('')}`;
    setForegroundColor(hex);
    setCurrentColor(hex);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push(`/workspace/${workspaceId}/scretch`)}
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
              <Pencil className="h-3.5 w-3.5" />
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editingTitleValue}
                  onChange={(e) => setEditingTitleValue(e.target.value)}
                  onBlur={saveEditingTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEditingTitle();
                    if (e.key === "Escape") cancelEditingTitle();
                  }}
                  className="font-medium bg-white border border-[var(--accent-primary)] rounded px-1 py-0.5 outline-none min-w-[100px]"
                />
              ) : (
                <span 
                  className="font-medium cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                  onClick={startEditingTitle}
                  title="Click to rename"
                >
                  {title || "Untitled Scratch"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {saving ? "Saving..." : formatLastSaved()}
          </span>
          <button
            type="button"
            onClick={toggleStarred}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Star className={`h-4 w-4 ${isStarred ? "text-amber-500 fill-amber-500" : "text-gray-400"}`} />
          </button>
          
          <ItemHeaderActions
            itemId={scratchId}
            itemType="scratch"
            itemTitle={title || "Untitled Scratch"}
            workspaceId={workspaceId}
            isStarred={isStarred}
            currentFolderId={currentFolderId}
            createdAt={scratch?.created_at}
            updatedAt={scratch?.updated_at}
            onToggleStar={toggleStarred}
            onStartRename={startEditingTitle}
            onMove={handleMove}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* Canvas Container with Photoshop-style Horizontal Toolbar */}
      <div className="relative flex-1 overflow-hidden">
        {/* HORIZONTAL PHOTOSHOP-STYLE TOOLBAR - Top Center */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-0.5 px-2 py-1.5 rounded-2xl shadow-xl border border-[var(--workspace-sidebar-border)] backdrop-blur-sm" style={{ backgroundColor: 'rgba(24, 24, 27, 0.95)' }}>
            {/* Tool Groups */}
            {toolGroups.map((group, groupIndex) => (
              <div key={group.id} className="flex items-center">
                {groupIndex > 0 && (
                  <div className="w-px h-7 mx-1.5" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                )}
                {group.tools.map((tool) => {
                  const isActive = currentTool === tool.id;
                  
                  // Special handling for shape tools with dropdown
                  if (tool.id === "rectangle" || tool.id === "circle") {
                    return (
                      <Popover key={tool.id}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setCurrentTool(tool.id)}
                            className={`relative p-2 rounded-lg transition-all duration-150 group ${
                              isActive
                                ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25"
                                : "text-zinc-400 hover:text-white hover:bg-zinc-700/50"
                            }`}
                          >
                            <tool.icon className="h-4 w-4" />
                            <ChevronDown className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 opacity-60" />
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-zinc-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-zinc-700 z-50">
                              {tool.label} {tool.shortcut && <span className="ml-1 text-zinc-400">{tool.shortcut}</span>}
                            </div>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-zinc-900 border-zinc-700" side="bottom" align="center">
                          <div className="space-y-2">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => { 
                                  tool.id === "rectangle" ? setRectangleFilled(false) : setCircleFilled(false);
                                  setCurrentTool(tool.id);
                                }}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded-md ${
                                  (tool.id === "rectangle" ? !rectangleFilled : !circleFilled) 
                                    ? "bg-violet-600 text-white" 
                                    : "text-zinc-300 hover:bg-zinc-800"
                                }`}
                              >
                                <tool.icon className="h-3.5 w-3.5" />
                                Outline
                              </button>
                              <button
                                type="button"
                                onClick={() => { 
                                  tool.id === "rectangle" ? setRectangleFilled(true) : setCircleFilled(true);
                                  setCurrentTool(tool.id);
                                }}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded-md ${
                                  (tool.id === "rectangle" ? rectangleFilled : circleFilled) 
                                    ? "bg-violet-600 text-white" 
                                    : "text-zinc-300 hover:bg-zinc-800"
                                }`}
                              >
                                <div className={`w-3.5 h-3.5 bg-current ${tool.id === "rectangle" ? "rounded-sm" : "rounded-full"}`} />
                                Filled
                              </button>
                            </div>
                            {tool.id === "rectangle" && (
                              <div className="pt-2 border-t border-zinc-700">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-zinc-400">Radius</span>
                                  <span className="text-xs text-white font-medium">{rectangleCornerRadius}px</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="50"
                                  value={rectangleCornerRadius}
                                  onChange={(e) => setRectangleCornerRadius(Number(e.target.value))}
                                  className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                                />
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    );
                  }
                  
                  // Brush tool with settings dropdown
                  if (tool.id === "brush" || tool.id === "pencil") {
                    return (
                      <Popover key={tool.id}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setCurrentTool(tool.id)}
                            className={`relative p-2 rounded-lg transition-all duration-150 group ${
                              isActive
                                ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25"
                                : "text-zinc-400 hover:text-white hover:bg-zinc-700/50"
                            }`}
                          >
                            <tool.icon className="h-4 w-4" />
                            <ChevronDown className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 opacity-60" />
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-zinc-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-zinc-700 z-50">
                              {tool.label} {tool.shortcut && <span className="ml-1 text-zinc-400">{tool.shortcut}</span>}
                            </div>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-3 bg-zinc-900 border-zinc-700" side="bottom" align="center">
                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-zinc-400">Size</span>
                                <span className="text-xs text-white font-medium">{brushSize}px</span>
                              </div>
                              <input
                                type="range"
                                min="1"
                                max="100"
                                value={brushSize}
                                onChange={(e) => { setBrushSize(Number(e.target.value)); setStrokeWidth(Number(e.target.value)); }}
                                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                              />
                              <div className="flex gap-1 mt-2">
                                {BRUSH_SIZES.map((size) => (
                                  <button
                                    key={size}
                                    type="button"
                                    onClick={() => { setBrushSize(size); setStrokeWidth(size); }}
                                    className={`flex-1 px-1 py-1 text-xs rounded ${brushSize === size ? "bg-violet-600 text-white" : "text-zinc-400 hover:bg-zinc-800"}`}
                                  >
                                    {size}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-zinc-400">Hardness</span>
                                <span className="text-xs text-white font-medium">{brushHardness}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={brushHardness}
                                onChange={(e) => setBrushHardness(Number(e.target.value))}
                                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-zinc-400">Opacity</span>
                                <span className="text-xs text-white font-medium">{brushOpacity}%</span>
                              </div>
                              <input
                                type="range"
                                min="1"
                                max="100"
                                value={brushOpacity}
                                onChange={(e) => setBrushOpacity(Number(e.target.value))}
                                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                              />
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    );
                  }
                  
                  // Default tool button
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => setCurrentTool(tool.id)}
                      className={`relative p-2 rounded-lg transition-all duration-150 group ${
                        isActive
                          ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-700/50"
                      }`}
                    >
                      <tool.icon className="h-4 w-4" />
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-zinc-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-zinc-700 z-50">
                        {tool.label} {tool.shortcut && <span className="ml-1 text-zinc-400">{tool.shortcut}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
            
            {/* Separator */}
            <div className="w-px h-7 mx-2" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
            
            {/* Undo/Redo */}
            <button
              type="button"
              onClick={undo}
              disabled={historyIndex <= 0}
              className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700/50 disabled:opacity-30 disabled:cursor-not-allowed group"
            >
              <Undo2 className="h-4 w-4" />
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-zinc-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-zinc-700 z-50">
                Undo <span className="text-zinc-400">⌘Z</span>
              </div>
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700/50 disabled:opacity-30 disabled:cursor-not-allowed group"
            >
              <Redo2 className="h-4 w-4" />
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-zinc-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-zinc-700 z-50">
                Redo <span className="text-zinc-400">⌘⇧Z</span>
              </div>
            </button>
            
            {/* History Panel Toggle */}
            <button
              type="button"
              onClick={() => setShowHistoryPanel(!showHistoryPanel)}
              className={`relative p-2 rounded-lg transition-all duration-150 group ${
                showHistoryPanel
                  ? "bg-violet-600 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-700/50"
              }`}
            >
              <History className="h-4 w-4" />
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-zinc-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-zinc-700 z-50">
                History Panel
              </div>
            </button>
            
            {/* Separator */}
            <div className="w-px h-7 mx-2" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
            
            {/* Clear Canvas */}
            <button
              type="button"
              onClick={clearCanvas}
              className="relative p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 group"
            >
              <Trash2 className="h-4 w-4" />
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-zinc-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-zinc-700 z-50">
                Clear Canvas
              </div>
            </button>
          </div>
        </div>

        {/* PHOTOSHOP-STYLE COLOR & SETTINGS BAR - Bottom */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-xl border border-zinc-700/50 backdrop-blur-sm" style={{ backgroundColor: 'rgba(24, 24, 27, 0.95)' }}>
            {/* Foreground/Background Colors (Photoshop-style stacked) */}
            <div className="relative w-10 h-10 group">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="absolute top-0 left-0 w-6 h-6 rounded-sm border-2 border-zinc-600 shadow-md z-10 hover:scale-105 transition-transform"
                    style={{ backgroundColor: foregroundColor }}
                    title="Foreground Color"
                  />
                </PopoverTrigger>
                <PopoverContent className="w-52 p-3 bg-zinc-900 border-zinc-700" align="center" side="top">
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-400 font-medium">Foreground Color</p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => { setForegroundColor(color); setCurrentColor(color); }}
                          className={`w-7 h-7 rounded-md border-2 transition-all hover:scale-110 ${
                            foregroundColor === color ? "border-violet-500 ring-2 ring-violet-500/30" : "border-zinc-600"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 w-6 h-6 rounded-sm border-2 border-zinc-600 shadow-md hover:scale-105 transition-transform"
                    style={{ backgroundColor: backgroundColor }}
                    title="Background Color"
                  />
                </PopoverTrigger>
                <PopoverContent className="w-52 p-3 bg-zinc-900 border-zinc-700" align="center" side="top">
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-400 font-medium">Background Color</p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setBackgroundColor(color)}
                          className={`w-7 h-7 rounded-md border-2 transition-all hover:scale-110 ${
                            backgroundColor === color ? "border-violet-500 ring-2 ring-violet-500/30" : "border-zinc-600"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {/* Swap and Reset buttons */}
              <button
                type="button"
                onClick={swapColors}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white text-[8px] border border-zinc-600 hover:bg-zinc-700"
                title="Swap Colors (X)"
              >
                ⇄
              </button>
              <button
                type="button"
                onClick={resetColors}
                className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-700 border border-zinc-600"
                title="Reset to Default (D)"
              >
                <div className="w-2 h-2 border border-zinc-400">
                  <div className="w-1 h-1 bg-zinc-400" />
                </div>
              </button>
            </div>
            
            {/* Separator */}
            <div className="w-px h-8 bg-zinc-700" />
            
            {/* Stroke Width Slider */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 w-8">Size</span>
              <input
                type="range"
                min="1"
                max="64"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-24 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
              <span className="text-xs text-white font-mono w-8">{strokeWidth}px</span>
            </div>
            
            {/* Separator */}
            <div className="w-px h-8 bg-zinc-700" />
            
            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={zoomOut}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700/50"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={resetView}
                className="px-2 py-1 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700/50 rounded font-mono min-w-[48px] text-center"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                type="button"
                onClick={zoomIn}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700/50"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* History Panel (Photoshop-style) */}
        {showHistoryPanel && (
          <div className="absolute top-16 right-4 z-20 w-56 rounded-xl shadow-xl border border-zinc-700/50 overflow-hidden" style={{ backgroundColor: 'rgba(24, 24, 27, 0.98)' }}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700/50">
              <span className="text-xs font-medium text-white">History</span>
              <button
                type="button"
                onClick={() => setShowHistoryPanel(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto p-1">
              {history.map((state, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setHistoryIndex(index);
                    setElements(history[index]);
                    saveWithDebounce(history[index]);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors ${
                    index === historyIndex
                      ? "bg-violet-600 text-white"
                      : index < historyIndex
                      ? "text-zinc-300 hover:bg-zinc-800"
                      : "text-zinc-500 hover:bg-zinc-800"
                  }`}
                >
                  {index === 0 ? "Initial State" : `Step ${index}`}
                  <span className="ml-2 text-zinc-500">({state.length} elements)</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div 
          ref={containerRef}
          className="absolute inset-0 overflow-visible"
          style={{ 
            cursor: currentTool === "pan" ? (isPanning ? "grabbing" : "grab") : 
                   currentTool === "select" || currentTool === "lasso" || currentTool === "wand" || currentTool === "crop" ? "crosshair" : 
                   currentTool === "text" ? "text" :
                   currentTool === "eyedropper" ? "crosshair" :
                   currentTool === "brush" || currentTool === "pencil" || currentTool === "pen" ? "crosshair" :
                   currentTool === "eraser" ? "crosshair" : "crosshair" 
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            onClick={(e) => {
              if (contextMenu.visible) {
                closeContextMenu();
              }
            }}
            className="w-full h-full"
          />
          
          {/* Selection Info */}
          {selectedElements.size > 0 && !contextMenu.visible && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-violet-600 text-white text-sm rounded-lg shadow-lg">
              {selectedElements.size} element{selectedElements.size > 1 ? "s" : ""} selected — Right-click for options
            </div>
          )}
        </div>
        
        {/* Text Input Field - Outside canvas container for proper z-index */}
        {textInput.visible && (
          <div 
            className="absolute z-[100] flex flex-col gap-2"
            style={{
              left: textInput.x,
              top: textInput.y + 56,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={textInputRef}
              type="text"
              value={textInput.value}
              onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitTextInput();
                }
                if (e.key === "Escape") {
                  setTextInput({ visible: false, x: 0, y: 0, value: "", editingId: undefined });
                }
              }}
              className="bg-white border-2 border-violet-500 rounded px-2 py-1 outline-none text-base min-w-[200px] shadow-lg"
              style={{
                color: currentColor,
                fontSize: `${Math.max(strokeWidth * 4, 16)}px`,
              }}
              placeholder="Type here..."
              autoFocus
            />
            {/* Color picker for text */}
            <div className="flex items-center gap-1 p-1 bg-white rounded-lg shadow-lg border border-gray-200">
              {COLORS.slice(0, 10).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCurrentColor(color)}
                  className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                    currentColor === color ? "border-violet-500 scale-110" : "border-gray-300"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <button
                type="button"
                onClick={submitTextInput}
                className="ml-2 px-2 py-1 bg-violet-500 text-white text-xs rounded hover:bg-violet-600"
              >
                ✓
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed z-50 rounded-xl shadow-xl border border-[var(--workspace-sidebar-border)] py-1 min-w-[160px] overflow-hidden"
          style={{
            backgroundColor: 'var(--workspace-sidebar)',
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={duplicateSelectedElements}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Duplicate
          </button>
          <div className="h-px bg-[var(--workspace-sidebar-border)] mx-2" />
          <button
            type="button"
            onClick={deleteSelectedElements}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/30 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}

    </div>
  );
}
