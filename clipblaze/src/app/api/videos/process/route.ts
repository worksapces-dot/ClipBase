import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { inngest } from '@/lib/inngest'

// YouTube URL validation
function isValidYouTubeUrl(url: string): boolean {
  const patterns = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
  ]
  return patterns.some(p => p.test(url))
}

// Extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { url } = body

    if (!url || !isValidYouTubeUrl(url)) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    const videoId = extractVideoId(url)
    if (!videoId) {
      return NextResponse.json({ error: 'Could not extract video ID' }, { status: 400 })
    }

    // Create video record
    const { data: video, error: insertError } = await supabase
      .from('videos')
      .insert({
        user_id: user.id,
        source_url: url,
        source_type: 'youtube',
        status: 'pending',
        metadata: { youtube_id: videoId },
      })
      .select()
      .single()

    if (insertError || !video) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create video record' }, { status: 500 })
    }

    // Trigger Inngest function
    await inngest.send({
      name: "video/process",
      data: {
        videoId: video.id,
        youtubeUrl: url,
        userId: user.id,
      },
    })

    return NextResponse.json({ 
      success: true, 
      videoId: video.id,
      message: 'Video processing started'
    })

  } catch (error) {
    console.error('Process error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
