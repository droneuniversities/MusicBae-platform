// ===== UTILITY FUNCTIONS =====

// Utility to generate slugs from artist names
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Utility to find artist by slug
function findArtistBySlug(slug) {
  return mockDB.users.find(
    (u) => u.role === 'artist' && slugify(u.name) === slug
  );
}

// Avatar URL helper - ensures consistent handling of artist profile pictures
function getAvatarURL(avatar, fallback = null) {
  if (!avatar) {
    return fallback || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face';
  }
  
  // If it's already a full HTTP/HTTPS URL, return as-is
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  
  // If it's a blob URL (temporary upload preview), return as-is
  if (avatar.startsWith('blob:')) {
    return avatar;
  }
  
  // If it's a local upload path, construct the full URL
  if (avatar.startsWith('/uploads/')) {
    return window.api ? window.api.getFileURL(avatar) : `http://localhost:5001${avatar}`;
  }
  
  // If it's just a filename, assume it's in uploads/images
  if (avatar && !avatar.includes('/')) {
    return window.api ? window.api.getFileURL(`/uploads/images/${avatar}`) : `http://localhost:5001/uploads/images/${avatar}`;
  }
  
  // Default fallback
  return fallback || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face';
}

// Currency formatter
function formatCurrency(amount) {
  // Handle undefined, null, or non-numeric values
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '$0.00';
  }
  
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(num);
}

// Number formatter
function formatNumber(num) {
  // Handle undefined, null, or non-numeric values
  if (num === undefined || num === null || isNaN(num)) {
    return '0';
  }
  
  const numericValue = Number(num);
  
  if (numericValue >= 1000000) {
    return (numericValue / 1000000).toFixed(1) + 'M';
  } else if (numericValue >= 1000) {
    return (numericValue / 1000).toFixed(1) + 'K';
  }
  return numericValue.toString();
}

// Duration formatter (seconds to mm:ss)
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Make functions globally available
window.slugify = slugify;
window.findArtistBySlug = findArtistBySlug;
window.getAvatarURL = getAvatarURL;
window.formatCurrency = formatCurrency;
window.formatNumber = formatNumber;
window.formatDuration = formatDuration; 