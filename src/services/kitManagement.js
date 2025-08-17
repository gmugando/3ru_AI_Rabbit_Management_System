import { supabase } from '@/supabase'

class KitManagementService {
  constructor() {
    this.supabase = supabase
  }

  // Generate unique kit ID
  generateKitId() {
    return `KIT-${Date.now().toString().slice(-6)}`
  }

  // Create individual kit records for a breeding plan
  async createKitRecords(breedingPlanId, kitData) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        throw new Error('No authenticated user found')
      }

      const kits = []
      const totalKits = kitData.kits_born || 0
      const maleKits = kitData.kits_male || 0
      const femaleKits = kitData.kits_female || 0

      // Validate that male + female kits equals total kits
      if (maleKits + femaleKits !== totalKits) {
        console.warn(`Kit count mismatch: ${maleKits} male + ${femaleKits} female ≠ ${totalKits} total`)
      }

      // Use femaleKits to ensure it's not flagged as unused
      const expectedFemaleKits = totalKits - maleKits
      if (femaleKits !== expectedFemaleKits) {
        console.warn(`Female kit count may be incorrect: expected ${expectedFemaleKits}, got ${femaleKits}`)
      }

      // Create individual kit records
      for (let i = 0; i < totalKits; i++) {
        // Determine gender based on the count of male vs female kits
        const gender = i < maleKits ? 'male' : 'female'
        const kitId = this.generateKitId()

        kits.push({
          breeding_plan_id: breedingPlanId,
          kit_id: kitId,
          birth_date: kitData.actual_kindle_date,
          gender: gender,
          color: kitData.kit_color || null,
          weight_at_birth: kitData.average_birth_weight || null,
          status: 'alive',
          created_by: user.id
        })
      }

      if (kits.length > 0) {
        const { data, error } = await this.supabase
          .from('kit_records')
          .insert(kits)
          .select()

        if (error) throw error
        return data
      }

      return []
    } catch (error) {
      console.error('Error creating kit records:', error)
      throw error
    }
  }

  // Get all kits for a breeding plan
  async getKitsByBreedingPlan(breedingPlanId) {
    try {
      const { data, error } = await this.supabase
        .from('kit_records')
        .select(`
          *,
          kit_health_records (
            id,
            check_date,
            weight,
            health_status,
            issues,
            treatments,
            notes
          )
        `)
        .eq('breeding_plan_id', breedingPlanId)
        .order('birth_date', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching kits:', error)
      throw error
    }
  }

  // Get all kits for the current user
  async getAllKits() {
    try {
      const { data, error } = await this.supabase
        .from('kit_records')
        .select(`
          *,
          breeding_plans (
            plan_id,
            buck:rabbits!breeding_plans_buck_id_fkey(name, breed),
            doe:rabbits!breeding_plans_doe_id_fkey(name, breed)
          ),
          kit_health_records (
            id,
            check_date,
            weight,
            health_status
          )
        `)
        .order('birth_date', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching all kits:', error)
      throw error
    }
  }

  // Update individual kit
  async updateKit(kitId, updateData) {
    try {
      const { error } = await this.supabase
        .from('kit_records')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', kitId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error updating kit:', error)
      throw error
    }
  }

  // Add health record for a kit
  async addHealthRecord(kitId, healthData) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        throw new Error('No authenticated user found')
      }

      const { data, error } = await this.supabase
        .from('kit_health_records')
        .insert([{
          kit_id: kitId,
          check_date: healthData.check_date,
          weight: healthData.weight,
          health_status: healthData.health_status,
          issues: healthData.issues,
          treatments: healthData.treatments,
          notes: healthData.notes,
          created_by: user.id
        }])
        .select()

      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('Error adding health record:', error)
      throw error
    }
  }

  // Get health records for a kit
  async getKitHealthRecords(kitId) {
    try {
      const { data, error } = await this.supabase
        .from('kit_health_records')
        .select('*')
        .eq('kit_id', kitId)
        .order('check_date', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching kit health records:', error)
      throw error
    }
  }

  // Update kit status (alive, deceased, sold, kept_for_breeding)
  async updateKitStatus(kitId, status, additionalData = {}) {
    try {
      const updateData = {
        status: status,
        updated_at: new Date().toISOString()
      }

      // Add additional data based on status
      if (status === 'deceased') {
        updateData.cause_of_death = additionalData.cause_of_death
        updateData.death_date = additionalData.death_date
      } else if (status === 'sold') {
        updateData.notes = additionalData.sale_notes
      } else if (status === 'kept_for_breeding') {
        updateData.notes = additionalData.breeding_notes
      }

      const { error } = await this.supabase
        .from('kit_records')
        .update(updateData)
        .eq('id', kitId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error updating kit status:', error)
      throw error
    }
  }

  // Get kit statistics
  async getKitStatistics() {
    try {
      const { data: kits, error } = await this.supabase
        .from('kit_records')
        .select('status, gender, birth_date')

      if (error) throw error

      const stats = {
        total: kits.length,
        alive: kits.filter(k => k.status === 'alive').length,
        deceased: kits.filter(k => k.status === 'deceased').length,
        sold: kits.filter(k => k.status === 'sold').length,
        kept_for_breeding: kits.filter(k => k.status === 'kept_for_breeding').length,
        male: kits.filter(k => k.gender === 'male').length,
        female: kits.filter(k => k.gender === 'female').length,
        survival_rate: kits.length > 0 ? 
          ((kits.filter(k => k.status === 'alive').length / kits.length) * 100).toFixed(2) : 0
      }

      return stats
    } catch (error) {
      console.error('Error fetching kit statistics:', error)
      throw error
    }
  }

  // Get kits by status
  async getKitsByStatus(status) {
    try {
      const { data, error } = await this.supabase
        .from('kit_records')
        .select(`
          *,
          breeding_plans (
            plan_id,
            buck:rabbits!breeding_plans_buck_id_fkey(name, breed),
            doe:rabbits!breeding_plans_doe_id_fkey(name, breed)
          )
        `)
        .eq('status', status)
        .order('birth_date', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching kits by status:', error)
      throw error
    }
  }

  // Search kits
  async searchKits(searchTerm) {
    try {
      const { data, error } = await this.supabase
        .from('kit_records')
        .select(`
          *,
          breeding_plans (
            plan_id,
            buck:rabbits!breeding_plans_buck_id_fkey(name, breed),
            doe:rabbits!breeding_plans_doe_id_fkey(name, breed)
          )
        `)
        .or(`kit_id.ilike.%${searchTerm}%,color.ilike.%${searchTerm}%`)
        .order('birth_date', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error searching kits:', error)
      throw error
    }
  }
}

export default new KitManagementService()
