
/**
 * =============================================================================
 * LAB EXPERIMENT: DIGITAL SYMBIOSIS LOGIC VERIFICATION
 * =============================================================================
 * 
 * Purpose: Verify the math behind DNA mirroring without DB dependencies.
 * Scenario: User (Neutral DNA) plays a Hip-Hop track (Strong Cultural Signal).
 * Expectation: User's Cultural DNA should shift towards the Track's DNA.
 */

import { getInfluenceWeights, applyUserMultipliers } from '../src/lib/dna/influenceWeights';
import { applyDecay } from '../src/lib/dna/decay';

// =============================================================================
// MOCKS
// =============================================================================

// Mock User DNA (Neutral - all zeros)
const mockUserDNA = {
    culturalDNA: Array(10).fill(0), // Simplified to 10 dimensions for readability
    behavioralDNA: Array(10).fill(0),
    economicDNA: Array(10).fill(0),
    spatialDNA: Array(10).fill(0),
    lastInteraction: new Date(Date.now() - 86400000 * 5) // 5 days ago
};

// Mock Entity DNA (Hip-Hop Track - Strong signal in first 5 dims)
const mockEntityDNA = {
    culturalDNA: [1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    behavioralDNA: [0.5, 0.5, 0.5, 0.5, 0.5, 0, 0, 0, 0, 0],
    economicDNA: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Free track
    spatialDNA: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
};

// Mock Context
const context = {
    interactionType: 'player.track_played',
    recencyFactor: 1.0,
    userPreferences: {
        userId: 'mock-user',
        culturalMultiplier: 1.0,
        behavioralMultiplier: 1.0,
        economicMultiplier: 1.0,
        spatialMultiplier: 1.0,
        learningRate: 0.1,
        updatedAt: new Date()
    }
};

// =============================================================================
// THE EXPERIMENT (Re-implementing mirrorInteractionToDNA logic)
// =============================================================================

async function runExperiment() {
    console.log('🧪 STARTING DIGITAL SYMBIOSIS EXPERIMENT');
    console.log('----------------------------------------');
    console.log('Subject: User (Neutral DNA)');
    console.log('Stimulus: Hip-Hop Track Play (Strong Cultural Signal)');
    console.log('----------------------------------------');

    // 1. Get Weights
    const baseWeights = getInfluenceWeights(context.interactionType);
    console.log(`[Weights] Base Intensity: ${baseWeights.baseIntensity}`);
    console.log(`[Weights] Cultural Impact: ${baseWeights.cultural}`);

    const finalWeights = applyUserMultipliers(baseWeights, context.userPreferences);

    // 2. Calculate Decay
    // 5 days old, 30 day half-life
    const ageDays = 5;
    const decayFactor = Math.pow(0.5, ageDays / 30);
    console.log(`[Decay] Factor after 5 days: ${decayFactor.toFixed(4)}`);

    // 3. Calculate Alpha (Learning Rate)
    const alpha = context.userPreferences.learningRate * baseWeights.baseIntensity * context.recencyFactor;
    console.log(`[Learning] Alpha: ${alpha.toFixed(4)}`);

    // 4. Evolve Cultural DNA
    console.log('\n🧬 EVOLVING CULTURAL DNA...');
    const newCulturalDNA = mockUserDNA.culturalDNA.map((val, idx) =>
        (1 - alpha * finalWeights.cultural) * val * decayFactor +
        alpha * finalWeights.cultural * mockEntityDNA.culturalDNA[idx]
    );

    // 5. Analyze Results
    const oldMagnitude = Math.sqrt(mockUserDNA.culturalDNA.reduce((a, b) => a + b * b, 0));
    const newMagnitude = Math.sqrt(newCulturalDNA.reduce((a, b) => a + b * b, 0));

    console.log(`[Result] Old Magnitude: ${oldMagnitude.toFixed(4)}`);
    console.log(`[Result] New Magnitude: ${newMagnitude.toFixed(4)}`);

    // Check first dimension (where signal was 1.0)
    const dim0 = newCulturalDNA[0];
    console.log(`[Result] Dimension 0 Value: ${dim0.toFixed(4)} (Expected > 0)`);

    if (dim0 > 0) {
        console.log('\n✅ SUCCESS: DNA successfully mirrored the entity signal!');
    } else {
        console.log('\n❌ FAILURE: DNA did not evolve.');
    }
}

runExperiment().catch(console.error);
