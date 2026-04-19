"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export const ModernBackground = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-black" />
      
      {/* Mesh Gradients */}
      <div className="absolute inset-0 mesh-bg opacity-30" />
      
      {/* Animated Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.15, 0.1],
          x: [0, -40, 0],
          y: [0, 60, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/20 blur-[130px] rounded-full"
      />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-grid opacity-20" />

      {/* Connection Lines (SVG) */}
      <svg className="absolute inset-0 w-full h-full opacity-10">
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--primary)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Animated Lines */}
        {[...Array(6)].map((_, i) => (
          <motion.line
            key={i}
            x1={`${10 + i * 15}%`}
            y1="0%"
            x2={`${20 + i * 15}%`}
            y2="100%"
            stroke="url(#gradient1)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 1, 0],
              opacity: [0, 0.5, 0],
              y1: ["0%", "10%"],
              y2: ["90%", "100%"],
            }}
            transition={{
              duration: 5 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </svg>
    </div>
  );
};
