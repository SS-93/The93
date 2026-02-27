import React from 'react'
import { DNASimulator } from '../components/trinity/mediaid/DNASimulator'

const DNASimulatorRoute: React.FC = () => {
    return (
        <div className="min-h-screen bg-black pt-20 px-4 pb-20">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">MediaID DNA Simulator</h1>
                    <p className="text-gray-400">
                        Visualize how user interactions evolve the 4-domain DNA structure.
                        This is a developer tool for verifying the Digital Symbiosis engine.
                    </p>
                </div>

                <DNASimulator />
            </div>
        </div>
    )
}

export default DNASimulatorRoute
