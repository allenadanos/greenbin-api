# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GreenBin API is a TensorFlow.js waste classification image API built with Express.js. The service classifies uploaded images into Paper, Plastic, or Biodegradable categories using a Teachable Machine model and optionally uploads images to Supabase Storage.

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
  -F "image=@test-image.jpg"                         # Test classification
```

## Architecture

### Core Components
- **`server.js`**: Main Express server with model loading, preprocessing, and prediction endpoints
- **`supabaseStorage.js`**: Supabase storage integration with async image upload
- **`model/`**: TensorFlow.js model files (model.json, weights.bin, metadata.json)

### Request Flow
1. Image uploaded via `POST /predict` with multer middleware
2. Image preprocessed to 224x224x3 tensor, normalized to [0,1]
3. Model predicts and returns sorted probabilities
4. Background async upload to Supabase (optional)
5. Response includes prediction, confidence, expected URL

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

### Supabase Storage Integration
- Auto-creates public bucket if missing
- Organizes images by: `{deviceId}/{category}/{timestamp}-{random}.{ext}`
- Generates public URLs before upload completion
- Handles upload failures gracefully