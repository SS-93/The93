import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DoubleHelix } from '../../shared/DoubleHelix'
import { simulateDNA } from '@/lib/dna/simulator'
import { SimulatedAction, DNASimulation } from '@/types/dna'

/**
 * =============================================================================
 * DNA SIMULATOR UI
 * =============================================================================
 * 
 * Interactive playground for MediaID DNA.
 * Users can add hypothetical actions and see how their DNA evolves.
 */

export function DNASimulator() {
    const [selectedActions, setSelectedActions] = useState<SimulatedAction[]>([])
    const [simulationResult, setSimulationResult] = useState<DNASimulation | null>(null)
    const [isSimulating, setIsSimulating] = useState(false)

    // Mock current DNA (balanced)
    const currentDNA = {
        cultural: 0.4,
        behavioral: 0.3,
        economic: 0.2,
        spatial: 0.5
    }

    // Mock projected DNA (starts same as current)
    const [projectedDNA, setProjectedDNA] = useState(currentDNA)

    const AVAILABLE_ACTIONS = [
        { id: 'attend', label: 'Attend Festival', icon: '🎫', type: 'attend_event', cost: 50 },
        { id: 'sub', label: 'Subscribe Artist', icon: '⭐', type: 'subscribe', cost: 10 },
        { id: 'share', label: 'Share Track', icon: '🔗', type: 'share_track', cost: 0 },
        { id: 'buy', label: 'Buy Merch', icon: '👕', type: 'purchase', cost: 35 },
    ]

    const handleAddAction = (actionType: string) => {
        const newAction: SimulatedAction = {
            type: actionType as any,
            entity_id: 'mock-id',
            entity_type: 'event',
            entity_dna: {
                cultural_dna: { vector: [], confidence: 1, last_updated: new Date() },
                behavioral_dna: { vector: [], confidence: 1, last_updated: new Date() },
                economic_dna: { vector: [], confidence: 1, last_updated: new Date() },
                spatial_dna: { vector: [], confidence: 1, last_updated: new Date() },
                // ... other mock fields
            } as any
        }

        const newActions = [...selectedActions, newAction]
        setSelectedActions(newActions)
        runSimulation(newActions)
    }

    const runSimulation = async (actions: SimulatedAction[]) => {
        setIsSimulating(true)
        try {
            // In a real app, we'd call the actual API
            // const result = await simulateDNA('user-id', actions)

            // Mock simulation delay
            await new Promise(resolve => setTimeout(resolve, 600))

            // Mock result logic for visual demo
            const impact = actions.length * 0.05
            setProjectedDNA({
                cultural: Math.min(1, currentDNA.cultural + impact),
                behavioral: Math.min(1, currentDNA.behavioral + impact * 0.5),
                economic: Math.min(1, currentDNA.economic + impact * 0.8),
                spatial: Math.min(1, currentDNA.spatial + impact * 0.2),
            })

            setSimulationResult({
                actions,
                outcomes: {
                    estimated_earnings: { total: actions.length * 250, referrals: 0, attributions: 0 },
                    new_recommendations: Array(actions.length).fill({ reason: 'New Match' }),
                    brand_offers_unlocked: [],
                    dna_shift: {} as any,
                    resonance_amplification: actions.length * 5
                }
            })

        } finally {
            setIsSimulating(false)
        }
    }

    const resetSimulation = () => {
        setSelectedActions([])
        setProjectedDNA(currentDNA)
        setSimulationResult(null)
    }

    return (
        <div className="w-full max-w-6xl mx-auto p-6 bg-slate-900 rounded-2xl border border-slate-800 text-white min-h-[600px] flex gap-8">

            {/* LEFT: Controls */}
            <div className="w-1/3 space-y-6">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                        DNA Simulator
                    </h2>
                    <p className="text-slate-400 text-sm">Project your digital evolution.</p>
                </div>

                <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Add Actions</p>
                    <div className="grid grid-cols-2 gap-3">
                        {AVAILABLE_ACTIONS.map(action => (
                            <motion.button
                                key={action.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleAddAction(action.type)}
                                className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all text-left"
                            >
                                <span className="text-xl block mb-1">{action.icon}</span>
                                <span className="text-sm font-medium text-slate-300">{action.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {selectedActions.length > 0 && (
                    <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-medium text-slate-300">Simulation Queue</span>
                            <button onClick={resetSimulation} className="text-xs text-red-400 hover:text-red-300">Reset</button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {selectedActions.map((action, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 p-2 rounded"
                                >
                                    <span>action.type</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* CENTER: Visualization */}
            <div className="flex-1 relative bg-black/20 rounded-2xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center">
                <div className="absolute top-4 left-4 z-10">
                    <span className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs rounded-full">
                        {isSimulating ? 'Simulating...' : 'Live Projection'}
                    </span>
                </div>

                <div className="relative w-full h-[400px]">
                    {/* Ghost of Current DNA (faded) */}
                    <div className="absolute inset-0 opacity-20 grayscale">
                        <DoubleHelix dna={currentDNA} speed={0.5} scale={0.8} />
                    </div>

                    {/* Projected DNA (vibrant) */}
                    <div className="absolute inset-0">
                        <DoubleHelix dna={projectedDNA} speed={2} scale={1.2} />
                    </div>
                </div>

                {/* DNA Stats */}
                <div className="w-full p-6 bg-slate-900/80 backdrop-blur border-t border-slate-800 grid grid-cols-4 gap-4">
                    <StatChange label="Cultural (A)" current={currentDNA.cultural} projected={projectedDNA.cultural} color="cyan" />
                    <StatChange label="Behavioral (T)" current={currentDNA.behavioral} projected={projectedDNA.behavioral} color="purple" />
                    <StatChange label="Economic (G)" current={currentDNA.economic} projected={projectedDNA.economic} color="emerald" />
                    <StatChange label="Spatial (C)" current={currentDNA.spatial} projected={projectedDNA.spatial} color="amber" />
                </div>
            </div>

            {/* RIGHT: Outcomes */}
            <div className="w-1/4 space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Projected Impact</h3>

                {simulationResult ? (
                    <div className="space-y-4">
                        <OutcomeCard
                            label="Est. Earnings"
                            value={`$${(simulationResult.outcomes.estimated_earnings.total / 100).toFixed(2)}`}
                            icon="💰"
                            trend="up"
                        />
                        <OutcomeCard
                            label="New Matches"
                            value={`+${simulationResult.outcomes.new_recommendations.length}`}
                            icon="🤝"
                            trend="up"
                        />
                        <OutcomeCard
                            label="Resonance"
                            value={`+${simulationResult.outcomes.resonance_amplification}%`}
                            icon="📡"
                            trend="up"
                        />
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-600 text-sm text-center italic">
                        Add actions to see projected outcomes
                    </div>
                )}
            </div>

        </div>
    )
}

function StatChange({ label, current, projected, color }: any) {
    const delta = projected - current
    const percent = Math.round(delta * 100)

    const colorClasses: any = {
        cyan: 'text-cyan-400',
        purple: 'text-purple-400',
        emerald: 'text-emerald-400',
        amber: 'text-amber-400'
    }

    return (
        <div className="text-center">
            <p className={`text-xs font-bold ${colorClasses[color]} mb-1`}>{label}</p>
            <div className="flex items-end justify-center gap-1">
                <span className="text-xl font-mono text-white">{(projected * 100).toFixed(0)}</span>
                {delta !== 0 && (
                    <span className={`text-xs mb-1 ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {delta > 0 ? '+' : ''}{percent}%
                    </span>
                )}
            </div>
        </div>
    )
}

function OutcomeCard({ label, value, icon, trend }: any) {
    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl"
        >
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-lg">
                    {icon}
                </div>
                <div>
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="text-lg font-bold text-white">{value}</p>
                </div>
            </div>
        </motion.div>
    )
}
