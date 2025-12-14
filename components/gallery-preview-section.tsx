"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function GalleryPreviewSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Card animation - slides up from bottom
  const cardY = useTransform(scrollYProgress, [0, 0.4], [200, 0]);
  const cardOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const cardScale = useTransform(scrollYProgress, [0, 0.4], [0.9, 1]);
  
  // Background cards animation
  const bgCardsOpacity = useTransform(scrollYProgress, [0.1, 0.35], [0, 0.3]);
  const bgCardsScale = useTransform(scrollYProgress, [0.1, 0.4], [0.95, 1]);

  // Individual content items stagger animation
  const headerY = useTransform(scrollYProgress, [0.2, 0.45], [40, 0]);
  const headerOpacity = useTransform(scrollYProgress, [0.2, 0.4], [0, 1]);
  
  const inputY = useTransform(scrollYProgress, [0.25, 0.5], [40, 0]);
  const inputOpacity = useTransform(scrollYProgress, [0.25, 0.45], [0, 1]);
  
  const gridY = useTransform(scrollYProgress, [0.3, 0.55], [60, 0]);
  const gridOpacity = useTransform(scrollYProgress, [0.3, 0.5], [0, 1]);

  return (
    <section 
      ref={containerRef}
      className="relative mt-32 mb-32 w-screen -mx-[calc((100vw-100%)/2)] min-h-screen overflow-hidden bg-[oklch(22%_0.11_240.79)]/80 ring-1 ring-white/10 flex items-center"
    >
      {/* Floating cards background */}
      <motion.div 
        className="pointer-events-none absolute inset-0"
        style={{ opacity: bgCardsOpacity, scale: bgCardsScale }}
      >
        <div className="absolute inset-10 grid grid-cols-3 gap-6 blur-sm">
          <motion.div 
            className="rounded-2xl bg-white/5 ring-1 ring-white/10"
            style={{ y: useTransform(scrollYProgress, [0.1, 0.4], [50, 0]) }}
          />
          <motion.div 
            className="rounded-2xl bg-white/5 ring-1 ring-white/10"
            style={{ y: useTransform(scrollYProgress, [0.12, 0.42], [60, 0]) }}
          />
          <motion.div 
            className="rounded-2xl bg-white/5 ring-1 ring-white/10"
            style={{ y: useTransform(scrollYProgress, [0.14, 0.44], [70, 0]) }}
          />
          <motion.div 
            className="rounded-2xl bg-white/5 ring-1 ring-white/10"
            style={{ y: useTransform(scrollYProgress, [0.16, 0.46], [80, 0]) }}
          />
          <motion.div 
            className="rounded-2xl bg-white/5 ring-1 ring-white/10"
            style={{ y: useTransform(scrollYProgress, [0.18, 0.48], [90, 0]) }}
          />
          <motion.div 
            className="rounded-2xl bg-white/5 ring-1 ring-white/10"
            style={{ y: useTransform(scrollYProgress, [0.2, 0.5], [100, 0]) }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/20" />
      </motion.div>

      {/* Foreground card */}
      <motion.div 
        className="relative mx-auto w-full max-w-7xl px-6 py-12 sm:px-12 sm:py-16"
        style={{ y: cardY, opacity: cardOpacity, scale: cardScale }}
      >
        <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_25px_90px_rgba(0,0,0,0.35)] ring-1 ring-black/10">
          <div className="bg-white">
            <div className="flex flex-col gap-6 px-6 py-8 sm:px-10 sm:py-10">
              {/* Header */}
              <motion.div 
                className="flex flex-col gap-2"
                style={{ y: headerY, opacity: headerOpacity }}
              >
                <p className="text-xs uppercase tracking-[0.25em] text-black/50">Home</p>
                <h3 className="text-2xl font-semibold text-black sm:text-3xl">
                  Welcome back, Matt
                </h3>
              </motion.div>

              {/* Input section */}
              <motion.div 
                className="rounded-xl border border-black/10 bg-white shadow-sm"
                style={{ y: inputY, opacity: inputOpacity }}
              >
                <div className="flex flex-wrap items-center gap-3 border-b border-black/5 px-4 py-3">
                  <button className="rounded-full bg-black text-white px-4 py-1 text-sm font-medium">Note</button>
                  <button className="rounded-full bg-black/5 px-4 py-1 text-sm font-medium text-black/70">Canvas</button>
                  <button className="rounded-full bg-black/5 px-4 py-1 text-sm font-medium text-black/70">Link</button>
                  <button className="rounded-full bg-black/5 px-4 py-1 text-sm font-medium text-black/70">Import</button>
                  <button className="rounded-full bg-black/5 px-4 py-1 text-sm font-medium text-black/70">Upload</button>
                </div>
                <div className="flex flex-wrap items-center gap-3 px-4 py-4">
                  <input
                    className="w-full flex-1 min-w-[220px] rounded-lg border border-black/10 bg-white px-4 py-3 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
                    placeholder="Paste a link..."
                  />
                  <button className="rounded-md bg-black px-4 py-3 text-sm font-medium text-white">
                    Capture
                  </button>
                </div>
              </motion.div>

              {/* Grid */}
              <motion.div 
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                style={{ y: gridY, opacity: gridOpacity }}
              >
                <motion.div 
                  className="h-32 rounded-2xl border border-black/5 bg-black/3 shadow-sm sm:h-28 lg:h-32"
                  style={{ y: useTransform(scrollYProgress, [0.32, 0.55], [30, 0]) }}
                />
                <motion.div 
                  className="h-32 rounded-2xl border border-black/5 bg-black/3 shadow-sm sm:h-28 lg:h-32"
                  style={{ y: useTransform(scrollYProgress, [0.34, 0.57], [40, 0]) }}
                />
                <motion.div 
                  className="h-32 rounded-2xl border border-black/5 bg-black/3 shadow-sm sm:h-28 lg:h-32"
                  style={{ y: useTransform(scrollYProgress, [0.36, 0.59], [50, 0]) }}
                />
                <motion.div 
                  className="h-48 rounded-2xl border border-black/5 bg-black/5 shadow-sm lg:col-span-2"
                  style={{ y: useTransform(scrollYProgress, [0.38, 0.61], [60, 0]) }}
                />
                <motion.div 
                  className="h-48 rounded-2xl border border-black/5 bg-black/5 shadow-sm"
                  style={{ y: useTransform(scrollYProgress, [0.4, 0.63], [70, 0]) }}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
