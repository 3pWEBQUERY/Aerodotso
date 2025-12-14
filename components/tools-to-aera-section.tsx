"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { MousePointer2 } from "lucide-react";

export function ToolsToAeraSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Transform values based on scroll progress
  const iconsOpacity = useTransform(scrollYProgress, [0.3, 0.5], [1, 0]);
  const iconsScale = useTransform(scrollYProgress, [0.3, 0.5], [1, 0.8]);
  
  const oldTextOpacity = useTransform(scrollYProgress, [0.3, 0.45], [1, 0]);
  const oldTextY = useTransform(scrollYProgress, [0.3, 0.45], [0, -30]);
  
  const newTextOpacity = useTransform(scrollYProgress, [0.45, 0.6], [0, 1]);
  const newTextY = useTransform(scrollYProgress, [0.45, 0.6], [30, 0]);
  const newTextScale = useTransform(scrollYProgress, [0.45, 0.6], [0.95, 1]);
  
  const logoScale = useTransform(scrollYProgress, [0.45, 0.6], [0.5, 1]);
  const logoRotate = useTransform(scrollYProgress, [0.45, 0.6], [-180, 0]);

  return (
    <section 
      ref={containerRef}
      className="relative mt-32 py-32 text-center min-h-[80vh] flex items-center justify-center"
    >
      {/* Floating Icons Background Layer - fades out on scroll */}
      <motion.div 
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ opacity: iconsOpacity, scale: iconsScale }}
      >
        {/* Left Side Icons */}
        <motion.div 
          className="absolute left-[25%] top-[25%] size-14 rotate-[-12deg] rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/5 md:left-[30%]"
          style={{ 
            x: useTransform(scrollYProgress, [0.3, 0.5], [0, -300]),
            y: useTransform(scrollYProgress, [0.3, 0.5], [0, -20]),
          }}
        >
          <div className="grid h-full place-items-center">
            <Image src="/symbol-black.svg" alt="Miza" width={24} height={24} />
          </div>
        </motion.div>
        
        <motion.div 
          className="absolute left-[20%] top-[50%] size-16 rotate-[6deg] rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/5 md:left-[25%]"
          style={{ 
            x: useTransform(scrollYProgress, [0.3, 0.5], [0, -350]),
            y: useTransform(scrollYProgress, [0.3, 0.5], [0, 10]),
          }}
        >
          <div className="grid h-full place-items-center">
            <Image src="/openai.png" alt="OpenAI" width={32} height={32} />
          </div>
        </motion.div>
        
        <motion.div 
          className="absolute left-[28%] bottom-[25%] size-12 rotate-[-6deg] rounded-xl bg-[#F7D24D] p-2.5 shadow-xl ring-1 ring-black/5 md:left-[32%]"
          style={{ 
            x: useTransform(scrollYProgress, [0.3, 0.5], [0, -280]),
            y: useTransform(scrollYProgress, [0.3, 0.5], [0, 30]),
          }}
        >
          <div className="grid h-full place-items-center text-black">
            <MousePointer2 className="size-6" />
          </div>
        </motion.div>
        
        {/* Drive-ish */}
        <motion.div 
          className="absolute left-[18%] top-[38%] size-12 rotate-[15deg] rounded-xl bg-white p-2.5 shadow-xl ring-1 ring-black/5 md:left-[22%]"
          style={{ 
            x: useTransform(scrollYProgress, [0.3, 0.5], [0, -320]),
            y: useTransform(scrollYProgress, [0.3, 0.5], [0, -10]),
          }}
        >
          <div className="grid h-full place-items-center">
            <div className="size-6 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-[#FDBE02]" />
              <div className="absolute bottom-0 left-0 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-[#EA4335] rotate-[-60deg] origin-top-left" />
              <div className="absolute bottom-0 right-0 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-[#34A853] rotate-[60deg] origin-top-right" />
            </div>
          </div>
        </motion.div>

        {/* Right Side Icons */}
        <motion.div 
          className="absolute right-[25%] top-[22%] size-14 rotate-[12deg] rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/5 md:right-[30%]"
          style={{ 
            x: useTransform(scrollYProgress, [0.3, 0.5], [0, 300]),
            y: useTransform(scrollYProgress, [0.3, 0.5], [0, -20]),
          }}
        >
          <div className="grid h-full place-items-center">
            <Image src="/Anthropic.svg" alt="Claude" width={80} height={20} className="invert-0" />
          </div>
        </motion.div>
        
        <motion.div 
          className="absolute right-[20%] top-[48%] size-16 rotate-[-8deg] rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/5 md:right-[25%]"
          style={{ 
            x: useTransform(scrollYProgress, [0.3, 0.5], [0, 350]),
            y: useTransform(scrollYProgress, [0.3, 0.5], [0, 10]),
          }}
        >
          <div className="grid h-full place-items-center">
            <Image src="/gemini.png" alt="Gemini" width={32} height={32} />
          </div>
        </motion.div>
        
        {/* Dropbox-ish */}
        <motion.div 
          className="absolute right-[28%] bottom-[28%] size-14 rotate-[10deg] rounded-2xl bg-[#0061FF] p-3 shadow-xl ring-1 ring-black/5 md:right-[32%]"
          style={{ 
            x: useTransform(scrollYProgress, [0.3, 0.5], [0, 280]),
            y: useTransform(scrollYProgress, [0.3, 0.5], [0, 30]),
          }}
        >
          <div className="grid h-full place-items-center text-white">
            <div className="grid grid-cols-2 gap-0.5">
              <div className="size-2 bg-white/90" />
              <div className="size-2 bg-white/90" />
              <div className="size-2 bg-white/90" />
              <div className="size-2 bg-white/90" />
            </div>
          </div>
        </motion.div>
        
        {/* Notion-ish */}
        <motion.div 
          className="absolute right-[18%] top-[35%] size-12 rotate-[-4deg] rounded-xl bg-white p-2.5 shadow-xl ring-1 ring-black/5 md:right-[22%]"
          style={{ 
            x: useTransform(scrollYProgress, [0.3, 0.5], [0, 320]),
            y: useTransform(scrollYProgress, [0.3, 0.5], [0, -10]),
          }}
        >
          <div className="grid h-full place-items-center text-black">
            <span className="font-serif font-bold text-xl">N</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Content Container */}
      <div className="relative z-10 mx-auto max-w-4xl px-6">
        {/* Old Text - "You Don't Need 50 Tools" */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ 
            opacity: oldTextOpacity,
            y: oldTextY,
          }}
        >
          <p className="mb-8 text-xs font-medium uppercase tracking-[0.2em] text-white/50">
            2015 is over...
          </p>
          <h2 className="text-5xl font-normal tracking-tight sm:text-7xl font-serif">
            You Don't Need <br/> 50 Tools And Tabs
          </h2>
          <p className="mt-8 text-lg leading-8 text-white/60">
            File storage app. Three AI chat subscriptions. Endless tabs for research, project outlines, and notes.
          </p>
          <p className="mt-4 font-serif text-white/40 italic">
            It doesn't need to be like this.
          </p>
        </motion.div>

        {/* New Text - "Meet Aera" */}
        <motion.div
          className="flex flex-col items-center justify-center"
          style={{ 
            opacity: newTextOpacity,
            y: newTextY,
            scale: newTextScale,
          }}
        >
          <div className="flex items-center justify-center gap-6 sm:gap-8">
            <h2 className="text-5xl font-normal tracking-tight sm:text-7xl font-serif text-white">
              Meet
            </h2>
            <motion.div 
              className="grid size-16 sm:size-20 place-items-center rounded-2xl bg-white shadow-xl ring-1 ring-white/20"
              style={{ 
                scale: logoScale,
                rotate: logoRotate,
              }}
            >
              <Image src="/symbol-black.svg" alt="Aera" width={32} height={32} className="sm:w-10 sm:h-10" />
            </motion.div>
            <h2 className="text-5xl font-normal tracking-tight sm:text-7xl font-serif text-white">
              Aera
            </h2>
          </div>
          <p className="mt-8 text-xl leading-8 text-white/70 font-serif italic">
            One Place For All Your Creative Work
          </p>
        </motion.div>
      </div>
    </section>
  );
}
