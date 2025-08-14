import { supabase } from '@/supabase'

class UserProfileService {
  constructor() {
    this.supabase = supabase
  }

  async getCurrentUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('No authenticated user found')
      }

             // Get user profile from profiles table
       const { data: profiles, error: profileError } = await supabase
         .from('profiles')
         .select(`
           id,
           first_name,
           last_name,
           phone,
           organization,
           avatar_url,
           role_id,
           roles (
             name
           )
         `)
         .eq('user_id', user.id)
         .single()

      if (profileError) throw profileError

      if (!profiles) {
        throw new Error('Profile not found')
      }

      return {
        id: user.id,
        email: user.email,
        firstName: profiles.first_name,
        lastName: profiles.last_name,
        fullName: `${profiles.first_name} ${profiles.last_name}`,
        phone: profiles.phone || '',
        organization: profiles.organization || '',
        role: profiles.roles?.name || 'USER',
        avatarUrl: profiles.avatar_url || null,
        roleId: profiles.role_id
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      throw error
    }
  }

  async updateUserProfile(profileData) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('No authenticated user found')
      }

             const { error } = await supabase
         .from('profiles')
         .update({
           first_name: profileData.firstName,
           last_name: profileData.lastName,
           phone: profileData.phone,
           organization: profileData.organization,
           avatar_url: profileData.avatarUrl,
           updated_at: new Date().toISOString()
         })
         .eq('user_id', user.id)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  }

  async updateUserPassword(currentPassword, newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error updating password:', error)
      throw error
    }
  }

  async getUserPreferences() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('No authenticated user found')
      }

      // Use the get_user_preferences function which returns existing prefs or creates defaults
      const { data, error } = await supabase.rpc('get_user_preferences', {
        user_uuid: user.id
      })

      if (error) throw error

      return data && data.length > 0 ? data[0] : null
    } catch (error) {
      console.error('Error fetching user preferences:', error)
      throw error
    }
  }

  async updateUserPreferences(preferences) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('No authenticated user found')
      }

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error updating user preferences:', error)
      throw error
    }
  }
}

export default new UserProfileService()
