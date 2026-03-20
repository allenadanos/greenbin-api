# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GreenBin API is a dual-model waste classification image API built with Express.js. The service classifies uploaded images into Paper, Plastic, or Biodegradable categories using either a local TensorFlow.js Teachable Machine model or an external EdgeImpulse API, with optional Supabase Storage integration.

## Commands

### Development
```bash
npm install          # Install dependencies
npm start           # Start server (runs on port 3000 by default)
npm run dev         # Same as npm start
```

### Testing & Health Check
```bash
curl http://localhost:3000/health                    # Check API health
curl -X POST http://localhost:3000/predict \
  -F "image=@test-image.jpg"                         # Test TeachableMachine model
curl -X POST http://localhost:3000/predict \
  -F "image=@test-image.jpg" \
  -F "model=edgeimpulse"                             # Test EdgeImpulse model
```

## Architecture

### Core Components
- **`server.js`**: Main Express server with model loading, preprocessing, and prediction endpoints
- **`supabaseStorage.js`**: Supabase storage integration with async image upload
- **`edgeImpulseService.js`**: EdgeImpulse API integration with response normalization
- **`model/`**: TensorFlow.js model files (model.json, weights.bin, metadata.json)

### Request Flow
1. Image uploaded via `POST /predict` with multer middleware
2. **Model selection** via `model` parameter (default: teachablemachine)
3. **Classification**: Local TensorFlow.js model OR EdgeImpulse API call
4. Response normalization to unified format
5. Background async upload to Supabase (optional)
6. Response includes prediction, confidence, expected URL

### Key Design Patterns
- **Graceful Degradation**: API functions without Supabase credentials
- **Async Upload**: Non-blocking Supabase uploads using `setImmediate`
- **Memory Management**: Explicit tensor disposal to prevent leaks
- **Device Tracking**: Optional deviceId parameter for image organization

### Model Details
- **Framework**: TensorFlow.js 1.7.4 with Teachable Machine 2.4.12
- **Input**: 224x224 RGB images, normalized to 0-1 range
- **Classes**: Paper, Plastic, Biodegradable (from metadata.labels)
- **Warm-up**: Zero tensor prediction on startup for performance

### Environment Setup
Required `.env` variables:
- `PORT`: Server port (default: 3000)

Optional Supabase configuration:
- `SUPABASE_URL`: Project URL
- `SUPABASE_KEY`: Service role key (not anon key)
- `SUPABASE_BUCKET`: Storage bucket name (default: greenbin-images)

Optional EdgeImpulse configuration:
- `EDGEIMPULSE_API_URL`: EdgeImpulse inference endpoint URL

### Supabase Storage Integration
- Auto-creates public bucket if missing
- Organizes images by: `{deviceId}/{category}/{timestamp}-{random}.{ext}`
- Generates public URLs before upload completion
- Handles upload failures gracefully

### Model Switching
The API supports switching between classification models via the `model` parameter:

**Available Models:**
- `teachablemachine` (default): Local TensorFlow.js model
- `edgeimpulse`: External EdgeImpulse API

**Usage:**
```bash
# Default TeachableMachine
curl -X POST http://localhost:3000/predict -F "image=@test.jpg"

# Explicit EdgeImpulse
curl -X POST http://localhost:3000/predict \
  -F "image=@test.jpg" \
  -F "model=edgeimpulse"
```

**Response Format Preservation:**
Both models return identical response format for seamless client integration:
- Unified prediction structure
- Same confidence scoring
- Consistent error handling
- Identical Supabase upload behavior