const FormData = require('form-data');
const fetch = require('node-fetch');

/**
 * Call EdgeImpulse API for image classification
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string} originalName - Original filename for multipart form
 * @returns {Promise<Object>} - Normalized prediction results
 */
async function classifyWithEdgeImpulse(imageBuffer, originalName) {
  const apiUrl = process.env.EDGEIMPULSE_API_URL;

  if (!apiUrl) {
    throw new Error('EdgeImpulse API URL not configured');
  }

  try {
    // Create multipart form data
    const formData = new FormData();
    formData.append('file', imageBuffer, {
      filename: originalName,
      contentType: 'image/jpeg'
    });

    // Call EdgeImpulse API
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      timeout: 30000 // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`EdgeImpulse API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!data.result || !data.result.classification) {
      throw new Error('Invalid EdgeImpulse response structure');
    }

    // Transform EdgeImpulse response to match our format
    return normalizeEdgeImpulseResponse(data);

  } catch (error) {
    console.error('EdgeImpulse API error:', error.message);
    throw error;
  }
}

/**
 * Transform EdgeImpulse response to match our standard format
 * @param {Object} edgeImpulseResponse - Raw EdgeImpulse API response
 * @returns {Object} - Normalized prediction results
 */
function normalizeEdgeImpulseResponse(edgeImpulseResponse) {
  const classification = edgeImpulseResponse.result.classification;

  // Convert classification object to array format
  const predictions = Object.entries(classification).map(([label, confidence]) => ({
    label: label,
    confidence: confidence
  }));

  // Sort by confidence (highest first)
  const sortedPredictions = predictions.sort((a, b) => b.confidence - a.confidence);

  const topPrediction = sortedPredictions[0];

  return {
    topPrediction: topPrediction,
    allPredictions: sortedPredictions,
    debugInfo: {
      source: 'edgeimpulse',
      timing: edgeImpulseResponse.timing,
      resizeMode: edgeImpulseResponse.result.resizeMode,
      resized: edgeImpulseResponse.result.resized
    }
  };
}

module.exports = {
  classifyWithEdgeImpulse,
  normalizeEdgeImpulseResponse
};