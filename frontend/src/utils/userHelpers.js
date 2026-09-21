/**
 * User and Profile helper utilities for Talent Agent AI.
 * Strictly guarantees primitive string/number return types.
 * Prevents any "Cannot convert object to primitive value" runtime errors.
 */

/**
 * Normalizes readiness score into a strict finite integer between 0 and 100.
 * @param {any} value
 * @returns {number}
 */
export function normalizeReadiness(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : 0;
  }
  if (typeof value === 'object') {
    try {
      if (typeof value.score === 'number') return normalizeReadiness(value.score);
      if (typeof value.readiness_score === 'number') return normalizeReadiness(value.readiness_score);
      if (typeof value.readiness === 'number') return normalizeReadiness(value.readiness);
      if (typeof value.ats_score === 'number') return normalizeReadiness(value.ats_score);
      if (typeof value.matchPercentage === 'number') return normalizeReadiness(value.matchPercentage);
      if (typeof value.match_percentage === 'number') return normalizeReadiness(value.match_percentage);
    } catch (e) {
      return 0;
    }
  }
  return 0;
}

/**
 * Safely extracts a primitive string from any input, candidate, user, error, or skill field.
 * Guarantees a primitive string return type and prevents "Cannot convert object to primitive value".
 * @param {any} val
 * @param {string} fallback
 * @returns {string}
 */
export function safeString(val, fallback = '') {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (val instanceof Error) return val.message || fallback;
  if (Array.isArray(val)) {
    return val.map((item) => safeString(item)).filter(Boolean).join(', ') || fallback;
  }
  if (typeof val === 'object') {
    try {
      if (typeof val.name === 'string' && val.name.trim()) return val.name.trim();
      if (typeof val.title === 'string' && val.title.trim()) return val.title.trim();
      if (typeof val.skill_name === 'string' && val.skill_name.trim()) return val.skill_name.trim();
      if (typeof val.skill === 'string' && val.skill.trim()) return val.skill.trim();
      if (typeof val.label === 'string' && val.label.trim()) return val.label.trim();
      if (typeof val.full_name === 'string' && val.full_name.trim()) return val.full_name.trim();
      if (typeof val.company === 'string' && val.company.trim()) return val.company.trim();
      if (typeof val.message === 'string' && val.message.trim()) return val.message.trim();
      if (typeof val.error === 'string' && val.error.trim()) return val.error.trim();
      if (typeof val.text === 'string' && val.text.trim()) return val.text.trim();
      if (typeof val.description === 'string' && val.description.trim()) return val.description.trim();
      if (typeof val.role === 'string' && val.role.trim()) return val.role.trim();
    } catch (e) {
      return fallback;
    }
  }
  return fallback;
}

/**
 * Normalizes skill items into a uniform string or object structure.
 * @param {any} skill
 * @returns {string}
 */
export function normalizeSkill(skill) {
  return safeString(skill);
}

/**
 * Returns a human-friendly display name for the user/profile.
 * @param {Object|string} user - User object or display name string
 * @param {Object} [profile] - Optional candidate profile object
 * @returns {string}
 */
export function getUserDisplayName(user, profile = null) {
  if (typeof user === 'string' && user.trim()) {
    return user.trim();
  }

  if (profile && typeof profile === 'object') {
    if (typeof profile.full_name === 'string' && profile.full_name.trim()) return profile.full_name.trim();
    if (typeof profile.name === 'string' && profile.name.trim()) return profile.name.trim();
  }

  if (user && typeof user === 'object') {
    if (typeof user.full_name === 'string' && user.full_name.trim()) return user.full_name.trim();
    if (typeof user.name === 'string' && user.name.trim()) return user.name.trim();
    if (typeof user.displayName === 'string' && user.displayName.trim()) return user.displayName.trim();
    if (typeof user.email === 'string' && user.email.includes('@')) {
      const prefix = user.email.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
  }

  return 'Candidate';
}

/**
 * Generates 1-2 letter initials from a display name, user, or email.
 * @param {Object|string} input - Display name string or user object
 * @returns {string}
 */
export function getUserInitials(input) {
  if (!input) return 'TA';

  let name = '';
  if (typeof input === 'string') {
    name = input.trim();
  } else if (typeof input === 'object') {
    name = getUserDisplayName(input);
  }

  if (typeof name !== 'string' || !name.trim()) return 'TA';

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0][0] || '';
    const last = parts[parts.length - 1][0] || '';
    return (first + last).toUpperCase() || 'TA';
  }
  if (parts.length === 1 && parts[0].length >= 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return 'TA';
}

/**
 * Resolves avatar image URL if present, otherwise returns null.
 * @param {Object} user - User object
 * @param {Object} [profile] - Profile object
 * @returns {string|null}
 */
export function getUserAvatarUrl(user, profile = null) {
  if (profile && typeof profile === 'object') {
    if (typeof profile.avatar_url === 'string' && profile.avatar_url.trim()) return profile.avatar_url.trim();
    if (typeof profile.avatar === 'string' && profile.avatar.trim()) return profile.avatar.trim();
  }
  if (user && typeof user === 'object') {
    if (typeof user.avatar_url === 'string' && user.avatar_url.trim()) return user.avatar_url.trim();
    if (typeof user.avatar === 'string' && user.avatar.trim()) return user.avatar.trim();
    if (typeof user.photoURL === 'string' && user.photoURL.trim()) return user.photoURL.trim();
  }
  return null;
}

/**
 * Returns the user's role, professional headline, or fallback.
 * @param {Object} user - User object
 * @param {Object} [profile] - Profile object
 * @returns {string}
 */
export function getUserRoleOrHeadline(user, profile = null) {
  if (profile && typeof profile === 'object') {
    if (typeof profile.headline === 'string' && profile.headline.trim()) return profile.headline.trim();
    if (typeof profile.target_role === 'string' && profile.target_role.trim()) return profile.target_role.trim();
    if (typeof profile.preferred_role === 'string' && profile.preferred_role.trim()) return profile.preferred_role.trim();
    if (typeof profile.current_role === 'string' && profile.current_role.trim()) return profile.current_role.trim();
  }
  if (user && typeof user === 'object') {
    if (typeof user.headline === 'string' && user.headline.trim()) return user.headline.trim();
    if (user.role === 'admin') return 'Platform Administrator';
  }
  return 'Software Engineer';
}
