
/**
 * =============================================================================
 * LAB EXPERIMENT: DIGITAL SYMBIOSIS LOGIC VERIFICATION (JS VERSION)
 * =============================================================================
 */

// --- HELPER LOGIC (Embedded for speed) ---

const INTERACTION_INFLUENCE_WEIGHTS = {
  'player.track_played': {
    cultural: 0.8,
    behavioral: 0.6,
    economic: 0.2,
    spatial: 0.3,
    baseIntensity: 0.5
  }
};

function getInfluenceWeights(type) {
  return INTERACTION_INFLUENCE_WEIGHTS[type] || { cultural: 0.5, behavioral: 0.5, economic: 0.5, spatial: 0.5, baseIntensity: 0.5 };
}

function applyUserMultipliers(base, prefs) {
  return {
    ...base,
    cultural: Math.min(1, base.cultural * prefs.culturalMultiplier),
    behavioral: Math.min(1, base.behavioral * prefs.behavioralMultiplier),
    economic: Math.min(1, base.economic * prefs.economicMultiplier),
    spatial: Math.min(1, base.spatial * prefs.spatialMultiplier)
  };
}

// --- MOCKS ---

const mockUserDNA = {
  culturalDNA: Array(10).fill(0),
  behavioralDNA: Array(10).fill(0),
  economicDNA: Array(10).fill(0),
  spatialDNA: Array(10).fill(0),
  lastInteraction: new Date(Date.now() - 86400000 * 5) // 5 days ago
};

const mockEntityDNA = {
  culturalDNA: [1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
  behavioralDNA: [0.5, 0.5, 0.5, 0.5, 0.5, 0, 0, 0, 0, 0],
  economicDNA: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  spatialDNA: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
};

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

// --- EXPERIMENT ---

async function runExperiment() {
  console.log('🧪 STARTING DIGITAL SYMBIOSIS EXPERIMENT (JS)');
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
  const ageDays = 5;
  const decayFactor = Math.pow(0.5, ageDays / 30); 
  console.log(`[Decay] Factor after 5 days: ${decayFactor.toFixed(4)}`);

  // 3. Calculate Alpha
  const alpha = context.userPreferences.learningRate * baseWeights.baseIntensity * context.recencyFactor;
  console.log(`[Learning] Alpha: ${alpha.toFixed(4)}`);

  // 4. Evolve Cultural DNA
  console.log('\n🧬 EVOLVING CULTURAL DNA...');
  const newCulturalDNA = mockUserDNA.culturalDNA.map((val, idx) => 
    (1 - alpha * finalWeights.cultural) * val * decayFactor +
    alpha * finalWeights.cultural * mockEntityDNA.culturalDNA[idx]
  );

  // 5. Analyze Results
  const oldMagnitude = Math.sqrt(mockUserDNA.culturalDNA.reduce((a, b) => a + b*b, 0));
  const newMagnitude = Math.sqrt(newCulturalDNA.reduce((a, b) => a + b*b, 0));
  
  console.log(`[Result] Old Magnitude: ${oldMagnitude.toFixed(4)}`);
  console.log(`[Result] New Magnitude: ${newMagnitude.toFixed(4)}`);
  
  const dim0 = newCulturalDNA[0];
  console.log(`[Result] Dimension 0 Value: ${dim0.toFixed(4)} (Expected > 0)`);

  if (dim0 > 0) {
    console.log('\n✅ SUCCESS: DNA successfully mirrored the entity signal!');
  } else {
    console.log('\n❌ FAILURE: DNA did not evolve.');
  }
}

runExperiment().catch(console.error);
