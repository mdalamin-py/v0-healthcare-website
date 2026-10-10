// Mirrors supabase/migrations. Regenerate with:
//   npx supabase gen types typescript --project-id <id> --schema public > lib/supabase/types.ts

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled"
export type VisitType = "in_clinic" | "video" | "home_visit"

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: { user_id: string; created_at: string }
        Insert: { user_id: string; created_at?: string }
        Update: { user_id?: string; created_at?: string }
        Relationships: []
      }
      doctors: {
        Row: {
          id: string
          slug: string
          full_name: string
          specialty: string
          qualification: string | null
          experience_years: number
          bio: string | null
          photo_url: string | null
          consultation_fee: number | null
          languages: string[]
          room: string | null
          visit_types: VisitType[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          full_name: string
          specialty: string
          qualification?: string | null
          experience_years?: number
          bio?: string | null
          photo_url?: string | null
          consultation_fee?: number | null
          languages?: string[]
          room?: string | null
          visit_types?: VisitType[]
          is_active?: boolean
        }
        Update: Partial<Database["public"]["Tables"]["doctors"]["Insert"]>
        Relationships: []
      }
      doctor_schedules: {
        Row: {
          id: string
          doctor_id: string
          weekday: number
          start_time: string
          end_time: string
          max_patients: number
          created_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          weekday: number
          start_time: string
          end_time: string
          max_patients?: number
        }
        Update: Partial<Database["public"]["Tables"]["doctor_schedules"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "doctor_schedules_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      on_call_shifts: {
        Row: {
          id: string
          doctor_id: string
          starts_at: string
          ends_at: string
          note: string | null
          created_at: string
        }
        Insert: { id?: string; doctor_id: string; starts_at: string; ends_at: string; note?: string | null }
        Update: Partial<Database["public"]["Tables"]["on_call_shifts"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "on_call_shifts_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          id: string
          reference: string
          doctor_id: string
          schedule_id: string
          appointment_date: string
          serial_no: number
          patient_name: string
          patient_phone: string
          patient_email: string | null
          patient_age: number | null
          patient_gender: "female" | "male" | "other" | null
          reason: string | null
          visit_type: VisitType
          patient_address: string | null
          status: AppointmentStatus
          created_at: string
          updated_at: string
        }
        Insert: never
        Update: { status?: AppointmentStatus }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "doctor_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: Record<never, never>
    Functions: {
      is_admin: { Args: Record<never, never>; Returns: boolean }
      clinic_today: { Args: Record<never, never>; Returns: string }
      get_availability: {
        Args: { p_doctor_id: string; p_days?: number }
        Returns: {
          schedule_id: string
          appointment_date: string
          start_time: string
          end_time: string
          max_patients: number
          booked: number
        }[]
      }
      book_appointment: {
        Args: {
          p_schedule_id: string
          p_date: string
          p_name: string
          p_phone: string
          p_email?: string | null
          p_age?: number | null
          p_gender?: string | null
          p_reason?: string | null
          p_visit_type?: VisitType
          p_address?: string | null
        }
        Returns: {
          reference: string
          serial_no: number
          appointment_date: string
          start_time: string
          end_time: string
          doctor_name: string
          specialty: string
          visit_type: VisitType
        }[]
      }
      lookup_appointment: {
        Args: { p_reference: string; p_phone: string }
        Returns: {
          reference: string
          status: AppointmentStatus
          serial_no: number
          appointment_date: string
          start_time: string
          end_time: string
          doctor_name: string
          specialty: string
          visit_type: VisitType
        }[]
      }
      cancel_appointment: { Args: { p_reference: string; p_phone: string }; Returns: boolean }
    }
    Enums: { appointment_status: AppointmentStatus; visit_type: VisitType }
    CompositeTypes: Record<never, never>
  }
}

export type Doctor = Database["public"]["Tables"]["doctors"]["Row"]
export type DoctorSchedule = Database["public"]["Tables"]["doctor_schedules"]["Row"]
export type OnCallShift = Database["public"]["Tables"]["on_call_shifts"]["Row"]
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"]
export type DoctorWithSchedules = Doctor & { doctor_schedules: DoctorSchedule[] }
