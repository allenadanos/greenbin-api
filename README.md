# GreenBin Waste Classification API

TensorFlow.js image classification API for waste sorting (Paper, Plastic, Biodegradable).

## Quick Start

```bash
npm install
npm start
```

API runs on `http://localhost:3000`

## API Endpoints

### `POST /predict`
Upload image for classification

**Request:**
```bash
curl -X POST http://localhost:3000/predict \
  -F "image=@path/to/image.jpg"
```

**Response:**
```json
{
  "prediction": "Paper",
  "confidence": 0.95,
  "expectedImageUrl": "https://your-project.supabase.co/storage/v1/object/public/waste-images/paper/1234567890-abc123.jpg",
  "storageUpload": "background",
  "allPredictions": [
    {"label": "Paper", "confidence": 0.95, "confidencePercent": "95.00%"},
    {"label": "Plastic", "confidence": 0.03, "confidencePercent": "3.00%"},
    {"label": "Biodegradable", "confidence": 0.02, "confidencePercent": "2.00%"}
  ]
}
```

### `GET /health`
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "modelLoaded": true,
  "storageEnabled": true
}
```

### `GET /info`
Model information and labels

## Supabase Storage Integration

The API automatically uploads classified images to Supabase Storage in the background and returns the expected public URL.

### Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project

2. **Get Credentials**
   - Project URL: Settings → API → Project URL
   - Service Role Key: Settings → API → service_role key

3. **Configure Environment Variables**
   ```bash
   # Copy .env.example to .env
   cp .env.example .env

   # Edit .env with your credentials
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your_service_role_key
   SUPABASE_BUCKET=waste-images
   ```

4. **Storage Bucket Setup**
   - The API will automatically create the bucket if it doesn't exist
   - Images are organized by classification: `paper/`, `plastic/`, `biodegradable/`
   - Each image gets a unique filename with timestamp

### How It Works

1. **Image Classification**: Returns prediction immediately
2. **Background Upload**: Uploads to Supabase asynchronously
3. **Expected URL**: Provides the public URL that will work after upload completes
4. **Graceful Degradation**: Works even if Supabase is not configured

## Deployment

### Environment Variables

Set these in your deployment platform:

**Required:**
- `PORT`: Server port (default: 3000)

**Optional (for Supabase storage):**
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Service role key (not anon key)
- `SUPABASE_BUCKET`: Storage bucket name (default: waste-images)

### Railway
1. Push code to GitHub
2. Create new project on railway.app
3. Select repository
4. Add environment variables in Railway dashboard
5. Deploy automatically

### Render
1. Push code to GitHub
2. Create new Web Service on render.com
3. Connect repository
4. Add environment variables in Render dashboard
5. Deploy automatically

## Testing

```bash
# Health check
curl http://localhost:3000/health

# Classify image
curl -X POST http://localhost:3000/predict \
  -F "image=@test-image.jpg"
```