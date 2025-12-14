"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function BrowserWindowReveal({
  children,
}: {
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 95%", "start 70%"],
  });

  const width = useTransform(scrollYProgress, [0, 1], ["85%", "100%"]);
  const y = useTransform(scrollYProgress, [0, 1], [50, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  return (
    <section ref={containerRef} className="relative z-10 pt-32 pb-0">
      <div className="flex justify-center">
        <motion.div style={{ width, y, opacity }} className="w-full">
          {children}
        </motion.div>
      </div>
    </section>
  );
}
