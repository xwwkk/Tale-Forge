'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface PageTransitionProps {
  children: React.ReactNode;
  isTransitioning: boolean;
  direction: 'left' | 'right';
}

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  isTransitioning,
  direction
}) => {
  const variants = {
    enter: (direction: string) => ({
      x: direction === 'right' ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: string) => ({
      zIndex: 0,
      x: direction === 'right' ? -1000 : 1000,
      opacity: 0
    })
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={isTransitioning ? 'transitioning' : 'stable'}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          x: { type: "spring", stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 }
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export default PageTransition 