"use client";

import { memo, useState, useRef } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { VideoNodeData } from "@/lib/canvas/types";
import { useCanvasStore } from "@/lib/canvas/store";
import { 
  Video, 
  Trash2, 
  Copy, 
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Clock,
  FileText
} from "lucide-react";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function VideoNode({ id, data, selected }: NodeProps<VideoNodeData>) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { deleteNode, duplicateNode } = useCanvasStore();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateNode(id);
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div
      className={`
        relative bg-white rounded-xl border shadow-sm overflow-hidden
        transition-all duration-200 cursor-pointer
        ${selected ? "ring-2 ring-emerald-500 border-emerald-500" : "border-gray-200 hover:border-gray-300"}
      `}
      style={{ width: 320, minHeight: 240 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white"
      />

      {/* Video Preview */}
      <div className="relative aspect-video bg-gray-900">
        {data.url ? (
          <>
            <video
              ref={videoRef}
              src={data.url}
              poster={data.thumbnail}
              className="w-full h-full object-cover"
              muted={isMuted}
              loop
              playsInline
            />

            {/* Play/Pause Overlay */}
            {isHovered && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5 text-gray-800" />
                  ) : (
                    <Play className="h-5 w-5 text-gray-800 ml-0.5" />
                  )}
                </button>
              </div>
            )}

            {/* Volume control */}
            {isHovered && (
              <button
                type="button"
                onClick={toggleMute}
                className="absolute bottom-2 right-2 p-1.5 bg-black/50 rounded text-white hover:bg-black/70"
              >
                {isMuted ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="h-10 w-10 text-gray-600" />
          </div>
        )}

        {/* Duration badge */}
        {data.duration > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-black/70 text-white text-[10px] rounded">
            <Clock className="h-2.5 w-2.5" />
            {formatDuration(data.duration)}
          </div>
        )}

        {/* Transcription badge */}
        {data.transcription && (
          <div className="absolute top-2 left-2">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-violet-500/90 text-white text-[10px] rounded-full">
              <FileText className="h-2.5 w-2.5" />
              <span>Transcribed</span>
            </div>
          </div>
        )}

        {/* AI Tags Badge */}
        {data.aiTags && data.aiTags.length > 0 && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/90 text-white text-[10px] rounded-full">
              <Sparkles className="h-2.5 w-2.5" />
              <span>AI Tagged</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center flex-shrink-0">
              <Video className="h-3.5 w-3.5 text-red-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 truncate">
              {data.label || "Video"}
            </span>
          </div>

          {/* Actions */}
          {isHovered && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDuplicate}
                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600"
                title="Duplicate"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="p-1.5 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-500"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Resolution info */}
        {data.width && data.height && (
          <p className="text-[10px] text-gray-400 mt-1">
            {data.width} × {data.height}
          </p>
        )}

        {/* Scenes preview */}
        {data.scenes && data.scenes.length > 0 && (
          <div className="flex gap-1 mt-2 overflow-hidden">
            {data.scenes.slice(0, 4).map((scene, index) => (
              <div
                key={index}
                className="w-10 h-6 rounded overflow-hidden bg-gray-200 flex-shrink-0"
              >
                {scene.thumbnail && (
                  <img
                    src={scene.thumbnail}
                    alt={`Scene at ${formatDuration(scene.timestamp)}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
            {data.scenes.length > 4 && (
              <div className="w-10 h-6 rounded bg-gray-100 flex items-center justify-center text-[10px] text-gray-500">
                +{data.scenes.length - 4}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(VideoNode);
