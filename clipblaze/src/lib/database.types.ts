export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clips: {
        Row: {
          caption_style: Json | null
          created_at: string | null
          duration_seconds: number | null
          end_time: number
          highlights: Json | null
          id: string
          start_time: number
          status: string | null
          storage_path: string | null
          thumbnail_path: string | null
          title: string | null
          transcript: string | null
          updated_at: string | null
          user_id: string
          video_id: string
          viral_score: number | null
        }
        Insert: {
          caption_style?: Json | null
          created_at?: string | null
          end_time: number
          highlights?: Json | null
          id?: string
          start_time: number
          status?: string | null
          storage_path?: string | null
          thumbnail_path?: string | null
          title?: string | null
          transcript?: string | null
          updated_at?: string | null
          user_id: string
          video_id: string
          viral_score?: number | null
        }
        Update: {
          caption_style?: Json | null
          created_at?: string | null
          end_time?: number
          highlights?: Json | null
          id?: string
          start_time?: number
          status?: string | null
          storage_path?: string | null
          thumbnail_path?: string | null
          title?: string | null
          transcript?: string | null
          updated_at?: string | null
          user_id?: string
          video_id?: string
          viral_score?: number | null
        }
      }
      transcripts: {
        Row: {
          created_at: string | null
          full_text: string | null
          id: string
          language: string | null
          segments: Json | null
          video_id: string
        }
        Insert: {
          created_at?: string | null
          full_text?: string | null
          id?: string
          language?: string | null
          segments?: Json | null
          video_id: string
        }
        Update: {
          created_at?: string | null
          full_text?: string | null
          id?: string
          language?: string | null
          segments?: Json | null
          video_id?: string
        }
      }
      videos: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          error_message: string | null
          id: string
          metadata: Json | null
          source_type: string | null
          source_url: string | null
          status: string | null
          storage_path: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          source_type?: string | null
          source_url?: string | null
          status?: string | null
          storage_path?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          source_type?: string | null
          source_url?: string | null
          status?: string | null
          storage_path?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
      }
    }
  }
}

export type Video = Database['public']['Tables']['videos']['Row']
export type Clip = Database['public']['Tables']['clips']['Row']
export type Transcript = Database['public']['Tables']['transcripts']['Row']

export type TranscriptSegment = {
  start: number
  end: number
  text: string
}

export type ClipHighlight = {
  type: 'hook' | 'insight' | 'emotion' | 'action'
  timestamp: number
  description: string
}
