// Mirrors supabase/migrations. Regenerate with:
//   npx supabase gen types typescript --project-id <id> --schema public > lib/supabase/types.ts

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled"
export type VisitType = "in_clinic" | "video" | "home_visit"
export type DoctorKind = "consultant" | "intern"
export type DutyType = "on_call" | "emergency" | "ward"
export type AmbulanceType = "bls" | "als" | "icu" | "transport" | "neonatal"
export type AmbulanceStatus = "available" | "on_trip" | "maintenance" | "offline"
export type AmbulanceRequestStatus = "pending" | "dispatched" | "completed" | "cancelled"
export type FacilityType = "hospital" | "urgent_care" | "clinic" | "pharmacy" | "diagnostic"
export type TheatreStatus = "available" | "in_use" | "cleaning" | "maintenance"
export type SurgeryStatus = "scheduled" | "pre_op" | "in_progress" | "recovery" | "completed" | "delayed" | "cancelled"

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: { user_id: string; created_at: string }
        Insert: { user_id: string; created_at?: string }
        Update: { user_id?: string; created_at?: string }
        Relationships: []
      }
      ambulances: {
        Row: {
          id: string
          code: string
          vehicle_model: string
          registration: string
          type: AmbulanceType
          status: AmbulanceStatus
          equipment: string[]
          base_location: string | null
          driver_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          code: string
          vehicle_model: string
          registration: string
          type: AmbulanceType
          status?: AmbulanceStatus
          equipment?: string[]
          base_location?: string | null
          driver_name?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["ambulances"]["Insert"]>
        Relationships: []
      }
      ambulance_requests: {
        Row: {
          id: string
          full_name: string
          phone: string
          pickup_address: string
          details: string | null
          status: AmbulanceRequestStatus
          ambulance_id: string | null
          created_at: string
          dispatched_at: string | null
          completed_at: string | null
        }
        Insert: never
        Update: never
        Relationships: []
      }
      operation_theatres: {
        Row: {
          id: string
          code: string
          name: string
          location: string | null
          status: TheatreStatus
          created_at: string
          updated_at: string
        }
        Insert: { code: string; name: string; location?: string | null; status?: TheatreStatus }
        Update: Partial<Database["public"]["Tables"]["operation_theatres"]["Insert"]>
        Relationships: []
      }
      surgeries: {
        Row: {
          id: string
          case_code: string
          theatre_id: string
          surgeon_id: string
          procedure: string
          patient_name: string
          scheduled_at: string
          duration_minutes: number
          status: SurgeryStatus
          note: string | null
          started_at: string | null
          ended_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          theatre_id: string
          surgeon_id: string
          procedure: string
          patient_name: string
          scheduled_at: string
          duration_minutes: number
          status?: SurgeryStatus
          note?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["surgeries"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "surgeries_theatre_id_fkey"
            columns: ["theatre_id"]
            isOneToOne: false
            referencedRelation: "operation_theatres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgeries_surgeon_id_fkey"
            columns: ["surgeon_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      nearby_facilities: {
        Row: {
          id: string
          name: string
          type: FacilityType
          address: string
          city: string
          phone: string | null
          latitude: number
          longitude: number
          open_24h: boolean
          has_emergency: boolean
          services: string[]
          hours: string | null
          website: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          type: FacilityType
          address: string
          city: string
          phone?: string | null
          latitude: number
          longitude: number
          open_24h?: boolean
          has_emergency?: boolean
          services?: string[]
          hours?: string | null
          website?: string | null
          is_active?: boolean
        }
        Update: Partial<Database["public"]["Tables"]["nearby_facilities"]["Insert"]>
        Relationships: []
      }
      doctor_contacts: {
        Row: {
          doctor_id: string
          email: string | null
          assistant_name: string | null
          assistant_email: string | null
          updated_at: string
        }
        Insert: { doctor_id: string; email?: string | null; assistant_name?: string | null; assistant_email?: string | null }
        Update: { email?: string | null; assistant_name?: string | null; assistant_email?: string | null }
        Relationships: []
      }
      serial_digest_log: {
        Row: { doctor_id: string; digest_date: string; recipients: string[]; appointment_count: number; sent_at: string }
        Insert: { doctor_id: string; digest_date: string; recipients: string[]; appointment_count: number }
        Update: Record<never, never>
        Relationships: []
      }
      doctor_leaves: {
        Row: { id: string; doctor_id: string; leave_date: string; reason: string | null; created_at: string }
        Insert: { doctor_id: string; leave_date: string; reason?: string | null }
        Update: { reason?: string | null }
        Relationships: []
      }
      doctor_reviews: {
        Row: {
          id: string
          appointment_id: string
          doctor_id: string
          patient_id: string
          author_name: string
          rating: number
          comment: string | null
          status: "pending" | "approved" | "rejected"
          created_at: string
        }
        Insert: never
        Update: { status?: "pending" | "approved" | "rejected" }
        Relationships: [
          {
            foreignKeyName: "doctor_reviews_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      callback_requests: {
        Row: {
          id: string
          full_name: string
          phone: string
          concern: string
          status: "open" | "resolved"
          created_at: string
          resolved_at: string | null
        }
        Insert: never
        Update: { status?: "open" | "resolved"; resolved_at?: string | null }
        Relationships: []
      }
      queue_state: {
        Row: { schedule_id: string; queue_date: string; now_serving: number; updated_at: string }
        Insert: { schedule_id: string; queue_date: string; now_serving?: number }
        Update: { now_serving?: number }
        Relationships: []
      }
      patients: {
        Row: {
          user_id: string
          full_name: string
          phone: string
          email: string | null
          date_of_birth: string | null
          gender: "female" | "male" | "other" | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          full_name: string
          phone: string
          email?: string | null
          date_of_birth?: string | null
          gender?: "female" | "male" | "other" | null
          address?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["patients"]["Insert"]>
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
          accepting_appointments: boolean
          kind: DoctorKind
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
          accepting_appointments?: boolean
          kind?: DoctorKind
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
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          weekday: number
          start_time: string
          end_time: string
          max_patients?: number
          is_active?: boolean
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
          duty_type: DutyType
          created_at: string
        }
        Insert: { id?: string; doctor_id: string; starts_at: string; ends_at: string; note?: string | null; duty_type?: DutyType }
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
          patient_id: string | null
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
    Views: {
      published_reviews: {
        Row: {
          id: string
          doctor_id: string
          author_name: string
          rating: number
          comment: string | null
          created_at: string
        }
        Relationships: []
      }
    }
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
      cancel_my_appointment: { Args: { p_appointment_id: string }; Returns: boolean }
      call_next_patient: { Args: { p_schedule_id: string }; Returns: number }
      request_callback: { Args: { p_name: string; p_phone: string; p_concern: string }; Returns: string }
      request_ambulance: { Args: { p_name: string; p_phone: string; p_address: string; p_details?: string | null }; Returns: string }
      dispatch_ambulance: { Args: { p_request_id: string; p_ambulance_id: string }; Returns: undefined }
      close_ambulance_request: { Args: { p_request_id: string; p_status: "completed" | "cancelled" }; Returns: undefined }
      submit_review: { Args: { p_appointment_id: string; p_rating: number; p_comment?: string | null }; Returns: string }
      get_doctor_roster: {
        Args: { p_from?: string; p_days?: number }
        Returns: {
          roster_date: string
          doctor_id: string
          doctor_name: string
          doctor_slug: string
          specialty: string
          status: "available" | "leave" | "off"
          sessions: { start_time: string; end_time: string }[]
          leave_reason: string | null
          accepting: boolean
        }[]
      }
      get_doctor_ratings: { Args: Record<never, never>; Returns: { doctor_id: string; average: number; total: number }[] }
      get_ot_board: {
        Args: { p_date?: string }
        Returns: {
          case_code: string
          theatre_code: string
          theatre_name: string
          procedure: string
          surgeon_name: string
          surgeon_specialty: string
          scheduled_at: string
          duration_minutes: number
          status: SurgeryStatus
          note: string | null
          started_at: string | null
          ended_at: string | null
        }[]
      }
      get_today_queue: {
        Args: Record<never, never>
        Returns: {
          schedule_id: string
          doctor_id: string
          doctor_name: string
          doctor_slug: string
          specialty: string
          start_time: string
          end_time: string
          now_serving: number
          total: number
          waiting: number
          updated_at: string | null
        }[]
      }
    }
    Enums: { appointment_status: AppointmentStatus; visit_type: VisitType }
    CompositeTypes: Record<never, never>
  }
}

export type Doctor = Database["public"]["Tables"]["doctors"]["Row"]
export type DoctorSchedule = Database["public"]["Tables"]["doctor_schedules"]["Row"]
export type OnCallShift = Database["public"]["Tables"]["on_call_shifts"]["Row"]
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"]
export type Patient = Database["public"]["Tables"]["patients"]["Row"]
export type CallbackRequest = Database["public"]["Tables"]["callback_requests"]["Row"]
export type DoctorReview = Database["public"]["Tables"]["doctor_reviews"]["Row"]
export type PublishedReview = Pick<DoctorReview, "id" | "doctor_id" | "author_name" | "rating" | "comment" | "created_at">
export type DoctorRating = { average: number; total: number }
export type DoctorLeave = Database["public"]["Tables"]["doctor_leaves"]["Row"]
export type DoctorContact = Database["public"]["Tables"]["doctor_contacts"]["Row"]
export type Ambulance = Database["public"]["Tables"]["ambulances"]["Row"]
export type AmbulanceRequest = Database["public"]["Tables"]["ambulance_requests"]["Row"]
export type NearbyFacility = Database["public"]["Tables"]["nearby_facilities"]["Row"]
export type OperationTheatre = Database["public"]["Tables"]["operation_theatres"]["Row"]
export type Surgery = Database["public"]["Tables"]["surgeries"]["Row"]
export type OtBoardCase = Database["public"]["Functions"]["get_ot_board"]["Returns"][number]
export type RosterEntry = Database["public"]["Functions"]["get_doctor_roster"]["Returns"][number]
export type QueueSession = Database["public"]["Functions"]["get_today_queue"]["Returns"][number]
export type DoctorWithSchedules = Doctor & { doctor_schedules: DoctorSchedule[] }
