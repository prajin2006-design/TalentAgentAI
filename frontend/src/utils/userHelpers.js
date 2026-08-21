/**
 * User and Profile helper utilities for Talent Agent AI.
 * Safely extracts display names, initials, avatar URLs, and headlines.
 */

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

  if (profile?.full_name?.trim()) {
    return profile.full_name.trim();
  }

  if (user?.name?.trim()) {
    return user.name.trim();
  }

  if (user?.displayName?.trim()) {
    return user.displayName.trim();
  }

  if (user?.full_name?.trim()) {
    return user.full_name.trim();
  }

  if (user?.email) {
    const prefix = user.email.split('@')[0];
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
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

  if (!name) return 'TA';

  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length === 1) {
    return parts[0].toUpperCase();
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
  if (profile?.avatar_url) return profile.avatar_url;
  if (profile?.avatar) return profile.avatar;
  if (user?.avatar_url) return user.avatar_url;
  if (user?.avatar) return user.avatar;
  if (user?.photoURL) return user.photoURL;
  return null;
}

/**
 * Returns the user's role, professional headline, or fallback.
 * @param {Object} user - User object
 * @param {Object} [profile] - Profile object
 * @returns {string}
 */
export function getUserRoleOrHeadline(user, profile = null) {
  if (profile?.headline?.trim()) return profile.headline.trim();
  if (profile?.target_role?.trim()) return profile.target_role.trim();
  if (profile?.preferred_role?.trim()) return profile.preferred_role.trim();
  if (profile?.current_role?.trim()) return profile.current_role.trim();
  if (user?.role === 'admin') return 'Platform Administrator';
  return 'Software Engineer';
}
