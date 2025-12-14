"use client";

import { useEffect, useCallback, RefObject } from 'react';
import { useReactFlow } from 'reactflow';
import { useCanvasStore } from '@/lib/canvas/store';
import { detectPlatform, isSocialMediaUrl, isValidUrl } from '@/lib/social/platform-detector';
import { CanvasNode, SocialPostNodeData } from '@/lib/canvas/types';

interface UseSocialUrlPasteOptions {
  enabled?: boolean;
  onPaste?: (url: string) => void;
}

export function useSocialUrlPaste(
  containerRef: RefObject<HTMLDivElement | null>,
  options: UseSocialUrlPasteOptions = {}
) {
  const { enabled = true, onPaste } = options;
  const { screenToFlowPosition, getViewport } = useReactFlow();
  const { addNode } = useCanvasStore();

  const createSocialPostNode = useCallback((
    url: string,
    position: { x: number; y: number }
  ) => {
    const detected = detectPlatform(url);
    
    const nodeData: SocialPostNodeData = {
      type: 'social-post',
      label: detected ? `${detected.platform} Post` : 'Social Post',
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: '',
      url,
      platform: detected?.platform,
      postId: detected?.postId,
      status: 'idle',
      displayMode: 'full',
      theme: 'dark',
      showMetrics: true,
    };

    const newNode: CanvasNode = {
      id: `social-post-${Date.now()}`,
      type: 'social-post',
      position,
      data: nodeData,
    };

    addNode(newNode);
    onPaste?.(url);
  }, [addNode, onPaste]);

  const getDropPosition = useCallback((clientX: number, clientY: number) => {
    return screenToFlowPosition({
      x: clientX,
      y: clientY,
    });
  }, [screenToFlowPosition]);

  const getViewportCenter = useCallback(() => {
    const viewport = getViewport();
    const container = containerRef.current;
    
    if (!container) {
      return { x: -viewport.x / viewport.zoom + 200, y: -viewport.y / viewport.zoom + 200 };
    }

    const rect = container.getBoundingClientRect();
    return screenToFlowPosition({
      x: rect.width / 2,
      y: rect.height / 2,
    });
  }, [getViewport, screenToFlowPosition, containerRef]);

  // Paste handler
  useEffect(() => {
    if (!enabled) return;

    const handlePaste = async (event: ClipboardEvent) => {
      // Don't handle paste if user is typing in an input
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const text = event.clipboardData?.getData('text/plain')?.trim();
      if (!text) return;

      // Check if it's a valid URL
      if (!isValidUrl(text)) return;

      // Check if it's a social media URL
      if (!isSocialMediaUrl(text)) return;

      // Prevent default paste behavior
      event.preventDefault();

      // Get position (center of viewport)
      const position = getViewportCenter();

      // Create the social post node
      createSocialPostNode(text, position);
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [enabled, createSocialPostNode, getViewportCenter]);

  // Drag and drop handler
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      
      // Get URL from drag data
      const url = event.dataTransfer?.getData('text/uri-list') 
        || event.dataTransfer?.getData('text/plain');

      if (!url || !isValidUrl(url)) return;

      // Check if it's a social media URL
      if (!isSocialMediaUrl(url)) return;

      // Get drop position
      const position = getDropPosition(event.clientX, event.clientY);

      // Create the social post node
      createSocialPostNode(url, position);
    };

    const handleDragOver = (event: DragEvent) => {
      // Check if dragging a URL
      const types = event.dataTransfer?.types || [];
      if (types.includes('text/uri-list') || types.includes('text/plain')) {
        event.preventDefault();
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = 'copy';
        }
      }
    };

    container.addEventListener('drop', handleDrop);
    container.addEventListener('dragover', handleDragOver);

    return () => {
      container.removeEventListener('drop', handleDrop);
      container.removeEventListener('dragover', handleDragOver);
    };
  }, [enabled, containerRef, createSocialPostNode, getDropPosition]);

  return {
    createSocialPostNode,
  };
}

export default useSocialUrlPaste;
