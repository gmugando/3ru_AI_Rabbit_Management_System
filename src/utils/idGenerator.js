/**
 * Generates a unique ID with a prefix and a random number
 * @param {string} prefix - The prefix to use for the ID (e.g., 'BP' for Breeding Plan)
 * @returns {string} The generated ID (e.g., 'BP-001-ABC')
 */
export function generateId(prefix) {
  //const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase()
  const number = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}-${number}-${randomStr}`
} 