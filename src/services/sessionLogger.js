import { supabase } from '@/supabase'

/**
 * Session Logger Service
 * Handles logging user login sessions with detailed information
 */
class SessionLogger {
  /**
   * Parse user agent string to extract browser, OS, and device information
   */
  parseUserAgent(userAgent) {
    const ua = userAgent || navigator.userAgent

    // Detect browser
    let browser = 'Unknown'
    if (ua.indexOf('Firefox') > -1) {
      browser = 'Firefox'
    } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
      browser = 'Opera'
    } else if (ua.indexOf('Trident') > -1) {
      browser = 'Internet Explorer'
    } else if (ua.indexOf('Edge') > -1) {
      browser = 'Edge'
    } else if (ua.indexOf('Chrome') > -1) {
      browser = 'Chrome'
    } else if (ua.indexOf('Safari') > -1) {
      browser = 'Safari'
    }

    // Detect OS
    let os = 'Unknown'
    if (ua.indexOf('Win') > -1) {
      os = 'Windows'
    } else if (ua.indexOf('Mac') > -1) {
      os = 'MacOS'
    } else if (ua.indexOf('Linux') > -1) {
      os = 'Linux'
    } else if (ua.indexOf('Android') > -1) {
      os = 'Android'
    } else if (ua.indexOf('like Mac') > -1) {
      os = 'iOS'
    }

    // Detect device type
    let device = 'Desktop'
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      device = 'Tablet'
    } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      device = 'Mobile'
    }

    return { browser, os, device }
  }

  /**
   * Get client IP address and location information
   * Uses ipapi.co for geolocation (free tier: 1000 requests/day)
   */
  async getLocationInfo() {
    try {
      const response = await fetch('https://ipapi.co/json/')
      if (response.ok) {
        const data = await response.json()
        return {
          ip_address: data.ip,
          country: data.country_name,
          city: data.city,
          region: data.region,
          timezone: data.timezone
        }
      }
    } catch (error) {
      console.error('Error fetching location info:', error)
    }
    
    // Fallback: try to get just IP from a simpler service
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      if (response.ok) {
        const data = await response.json()
        return {
          ip_address: data.ip,
          country: null,
          city: null,
          region: null,
          timezone: null
        }
      }
    } catch (error) {
      console.error('Error fetching IP:', error)
    }

    return {
      ip_address: null,
      country: null,
      city: null,
      region: null,
      timezone: null
    }
  }

  /**
   * Log a new user session
   * @param {Object} user - Supabase user object
   * @param {String} sessionId - Supabase session ID (optional)
   * @returns {Object} Session record
   */
  async logSession(user, sessionId = null) {
    try {
      // Get user agent info
      const { browser, os, device } = this.parseUserAgent()
      const userAgent = navigator.userAgent

      // Get location info (runs in background)
      const locationInfo = await this.getLocationInfo()

      // Prepare session data
      const sessionData = {
        user_id: user.id,
        email: user.email,
        session_id: sessionId,
        login_time: new Date().toISOString(),
        user_agent: userAgent,
        browser,
        os,
        device,
        ...locationInfo,
        login_method: 'password',
        is_active: true
      }

      // Insert session into database
      const { data, error } = await supabase
        .from('user_sessions')
        .insert([sessionData])
        .select()
        .single()

      if (error) {
        console.error('Error logging session:', error)
        return null
      }

      console.log('Session logged successfully:', data.id)
      return data
    } catch (error) {
      console.error('Error in logSession:', error)
      return null
    }
  }

  /**
   * Update session on logout
   * @param {String} sessionId - Session ID to update
   */
  async logLogout(sessionId) {
    try {
      if (!sessionId) {
        // If no specific session ID, mark all active sessions for current user as inactive
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
          .from('user_sessions')
          .update({
            logout_time: new Date().toISOString(),
            is_active: false
          })
          .eq('user_id', user.id)
          .eq('is_active', true)

        if (error) {
          console.error('Error updating session on logout:', error)
        }
      } else {
        // Update specific session
        const { error } = await supabase
          .from('user_sessions')
          .update({
            logout_time: new Date().toISOString(),
            is_active: false
          })
          .eq('session_id', sessionId)

        if (error) {
          console.error('Error updating session on logout:', error)
        }
      }
    } catch (error) {
      console.error('Error in logLogout:', error)
    }
  }

  /**
   * Get all sessions for current user
   * @param {Number} limit - Number of sessions to retrieve
   * @returns {Array} Array of session records
   */
  async getUserSessions(limit = 10) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('login_time', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching user sessions:', error)
        return []
      }

      return data
    } catch (error) {
      console.error('Error in getUserSessions:', error)
      return []
    }
  }

  /**
   * Get all active sessions for current user
   * @returns {Array} Array of active session records
   */
  async getActiveSessions() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('login_time', { ascending: false })

      if (error) {
        console.error('Error fetching active sessions:', error)
        return []
      }

      return data
    } catch (error) {
      console.error('Error in getActiveSessions:', error)
      return []
    }
  }
}

export default new SessionLogger()

