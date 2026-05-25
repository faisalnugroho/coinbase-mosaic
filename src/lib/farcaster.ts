'use client';

// Farcaster Mini App SDK integration
// Auto-detects if running inside a Farcaster client and provides identity

let farcasterUser: {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
} | null = null;

export async function detectFarcaster(): Promise<boolean> {
  try {
    // Dynamically import - only works inside Farcaster client
    const { sdk } = await import('@farcaster/miniapp-sdk');
    const ctx = await sdk.context;
    
    if (ctx?.user?.fid) {
      farcasterUser = {
        fid: ctx.user.fid,
        username: ctx.user.username,
        displayName: ctx.user.displayName,
        pfpUrl: ctx.user.pfpUrl,
      };
      
      // Notify Farcaster client that app is ready
      await sdk.actions.ready();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function getFarcasterUser() {
  return farcasterUser;
}

export async function shareToFarcaster(url: string, text: string) {
  try {
    const { sdk } = await import('@farcaster/miniapp-sdk');
    await sdk.actions.composeCast({
      text,
      embeds: [url],
    });
  } catch {
    // Fallback: open web composer
    window.open(
      `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(url)}`,
      '_blank'
    );
  }
}
