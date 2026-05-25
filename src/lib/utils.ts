// Share to X (Twitter) with pre-filled text
export function shareToX(url: string, message: string) {
  const text = encodeURIComponent(`${message}\n\n🟦 Coinbase Community Mosaic Wall\n${url}`);
  window.open(`https://x.com/intent/tweet?text=${text}`, '_blank', 'width=600,height=400');
}

// Get Gravatar URL for a username (used for manual X username login)
export function getGravatarUrl(username: string): string {
  // Use the username as the email-ish identifier for Gravatar
  const hash = `${username.toLowerCase().trim()}@x.com`;
  return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`;
}

// Generate a consistent user ID from auth method
export function generateUserId(prefix: string, identifier: string): string {
  return `${prefix}:${identifier.toLowerCase().trim()}`;
}
