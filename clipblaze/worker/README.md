# ClipBlaze Worker

Video processing backend for ClipBlaze. Runs on Render with yt-dlp and FFmpeg.

## What it does

1. Downloads YouTube videos using yt-dlp
2. Extracts audio and transcribes with OpenAI Whisper
3. Uses GPT-4 to find viral-worthy highlights
4. Generates 9:16 vertical clips with burned-in captions
5. Uploads everything to Supabase Storage

## Deploy to Render

### Option 1: One-click deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Option 2: Manual deploy

1. Push this `worker` folder to a GitHub repo

2. Go to [Render Dashboard](https://dashboard.render.com)

3. Click "New" → "Web Service"

4. Connect your GitHub repo, select the `worker` folder

5. Configure:
   - **Name**: `clipblaze-worker`
   - **Runtime**: Docker
   - **Plan**: Starter ($7/mo) or higher for longer videos

6. Add environment variables:
   ```
   API_SECRET=<generate-a-random-secret>
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<from-supabase-dashboard>
   OPENAI_API_KEY=sk-...
   ```

7. Deploy!

## Configure Supabase Edge Function

After deploying, add these secrets to your Supabase project:

1. Go to Supabase Dashboard → Edge Functions → Secrets

2. Add:
   - `WORKER_URL`: Your Render URL (e.g., `https://clipblaze-worker.onrender.com`)
   - `WORKER_SECRET`: Same `API_SECRET` you set in Render

## Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your keys

# Run in dev mode
npm run dev
```

Note: You need yt-dlp and ffmpeg installed locally:
- macOS: `brew install yt-dlp ffmpeg`
- Ubuntu: `apt install ffmpeg && pip install yt-dlp`
- Windows: Download from official sites

## API Endpoints

### `GET /health`
Health check endpoint.

### `POST /process`
Start video processing.

Headers:
- `Authorization: Bearer <API_SECRET>`

Body:
```json
{
  "videoId": "uuid",
  "youtubeUrl": "https://youtube.com/watch?v=...",
  "userId": "uuid"
}
```

## Scaling

- **Starter plan** ($7/mo): Good for videos up to ~15 min
- **Standard plan** ($25/mo): Better for longer videos, more RAM
- **Pro plan** ($85/mo): For heavy usage

For very long videos (60+ min), consider:
- Using a background job queue
- Splitting into chunks
- Using Render's background workers
