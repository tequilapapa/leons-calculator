// app.js
// Leon's Project Calculator backend
// ---------------------------------
// Run with:  node app.js
// (make sure you `npm install express cors dotenv` first)

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ------------------------
// Core pricing logic
// ------------------------

/**
 * @typedef {Object} QuoteInput
 * @property {"refinish"|"new_hardwood"|"luxury_vinyl"|"kitchen_remodel"} projectType
 * @property {number} squareFeet
 * @property {"economy"|"standard"|"premium"} quality
 * @property {"low"|"medium"|"high"} locationCostTier
 * @property {boolean} hasStairs
 * @property {number} [stairCount]
 * @property {boolean} needsDemo           // remove existing flooring
 * @property {boolean} needsSubfloorPrep
 * @property {boolean} moveFurniture
 * @property {boolean} haulAwayDebris
 * @property {boolean} rushJob
 */

/**
 * Calculate a realistic min / max range for a project based on
 * rough industry-style heuristics.
 *
 * @param {QuoteInput} input
 */
function calculateQuote(input) {
  // ---- basic validation ----
  if (!input) {
    throw new Error('Request body is required.');
  }

  const {
    projectType,
    squareFeet,
    quality,
    locationCostTier,
    hasStairs,
    stairCount = 0,
    needsDemo,
    needsSubfloorPrep,
    moveFurniture,
    haulAwayDebris,
    rushJob,
  } = input;

  if (!projectType) throw new Error('projectType is required.');
  if (!squareFeet || typeof squareFeet !== 'number' || squareFeet <= 0) {
    throw new Error('squareFeet must be a positive number.');
  }

  // ------- base price per square foot -------
  /** @type {Record<string, [number, number]>} */
  const basePerSqFt = {
    refinish: [3.5, 5.5],        // sanding + finish
    new_hardwood: [6, 11],       // material + labor
    luxury_vinyl: [3, 6.5],
    kitchen_remodel: [7, 12],    // floor portion only; plus a fixed kitchen add-on later
  };

  const base = basePerSqFt[projectType];
  if (!base) {
    throw new Error(`Unsupported projectType: ${projectType}`);
  }

  let [minRate, maxRate] = base;

  // ------- quality multiplier -------
  const qualityMultiplier = {
    economy: 0.9,
    standard: 1,
    premium: 1.25,
  }[quality || 'standard'] || 1;

  minRate *= qualityMultiplier;
  maxRate *= qualityMultiplier;

  // ------- location multiplier -------
  const locationMultiplier = {
    low: 0.9,     // cheaper markets
    medium: 1,
    high: 1.2,    // LA, NYC, SF, etc
  }[locationCostTier || 'medium'] || 1;

  minRate *= locationMultiplier;
  maxRate *= locationMultiplier;

  // ------- small-job minimums -------
  let effectiveSqFt = squareFeet;
  const smallJobMin = 600; // treat tiny jobs like 600 sq ft minimum
  if (squareFeet < smallJobMin) {
    effectiveSqFt = smallJobMin;
  }

  // ------- base material + labor -------
  const baseMin = minRate * effectiveSqFt;
  const baseMax = maxRate * effectiveSqFt;

  // ------- add-ons & complexities -------
  const lineItems = [];

  let addMin = 0;
  let addMax = 0;

  // Stairs: price per stair
  if (hasStairs && stairCount > 0) {
    const perStairMin = 80 * locationMultiplier;
    const perStairMax = 130 * locationMultiplier;
    const itemMin = perStairMin * stairCount;
    const itemMax = perStairMax * stairCount;
    addMin += itemMin;
    addMax += itemMax;
    lineItems.push({
      label: `Stairs (${stairCount})`,
      min: round(itemMin),
      max: round(itemMax),
    });
  }

  // Demo existing floor
  if (needsDemo) {
    const demoRateMin = 0.75 * locationMultiplier;
    const demoRateMax = 1.5 * locationMultiplier;
    const itemMin = demoRateMin * squareFeet;
    const itemMax = demoRateMax * squareFeet;
    addMin += itemMin;
    addMax += itemMax;
    lineItems.push({
      label: 'Remove & dispose existing flooring',
      min: round(itemMin),
      max: round(itemMax),
    });
  }

  // Subfloor prep
  if (needsSubfloorPrep) {
    const prepRateMin = 0.75 * locationMultiplier;
    const prepRateMax = 1.5 * locationMultiplier;
    const itemMin = prepRateMin * squareFeet;
    const itemMax = prepRateMax * squareFeet;
    addMin += itemMin;
    addMax += itemMax;
    lineItems.push({
      label: 'Subfloor prep / leveling allowance',
      min: round(itemMin),
      max: round(itemMax),
    });
  }

  // Furniture moving
  if (moveFurniture) {
    const itemMin = 250 * locationMultiplier;
    const itemMax = 550 * locationMultiplier;
    addMin += itemMin;
    addMax += itemMax;
    lineItems.push({
      label: 'Move & reset furniture',
      min: round(itemMin),
      max: round(itemMax),
    });
  }

  // Haul-away debris
  if (haulAwayDebris) {
    const itemMin = 150 * locationMultiplier;
    const itemMax = 350 * locationMultiplier;
    addMin += itemMin;
    addMax += itemMax;
    lineItems.push({
      label: 'Jobsite cleanup & debris haul-away',
      min: round(itemMin),
      max: round(itemMax),
    });
  }

  // Kitchen remodel fixed add-on (cabinets, layout, etc.)
  let kitchenAddMin = 0;
  let kitchenAddMax = 0;
  if (projectType === 'kitchen_remodel') {
    kitchenAddMin = 15000 * locationMultiplier;
    kitchenAddMax = 35000 * locationMultiplier;
    addMin += kitchenAddMin;
    addMax += kitchenAddMax;
    lineItems.push({
      label: 'Cabinets, counters, layout & trades (kitchen scope)',
      min: round(kitchenAddMin),
      max: round(kitchenAddMax),
    });
  }

  // Rush job premium
  let rushMin = 0;
  let rushMax = 0;
  if (rushJob) {
    const rushMultiplierMin = 1.1;
    const rushMultiplierMax = 1.25;
    const nonRushMin = baseMin + addMin;
    const nonRushMax = baseMax + addMax;
    rushMin = nonRushMin * (rushMultiplierMin - 1);
    rushMax = nonRushMax * (rushMultiplierMax - 1);
    addMin += rushMin;
    addMax += rushMax;
    lineItems.push({
      label: 'Rush scheduling / overtime allowance',
      min: round(rushMin),
      max: round(rushMax),
    });
  }

  const totalMin = baseMin + addMin;
  const totalMax = baseMax + addMax;

  // Normalize to friendly numbers (nearest $25)
  const normalizedMin = roundTo(totalMin, 25);
  const normalizedMax = roundTo(totalMax, 25);

  const perSqFtMin = normalizedMin / squareFeet;
  const perSqFtMax = normalizedMax / squareFeet;

  return {
    projectType,
    squareFeet,
    quality,
    locationCostTier,
    totals: {
      min: normalizedMin,
      max: normalizedMax,
      display: `$${normalizedMin.toLocaleString()} – $${normalizedMax.toLocaleString()}`,
    },
    pricePerSqFt: {
      min: roundTo(perSqFtMin, 0.05),
      max: roundTo(perSqFtMax, 0.05),
    },
    base: {
      min: round(baseMin),
      max: round(baseMax),
    },
    addOns: lineItems,
    meta: {
      smallJobMinimumSqFt: smallJobMin,
      assumptions: [
        'Pricing is based on typical LA-area labor & material costs.',
        'Final quote depends on on-site inspection, material selections, and layout.',
        'Range shown includes labor, basic materials, and typical jobsite costs.',
      ],
    },
  };
}

// ---------- helpers ----------

function round(num) {
  return Math.round(num);
}

function roundTo(num, step) {
  return Math.round(num / step) * step;
}

// ------------------------
// Routes
// ------------------------

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Main calculator endpoint
app.post('/api/calculate-quote', (req, res) => {
  try {
    const result = calculateQuote(req.body);
    res.json(result);
  } catch (err) {
    console.error('Quote error:', err);
    res.status(400).json({
      error: err.message || 'Unable to calculate quote',
    });
  }
});

// Fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ------------------------
// Start server
// ------------------------

app.listen(PORT, () => {
  console.log(`Leons calculator backend listening on http://localhost:${PORT}`);
});
