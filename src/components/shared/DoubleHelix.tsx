import React, { useEffect, useRef } from 'react'
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion'

/**
 * =============================================================================
 * DOUBLE HELIX VISUALIZER (3D-ish)
 * =============================================================================
 * 
 * Visualizes MediaID DNA as a rotating double helix.
 * Each base pair represents a specific domain (AGTC).
 * 
 * AESTHETIC:
 * - Neon/Cyberpunk biology
 * - Floating particles
 * - Smooth rotation
 * 
 * PROPS:
 * - dna: The MediaID DNA object (optional, defaults to balanced)
 * - speed: Rotation speed (default 1)
 * - scale: Size scale (default 1)
 * - interactive: Whether mouse interaction affects rotation (default true)
 */

interface DoubleHelixProps {
    dna?: {
        cultural: number
        behavioral: number
        economic: number
        spatial: number
    }
    speed?: number
    scale?: number
    interactive?: boolean
    className?: string
}

export function DoubleHelix({
    dna = { cultural: 0.5, behavioral: 0.5, economic: 0.5, spatial: 0.5 },
    speed = 1,
    scale = 1,
    interactive = true,
    className = ''
}: DoubleHelixProps) {
    const containerRef = useRef<HTMLDivElement>(null)

    // Base pairs count
    const PAIR_COUNT = 20

    // Colors for AGTC domains
    const COLORS = {
        A: '#06b6d4', // Cyan (Cultural)
        T: '#8b5cf6', // Purple (Behavioral)
        G: '#10b981', // Emerald (Economic)
        C: '#f59e0b', // Amber (Spatial)
    }

    return (
        <div
            ref={containerRef}
            className={`relative flex items-center justify-center overflow-hidden ${className}`}
            style={{ perspective: '1000px' }}
        >
            <motion.div
                className="relative w-full h-full flex items-center justify-center transform-style-3d"
                animate={{ rotateY: 360 }}
                transition={{
                    duration: 20 / speed,
                    repeat: Infinity,
                    ease: 'linear'
                }}
            >
                {/* Render Base Pairs */}
                {Array.from({ length: PAIR_COUNT }).map((_, i) => (
                    <BasePair
                        key={i}
                        index={i}
                        total={PAIR_COUNT}
                        dna={dna}
                        colors={COLORS}
                        scale={scale}
                    />
                ))}
            </motion.div>

            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80 pointer-events-none" />
        </div>
    )
}

function BasePair({ index, total, dna, colors, scale }: {
    index: number
    total: number
    dna: any
    colors: any
    scale: number
}) {
    const yOffset = (index - total / 2) * 20 * scale
    const rotation = (index / total) * 360 * 2 // 2 full twists

    // Determine dominant domain for this pair based on index
    // Distribute AGTC evenly along the helix
    const domainIndex = index % 4
    const domainKey = ['A', 'T', 'G', 'C'][domainIndex]
    const color = colors[domainKey]

    // Width depends on DNA strength for that domain
    const strengthMap = [dna.cultural, dna.behavioral, dna.economic, dna.spatial]
    const strength = strengthMap[domainIndex]
    const width = 100 * scale * (0.5 + strength * 0.5) // Min 50%, Max 100%

    return (
        <motion.div
            className="absolute flex items-center justify-center"
            style={{
                y: yOffset,
                rotateY: rotation,
                width: width,
                height: 4 * scale,
                transformStyle: 'preserve-3d'
            }}
        >
            {/* Left Node */}
            <div
                className="absolute left-0 w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]"
                style={{ backgroundColor: color, color: color }}
            />

            {/* Connection Line */}
            <div
                className="w-full h-[1px] opacity-50"
                style={{
                    background: `linear-gradient(90deg, ${color}, transparent, ${color})`
                }}
            />

            {/* Right Node */}
            <div
                className="absolute right-0 w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]"
                style={{ backgroundColor: color, color: color }}
            />
        </motion.div>
    )
}
