export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          attendance_date: string
          created_at: string
          employee_id: string | null
          hours_worked: number | null
          id: string
          notes: string | null
          shift: string | null
          status: string
        }
        Insert: {
          attendance_date?: string
          created_at?: string
          employee_id?: string | null
          hours_worked?: number | null
          id?: string
          notes?: string | null
          shift?: string | null
          status?: string
        }
        Update: {
          attendance_date?: string
          created_at?: string
          employee_id?: string | null
          hours_worked?: number | null
          id?: string
          notes?: string | null
          shift?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      cold_storage: {
        Row: {
          best_before: string | null
          cartons: number | null
          chamber_no: string
          created_at: string
          id: string
          packing_date: string | null
          product_name: string
          quantity_kg: number
          temp_max: number | null
          temp_min: number | null
          temperature_c: number | null
          updated_at: string
        }
        Insert: {
          best_before?: string | null
          cartons?: number | null
          chamber_no: string
          created_at?: string
          id?: string
          packing_date?: string | null
          product_name: string
          quantity_kg: number
          temp_max?: number | null
          temp_min?: number | null
          temperature_c?: number | null
          updated_at?: string
        }
        Update: {
          best_before?: string | null
          cartons?: number | null
          chamber_no?: string
          created_at?: string
          id?: string
          packing_date?: string | null
          product_name?: string
          quantity_kg?: number
          temp_max?: number | null
          temp_min?: number | null
          temperature_c?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          contact_person: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      edit_audit_log: {
        Row: {
          edited_at: string
          edited_by: string | null
          edited_by_name: string | null
          field_changed: string
          id: string
          new_value: string | null
          old_value: string | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          edited_at?: string
          edited_by?: string | null
          edited_by_name?: string | null
          field_changed: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          edited_at?: string
          edited_by?: string | null
          edited_by_name?: string | null
          field_changed?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string
          date_of_joining: string | null
          department: string | null
          designation: string | null
          email: string | null
          emp_code: string
          emp_type: string
          full_name: string
          id: string
          phone: string | null
          salary: number | null
          status: string
        }
        Insert: {
          created_at?: string
          date_of_joining?: string | null
          department?: string | null
          designation?: string | null
          email?: string | null
          emp_code: string
          emp_type?: string
          full_name: string
          id?: string
          phone?: string | null
          salary?: number | null
          status?: string
        }
        Update: {
          created_at?: string
          date_of_joining?: string | null
          department?: string | null
          designation?: string | null
          email?: string | null
          emp_code?: string
          emp_type?: string
          full_name?: string
          id?: string
          phone?: string | null
          salary?: number | null
          status?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          bill_url: string | null
          category: string
          created_at: string
          description: string | null
          expense_date: string
          id: string
          paid_by: string | null
        }
        Insert: {
          amount?: number
          bill_url?: string | null
          category: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          paid_by?: string | null
        }
        Update: {
          amount?: number
          bill_url?: string | null
          category?: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          paid_by?: string | null
        }
        Relationships: []
      }
      floor_balance_entries: {
        Row: {
          created_at: string
          entry_type: string
          id: string
          material_id: string | null
          quantity: number
          recorded_by: string | null
          recorded_by_name: string | null
          remarks: string | null
          shift: string | null
        }
        Insert: {
          created_at?: string
          entry_type: string
          id?: string
          material_id?: string | null
          quantity: number
          recorded_by?: string | null
          recorded_by_name?: string | null
          remarks?: string | null
          shift?: string | null
        }
        Update: {
          created_at?: string
          entry_type?: string
          id?: string
          material_id?: string | null
          quantity?: number
          recorded_by?: string | null
          recorded_by_name?: string | null
          remarks?: string | null
          shift?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "floor_balance_entries_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      floor_balance_snapshots: {
        Row: {
          created_at: string
          id: string
          shift: string
          signed_at: string
          snapshot_data: Json
          snapshot_date: string
          supervisor_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          shift: string
          signed_at?: string
          snapshot_data: Json
          snapshot_date?: string
          supervisor_name: string
        }
        Update: {
          created_at?: string
          id?: string
          shift?: string
          signed_at?: string
          snapshot_data?: Json
          snapshot_date?: string
          supervisor_name?: string
        }
        Relationships: []
      }
      ice_log: {
        Row: {
          created_at: string
          ice_consumed_kg: number | null
          ice_produced_kg: number | null
          id: string
          log_date: string
          recorded_by: string | null
        }
        Insert: {
          created_at?: string
          ice_consumed_kg?: number | null
          ice_produced_kg?: number | null
          id?: string
          log_date?: string
          recorded_by?: string | null
        }
        Update: {
          created_at?: string
          ice_consumed_kg?: number | null
          ice_produced_kg?: number | null
          id?: string
          log_date?: string
          recorded_by?: string | null
        }
        Relationships: []
      }
      incidents: {
        Row: {
          action_taken: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          incident_date: string
          incident_type: string
          persons_involved: string | null
          status: string
          updated_at: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          incident_date?: string
          incident_type: string
          persons_involved?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          incident_date?: string
          incident_type?: string
          persons_involved?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          category: string
          code: string
          created_at: string
          current_stock: number
          id: string
          min_stock: number | null
          name: string
          unit_cost: number | null
          uom: string
        }
        Insert: {
          category?: string
          code: string
          created_at?: string
          current_stock?: number
          id?: string
          min_stock?: number | null
          name: string
          unit_cost?: number | null
          uom?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          current_stock?: number
          id?: string
          min_stock?: number | null
          name?: string
          unit_cost?: number | null
          uom?: string
        }
        Relationships: []
      }
      plant_breakdowns: {
        Row: {
          corrective_action: string | null
          created_at: string
          id: string
          issue: string | null
          machine_name: string | null
          plant_id: string | null
          resolved_time: string | null
          root_cause: string | null
          start_time: string
          technician: string | null
        }
        Insert: {
          corrective_action?: string | null
          created_at?: string
          id?: string
          issue?: string | null
          machine_name?: string | null
          plant_id?: string | null
          resolved_time?: string | null
          root_cause?: string | null
          start_time?: string
          technician?: string | null
        }
        Update: {
          corrective_action?: string | null
          created_at?: string
          id?: string
          issue?: string | null
          machine_name?: string | null
          plant_id?: string | null
          resolved_time?: string | null
          root_cause?: string | null
          start_time?: string
          technician?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plant_breakdowns_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_consumption_log: {
        Row: {
          created_at: string
          energy_kwh: number | null
          id: string
          log_date: string
          plant_id: string | null
          recorded_by: string | null
          water_kl: number | null
        }
        Insert: {
          created_at?: string
          energy_kwh?: number | null
          id?: string
          log_date?: string
          plant_id?: string | null
          recorded_by?: string | null
          water_kl?: number | null
        }
        Update: {
          created_at?: string
          energy_kwh?: number | null
          id?: string
          log_date?: string
          plant_id?: string | null
          recorded_by?: string | null
          water_kl?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plant_consumption_log_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_machines: {
        Row: {
          created_at: string
          id: string
          last_service_date: string | null
          machine_name: string
          make_model: string | null
          next_service_due: string | null
          plant_id: string | null
          serial_no: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_service_date?: string | null
          machine_name: string
          make_model?: string | null
          next_service_due?: string | null
          plant_id?: string | null
          serial_no?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_service_date?: string | null
          machine_name?: string
          make_model?: string | null
          next_service_due?: string | null
          plant_id?: string | null
          serial_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plant_machines_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_production_log: {
        Row: {
          actual_kg: number | null
          created_at: string
          id: string
          log_date: string
          planned_kg: number | null
          plant_id: string | null
          recorded_by: string | null
        }
        Insert: {
          actual_kg?: number | null
          created_at?: string
          id?: string
          log_date?: string
          planned_kg?: number | null
          plant_id?: string | null
          recorded_by?: string | null
        }
        Update: {
          actual_kg?: number | null
          created_at?: string
          id?: string
          log_date?: string
          planned_kg?: number | null
          plant_id?: string | null
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plant_production_log_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
        ]
      }
      plants: {
        Row: {
          capacity: number | null
          capacity_uom: string | null
          commissioned_date: string | null
          created_at: string
          id: string
          location: string | null
          name: string
          plant_code: string
          plant_type: string
          status: string
          supervisor: string | null
          total_workers: number | null
        }
        Insert: {
          capacity?: number | null
          capacity_uom?: string | null
          commissioned_date?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name: string
          plant_code: string
          plant_type?: string
          status?: string
          supervisor?: string | null
          total_workers?: number | null
        }
        Update: {
          capacity?: number | null
          capacity_uom?: string | null
          commissioned_date?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          plant_code?: string
          plant_type?: string
          status?: string
          supervisor?: string | null
          total_workers?: number | null
        }
        Relationships: []
      }
      pond_feed_log: {
        Row: {
          created_at: string
          feed_brand: string | null
          feed_type: string | null
          id: string
          log_date: string
          pond_id: string | null
          quantity_kg: number | null
          recorded_by: string | null
        }
        Insert: {
          created_at?: string
          feed_brand?: string | null
          feed_type?: string | null
          id?: string
          log_date?: string
          pond_id?: string | null
          quantity_kg?: number | null
          recorded_by?: string | null
        }
        Update: {
          created_at?: string
          feed_brand?: string | null
          feed_type?: string | null
          id?: string
          log_date?: string
          pond_id?: string | null
          quantity_kg?: number | null
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pond_feed_log_pond_id_fkey"
            columns: ["pond_id"]
            isOneToOne: false
            referencedRelation: "ponds"
            referencedColumns: ["id"]
          },
        ]
      }
      pond_harvests: {
        Row: {
          count_per_kg: number | null
          created_at: string
          destination: string | null
          harvest_date: string
          id: string
          pond_id: string | null
          price_per_kg: number | null
          total_value: number | null
          total_weight_kg: number | null
        }
        Insert: {
          count_per_kg?: number | null
          created_at?: string
          destination?: string | null
          harvest_date?: string
          id?: string
          pond_id?: string | null
          price_per_kg?: number | null
          total_value?: number | null
          total_weight_kg?: number | null
        }
        Update: {
          count_per_kg?: number | null
          created_at?: string
          destination?: string | null
          harvest_date?: string
          id?: string
          pond_id?: string | null
          price_per_kg?: number | null
          total_value?: number | null
          total_weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pond_harvests_pond_id_fkey"
            columns: ["pond_id"]
            isOneToOne: false
            referencedRelation: "ponds"
            referencedColumns: ["id"]
          },
        ]
      }
      pond_mortality: {
        Row: {
          action_taken: string | null
          cause: string | null
          created_at: string
          estimated_count: number | null
          id: string
          log_date: string
          pond_id: string | null
        }
        Insert: {
          action_taken?: string | null
          cause?: string | null
          created_at?: string
          estimated_count?: number | null
          id?: string
          log_date?: string
          pond_id?: string | null
        }
        Update: {
          action_taken?: string | null
          cause?: string | null
          created_at?: string
          estimated_count?: number | null
          id?: string
          log_date?: string
          pond_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pond_mortality_pond_id_fkey"
            columns: ["pond_id"]
            isOneToOne: false
            referencedRelation: "ponds"
            referencedColumns: ["id"]
          },
        ]
      }
      pond_treatments: {
        Row: {
          applied_by: string | null
          created_at: string
          dosage: string | null
          id: string
          pond_id: string | null
          product_name: string | null
          reason: string | null
          treatment_date: string
        }
        Insert: {
          applied_by?: string | null
          created_at?: string
          dosage?: string | null
          id?: string
          pond_id?: string | null
          product_name?: string | null
          reason?: string | null
          treatment_date?: string
        }
        Update: {
          applied_by?: string | null
          created_at?: string
          dosage?: string | null
          id?: string
          pond_id?: string | null
          product_name?: string | null
          reason?: string | null
          treatment_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "pond_treatments_pond_id_fkey"
            columns: ["pond_id"]
            isOneToOne: false
            referencedRelation: "ponds"
            referencedColumns: ["id"]
          },
        ]
      }
      pond_water_quality: {
        Row: {
          ammonia_mgl: number | null
          created_at: string
          do_mgl: number | null
          id: string
          log_date: string
          ph: number | null
          pond_id: string | null
          recorded_by: string | null
          salinity_ppt: number | null
          temperature_c: number | null
        }
        Insert: {
          ammonia_mgl?: number | null
          created_at?: string
          do_mgl?: number | null
          id?: string
          log_date?: string
          ph?: number | null
          pond_id?: string | null
          recorded_by?: string | null
          salinity_ppt?: number | null
          temperature_c?: number | null
        }
        Update: {
          ammonia_mgl?: number | null
          created_at?: string
          do_mgl?: number | null
          id?: string
          log_date?: string
          ph?: number | null
          pond_id?: string | null
          recorded_by?: string | null
          salinity_ppt?: number | null
          temperature_c?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pond_water_quality_pond_id_fkey"
            columns: ["pond_id"]
            isOneToOne: false
            referencedRelation: "ponds"
            referencedColumns: ["id"]
          },
        ]
      }
      ponds: {
        Row: {
          avg_body_weight_g: number | null
          created_at: string
          estimated_biomass_kg: number | null
          fcr: number | null
          id: string
          name: string
          pl_count: number | null
          pond_code: string
          pond_type: string
          size_acres: number | null
          species: string | null
          status: string
          stocking_date: string | null
        }
        Insert: {
          avg_body_weight_g?: number | null
          created_at?: string
          estimated_biomass_kg?: number | null
          fcr?: number | null
          id?: string
          name: string
          pl_count?: number | null
          pond_code: string
          pond_type?: string
          size_acres?: number | null
          species?: string | null
          status?: string
          stocking_date?: string | null
        }
        Update: {
          avg_body_weight_g?: number | null
          created_at?: string
          estimated_biomass_kg?: number | null
          fcr?: number | null
          id?: string
          name?: string
          pl_count?: number | null
          pond_code?: string
          pond_type?: string
          size_acres?: number | null
          species?: string | null
          status?: string
          stocking_date?: string | null
        }
        Relationships: []
      }
      processing_batches: {
        Row: {
          batch_id: string
          byproduct_disposal: string | null
          byproduct_kg: number | null
          created_at: string
          created_by: string | null
          end_time: string | null
          id: string
          input_weight_kg: number | null
          intake_id: string | null
          machines_used: string | null
          notes: string | null
          output_weight_kg: number | null
          processing_type: string
          start_time: string
          status: string
          updated_at: string
          wastage_kg: number | null
          workers_count: number
          yield_pct: number | null
        }
        Insert: {
          batch_id?: string
          byproduct_disposal?: string | null
          byproduct_kg?: number | null
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          input_weight_kg?: number | null
          intake_id?: string | null
          machines_used?: string | null
          notes?: string | null
          output_weight_kg?: number | null
          processing_type: string
          start_time?: string
          status?: string
          updated_at?: string
          wastage_kg?: number | null
          workers_count?: number
          yield_pct?: number | null
        }
        Update: {
          batch_id?: string
          byproduct_disposal?: string | null
          byproduct_kg?: number | null
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          input_weight_kg?: number | null
          intake_id?: string | null
          machines_used?: string | null
          notes?: string | null
          output_weight_kg?: number | null
          processing_type?: string
          start_time?: string
          status?: string
          updated_at?: string
          wastage_kg?: number | null
          workers_count?: number
          yield_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "processing_batches_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "shrimp_intake"
            referencedColumns: ["id"]
          },
        ]
      }
      production_costs: {
        Row: {
          batch_id: string | null
          cost_per_kg: number | null
          created_at: string
          id: string
          labour_cost: number | null
          material_cost: number | null
          output_kg: number | null
          overhead_cost: number | null
          total_cost: number | null
        }
        Insert: {
          batch_id?: string | null
          cost_per_kg?: number | null
          created_at?: string
          id?: string
          labour_cost?: number | null
          material_cost?: number | null
          output_kg?: number | null
          overhead_cost?: number | null
          total_cost?: number | null
        }
        Update: {
          batch_id?: string | null
          cost_per_kg?: number | null
          created_at?: string
          id?: string
          labour_cost?: number | null
          material_cost?: number | null
          output_kg?: number | null
          overhead_cost?: number | null
          total_cost?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          designation: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          designation?: string | null
          email: string
          full_name?: string
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          designation?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          created_at: string
          gst_amount: number | null
          gst_pct: number | null
          id: string
          invoice_no: string | null
          items: string | null
          linked_inward_id: string | null
          payment_status: string
          purchase_date: string
          supplier_name: string
          total: number
        }
        Insert: {
          amount?: number
          created_at?: string
          gst_amount?: number | null
          gst_pct?: number | null
          id?: string
          invoice_no?: string | null
          items?: string | null
          linked_inward_id?: string | null
          payment_status?: string
          purchase_date?: string
          supplier_name: string
          total?: number
        }
        Update: {
          amount?: number
          created_at?: string
          gst_amount?: number | null
          gst_pct?: number | null
          id?: string
          invoice_no?: string | null
          items?: string | null
          linked_inward_id?: string | null
          payment_status?: string
          purchase_date?: string
          supplier_name?: string
          total?: number
        }
        Relationships: []
      }
      qc_inspections: {
        Row: {
          bacterial_count: number | null
          batch_id: string | null
          created_at: string
          created_by: string | null
          id: string
          inspection_date: string
          inspector_name: string
          ph: number | null
          remarks: string | null
          status: string
          temperature_c: number | null
        }
        Insert: {
          bacterial_count?: number | null
          batch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          inspection_date?: string
          inspector_name: string
          ph?: number | null
          remarks?: string | null
          status?: string
          temperature_c?: number | null
        }
        Update: {
          bacterial_count?: number | null
          batch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          inspection_date?: string
          inspector_name?: string
          ph?: number | null
          remarks?: string | null
          status?: string
          temperature_c?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "qc_inspections_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "processing_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      receivables: {
        Row: {
          amount_received: number | null
          buyer: string
          created_at: string
          due_date: string | null
          id: string
          invoice_no: string | null
          invoice_value_usd: number | null
          shipment_id: string | null
          status: string
        }
        Insert: {
          amount_received?: number | null
          buyer: string
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_no?: string | null
          invoice_value_usd?: number | null
          shipment_id?: string | null
          status?: string
        }
        Update: {
          amount_received?: number | null
          buyer?: string
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_no?: string | null
          invoice_value_usd?: number | null
          shipment_id?: string | null
          status?: string
        }
        Relationships: []
      }
      roles_master: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_built_in: boolean
          role_display_name: string
          role_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_built_in?: boolean
          role_display_name: string
          role_name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_built_in?: boolean
          role_display_name?: string
          role_name?: string
        }
        Relationships: []
      }
      scanned_documents: {
        Row: {
          created_at: string
          document_type: string | null
          document_url: string | null
          extracted_data: Json | null
          id: string
          saved_record_id: string | null
          target_module: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type?: string | null
          document_url?: string | null
          extracted_data?: Json | null
          id?: string
          saved_record_id?: string | null
          target_module?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string | null
          document_url?: string | null
          extracted_data?: Json | null
          id?: string
          saved_record_id?: string | null
          target_module?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      shipments: {
        Row: {
          bl_no: string | null
          container_no: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          customer_id: string | null
          destination_country: string | null
          documents_status: string | null
          eta: string | null
          id: string
          invoice_value: number | null
          notes: string | null
          port_of_discharge: string | null
          port_of_loading: string | null
          ship_date: string | null
          shipment_no: string
          status: string
          total_cartons: number | null
          total_quantity_kg: number | null
          updated_at: string
          vessel_name: string | null
        }
        Insert: {
          bl_no?: string | null
          container_no?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          customer_id?: string | null
          destination_country?: string | null
          documents_status?: string | null
          eta?: string | null
          id?: string
          invoice_value?: number | null
          notes?: string | null
          port_of_discharge?: string | null
          port_of_loading?: string | null
          ship_date?: string | null
          shipment_no?: string
          status?: string
          total_cartons?: number | null
          total_quantity_kg?: number | null
          updated_at?: string
          vessel_name?: string | null
        }
        Update: {
          bl_no?: string | null
          container_no?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          customer_id?: string | null
          destination_country?: string | null
          documents_status?: string | null
          eta?: string | null
          id?: string
          invoice_value?: number | null
          notes?: string | null
          port_of_discharge?: string | null
          port_of_loading?: string | null
          ship_date?: string | null
          shipment_no?: string
          status?: string
          total_cartons?: number | null
          total_quantity_kg?: number | null
          updated_at?: string
          vessel_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      shrimp_intake: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          intake_date: string
          lot_number: string
          moisture_pct: number | null
          price_per_kg: number
          quality_grade: string | null
          quantity_kg: number
          remarks: string | null
          species: string
          supplier_name: string
          temperature_c: number | null
          total_cost: number | null
          updated_at: string
          vehicle_number: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          intake_date?: string
          lot_number?: string
          moisture_pct?: number | null
          price_per_kg?: number
          quality_grade?: string | null
          quantity_kg: number
          remarks?: string | null
          species: string
          supplier_name: string
          temperature_c?: number | null
          total_cost?: number | null
          updated_at?: string
          vehicle_number?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          intake_date?: string
          lot_number?: string
          moisture_pct?: number | null
          price_per_kg?: number
          quality_grade?: string | null
          quantity_kg?: number
          remarks?: string | null
          species?: string
          supplier_name?: string
          temperature_c?: number | null
          total_cost?: number | null
          updated_at?: string
          vehicle_number?: string | null
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          material_id: string | null
          movement_date: string
          movement_type: string
          notes: string | null
          quantity: number
          reference_no: string | null
          supplier_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          material_id?: string | null
          movement_date?: string
          movement_type: string
          notes?: string | null
          quantity: number
          reference_no?: string | null
          supplier_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          material_id?: string | null
          movement_date?: string
          movement_type?: string
          notes?: string | null
          quantity?: number
          reference_no?: string | null
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          supplier_type: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          supplier_type?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          supplier_type?: string
        }
        Relationships: []
      }
      temperature_readings: {
        Row: {
          corrective_action: string | null
          id: string
          in_range: boolean | null
          location_name: string
          recorded_at: string
          recorded_by: string | null
          temperature_c: number
        }
        Insert: {
          corrective_action?: string | null
          id?: string
          in_range?: boolean | null
          location_name: string
          recorded_at?: string
          recorded_by?: string | null
          temperature_c: number
        }
        Update: {
          corrective_action?: string | null
          id?: string
          in_range?: boolean | null
          location_name?: string
          recorded_at?: string
          recorded_by?: string | null
          temperature_c?: number
        }
        Relationships: []
      }
      temperature_thresholds: {
        Row: {
          created_at: string
          id: string
          location_name: string
          max_temp: number
          min_temp: number
        }
        Insert: {
          created_at?: string
          id?: string
          location_name: string
          max_temp: number
          min_temp: number
        }
        Update: {
          created_at?: string
          id?: string
          location_name?: string
          max_temp?: number
          min_temp?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitors: {
        Row: {
          check_in: string
          check_out: string | null
          created_at: string
          host_employee: string | null
          id: string
          id_number: string | null
          id_type: string | null
          purpose: string | null
          vehicle_number: string | null
          visitor_name: string
        }
        Insert: {
          check_in?: string
          check_out?: string | null
          created_at?: string
          host_employee?: string | null
          id?: string
          id_number?: string | null
          id_type?: string | null
          purpose?: string | null
          vehicle_number?: string | null
          visitor_name: string
        }
        Update: {
          check_in?: string
          check_out?: string | null
          created_at?: string
          host_employee?: string | null
          id?: string
          id_number?: string | null
          id_type?: string | null
          purpose?: string | null
          vehicle_number?: string | null
          visitor_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "security_officer"
        | "processing_supervisor"
        | "store_manager"
        | "hr_manager"
        | "accounts_officer"
        | "gate_guard"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "admin",
        "security_officer",
        "processing_supervisor",
        "store_manager",
        "hr_manager",
        "accounts_officer",
        "gate_guard",
      ],
    },
  },
} as const
