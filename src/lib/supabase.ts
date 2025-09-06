import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          username: string;
          email: string;
          department: string;
          location: string;
          job_title: string;
          manager: string;
          employee_number: string;
          phone: string;
          activated: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          username: string;
          email: string;
          department?: string;
          location?: string;
          job_title?: string;
          manager?: string;
          employee_number?: string;
          phone?: string;
          activated?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          username?: string;
          email?: string;
          department?: string;
          location?: string;
          job_title?: string;
          manager?: string;
          employee_number?: string;
          phone?: string;
          activated?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      assets: {
        Row: {
          id: string;
          asset_tag: string;
          name: string;
          category: string;
          model: string;
          serial_number: string;
          status: string;
          assigned_to: string | null;
          location: string | null;
          purchase_date: string | null;
          purchase_cost: number;
          warranty_expires: string | null;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          asset_tag: string;
          name: string;
          category?: string;
          model?: string;
          serial_number?: string;
          status?: string;
          assigned_to?: string | null;
          location?: string | null;
          purchase_date?: string | null;
          purchase_cost?: number;
          warranty_expires?: string | null;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          asset_tag?: string;
          name?: string;
          category?: string;
          model?: string;
          serial_number?: string;
          status?: string;
          assigned_to?: string | null;
          location?: string | null;
          purchase_date?: string | null;
          purchase_cost?: number;
          warranty_expires?: string | null;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      licenses: {
        Row: {
          id: string;
          name: string;
          type: string;
          seats_total: number;
          seats_used: number;
          expiry_date: string | null;
          cost: number;
          vendor: string;
          status: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type?: string;
          seats_total?: number;
          seats_used?: number;
          expiry_date?: string | null;
          cost?: number;
          vendor?: string;
          status?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          seats_total?: number;
          seats_used?: number;
          expiry_date?: string | null;
          cost?: number;
          vendor?: string;
          status?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      accessories: {
        Row: {
          id: string;
          name: string;
          category: string;
          brand: string;
          model: string;
          quantity: number;
          available: number;
          location: string;
          unit_cost: number;
          status: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string;
          brand?: string;
          model?: string;
          quantity?: number;
          available?: number;
          location?: string;
          unit_cost?: number;
          status?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          brand?: string;
          model?: string;
          quantity?: number;
          available?: number;
          location?: string;
          unit_cost?: number;
          status?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      consumables: {
        Row: {
          id: string;
          name: string;
          category: string;
          brand: string;
          model: string;
          quantity: number;
          min_stock: number;
          location: string;
          unit_cost: number;
          status: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string;
          brand?: string;
          model?: string;
          quantity?: number;
          min_stock?: number;
          location?: string;
          unit_cost?: number;
          status?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          brand?: string;
          model?: string;
          quantity?: number;
          min_stock?: number;
          location?: string;
          unit_cost?: number;
          status?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      components: {
        Row: {
          id: string;
          name: string;
          category: string;
          brand: string;
          model: string;
          quantity: number;
          available: number;
          location: string;
          unit_cost: number;
          status: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string;
          brand?: string;
          model?: string;
          quantity?: number;
          available?: number;
          location?: string;
          unit_cost?: number;
          status?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          brand?: string;
          model?: string;
          quantity?: number;
          available?: number;
          location?: string;
          unit_cost?: number;
          status?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      people: {
        Row: {
          id: string;
          name: string;
          email: string;
          department: string;
          role: string;
          location: string | null;
          phone: string | null;
          status: string;
          hire_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          department: string;
          role: string;
          location?: string | null;
          phone?: string | null;
          status?: string;
          hire_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          department?: string;
          role?: string;
          location?: string | null;
          phone?: string | null;
          status?: string;
          hire_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          type: string;
          description: string;
          entity_id: string | null;
          entity_type: string | null;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          description: string;
          entity_id?: string | null;
          entity_type?: string | null;
          user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          description?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          user_id?: string | null;
          created_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          type: string;
          title: string;
          message: string;
          priority: string;
          read: boolean;
          entity_id: string | null;
          entity_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          title: string;
          message: string;
          priority?: string;
          read?: boolean;
          entity_id?: string | null;
          entity_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          title?: string;
          message?: string;
          priority?: string;
          read?: boolean;
          entity_id?: string | null;
          entity_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      maintenance_records: {
        Row: {
          id: string;
          asset_id: string | null;
          date: string;
          type: string;
          description: string;
          cost: number;
          vendor: string;
          technician: string;
          status: string;
          scheduled_date: string | null;
          completed_date: string | null;
          next_maintenance_date: string | null;
          parts_used: string[];
          incident_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          asset_id?: string | null;
          date?: string;
          type?: string;
          description?: string;
          cost?: number;
          vendor?: string;
          technician?: string;
          status?: string;
          scheduled_date?: string | null;
          completed_date?: string | null;
          next_maintenance_date?: string | null;
          parts_used?: string[];
          incident_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          asset_id?: string | null;
          date?: string;
          type?: string;
          description?: string;
          cost?: number;
          vendor?: string;
          technician?: string;
          status?: string;
          scheduled_date?: string | null;
          completed_date?: string | null;
          next_maintenance_date?: string | null;
          parts_used?: string[];
          incident_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      compliance_checks: {
        Row: {
          id: string;
          type: string;
          status: string;
          last_checked: string;
          next_check: string | null;
          auditor: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type?: string;
          status?: string;
          last_checked?: string;
          next_check?: string | null;
          auditor?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          status?: string;
          last_checked?: string;
          next_check?: string | null;
          auditor?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      policy_violations: {
        Row: {
          id: string;
          type: string;
          severity: string;
          description: string;
          detected_date: string;
          resolved_date: string | null;
          assigned_to: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type?: string;
          severity?: string;
          description?: string;
          detected_date?: string;
          resolved_date?: string | null;
          assigned_to?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          severity?: string;
          description?: string;
          detected_date?: string;
          resolved_date?: string | null;
          assigned_to?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      integrations: {
        Row: {
          id: string;
          name: string;
          type: string;
          endpoint: string;
          api_key: string;
          last_sync: string;
          sync_frequency: string;
          status: string;
          mappings: any;
          error_log: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type?: string;
          endpoint?: string;
          api_key?: string;
          last_sync?: string;
          sync_frequency?: string;
          status?: string;
          mappings?: any;
          error_log?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          endpoint?: string;
          api_key?: string;
          last_sync?: string;
          sync_frequency?: string;
          status?: string;
          mappings?: any;
          error_log?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      import_records: {
        Row: {
          id: string;
          file_name: string;
          type: string;
          status: string;
          records_processed: number;
          total_records: number;
          errors: string[];
          import_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          file_name: string;
          type?: string;
          status?: string;
          records_processed?: number;
          total_records?: number;
          errors?: string[];
          import_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          file_name?: string;
          type?: string;
          status?: string;
          records_processed?: number;
          total_records?: number;
          errors?: string[];
          import_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          name: string;
          type: string;
          description: string;
          parameters: any;
          last_run: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type?: string;
          description?: string;
          parameters?: any;
          last_run?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          description?: string;
          parameters?: any;
          last_run?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      predefined_kits: {
        Row: {
          id: string;
          name: string;
          description: string;
          category: string;
          assets: string[];
          accessories: string[];
          licenses: string[];
          consumables: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          category?: string;
          assets?: string[];
          accessories?: string[];
          licenses?: string[];
          consumables?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          category?: string;
          assets?: string[];
          accessories?: string[];
          licenses?: string[];
          consumables?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      requestable_items: {
        Row: {
          id: string;
          name: string;
          category: string;
          description: string;
          image: string;
          requestable: boolean;
          quantity: number;
          location: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string;
          description?: string;
          image?: string;
          requestable?: boolean;
          quantity?: number;
          location?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          description?: string;
          image?: string;
          requestable?: boolean;
          quantity?: number;
          location?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}