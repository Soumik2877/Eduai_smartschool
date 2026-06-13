export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Role = 'student' | 'teacher' | 'parent' | 'admin'
export type TaskStatus = 'pending' | 'completed' | 'overdue'
export type QuizDifficulty = 'easy' | 'medium' | 'hard'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: Role
          avatar_url: string | null
          school_id: string | null
          parent_id: string | null
          enrollment_no: string | null
          teacher_id: string | null
          xp_points: number
          streak_days: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at' | 'xp_points' | 'streak_days'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      subjects: {
        Row: { id: string; user_id: string; name: string; color: string; difficulty: number; created_at: string }
        Insert: Omit<Database['public']['Tables']['subjects']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['subjects']['Insert']>
      }
      study_sessions: {
        Row: {
          id: string; user_id: string; subject_id: string | null
          date: string; start_time: string; end_time: string
          duration_minutes: number; session_type: string; completed: boolean; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['study_sessions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['study_sessions']['Insert']>
      }
      assignments: {
        Row: {
          id: string; user_id: string; subject_id: string | null
          title: string; description: string | null; due_date: string
          status: TaskStatus; priority: number; file_url: string | null; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['assignments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['assignments']['Insert']>
      }
      exams: {
        Row: { id: string; user_id: string; subject_id: string | null; title: string; exam_date: string; syllabus: string | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['exams']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['exams']['Insert']>
      }
      quiz_sessions: {
        Row: {
          id: string; user_id: string; subject_id: string | null; topic: string
          difficulty: QuizDifficulty; score: number | null; total_questions: number
          completed: boolean; questions: Json; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['quiz_sessions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['quiz_sessions']['Insert']>
      }
      focus_sessions: {
        Row: {
          id: string; user_id: string; duration_minutes: number
          break_minutes: number; completed: boolean; subject_id: string | null; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['focus_sessions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['focus_sessions']['Insert']>
      }
      chat_messages: {
        Row: { id: string; user_id: string; role: 'user' | 'assistant'; content: string; subject: string | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['chat_messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['chat_messages']['Insert']>
      }
      performance_records: {
        Row: { id: string; user_id: string; subject_id: string; exam_id: string | null; score: number; max_score: number; recorded_at: string }
        Insert: Omit<Database['public']['Tables']['performance_records']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['performance_records']['Insert']>
      }
      achievements: {
        Row: { id: string; user_id: string; badge_key: string; earned_at: string }
        Insert: Omit<Database['public']['Tables']['achievements']['Row'], 'id' | 'earned_at'>
        Update: never
      }
      notifications: {
        Row: { id: string; user_id: string; title: string; body: string; type: string; read: boolean; created_at: string }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at' | 'read'>
        Update: Partial<Pick<Database['public']['Tables']['notifications']['Row'], 'read'>>
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Subject = Database['public']['Tables']['subjects']['Row']
export type StudySession = Database['public']['Tables']['study_sessions']['Row']
export type Assignment = Database['public']['Tables']['assignments']['Row']
export type Exam = Database['public']['Tables']['exams']['Row']
export type QuizSession = Database['public']['Tables']['quiz_sessions']['Row']
export type FocusSession = Database['public']['Tables']['focus_sessions']['Row']
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type PerformanceRecord = Database['public']['Tables']['performance_records']['Row']
export type Achievement = Database['public']['Tables']['achievements']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
