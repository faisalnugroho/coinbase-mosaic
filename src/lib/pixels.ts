'use client';

import { Pixel } from '@/lib/supabase';

type PixelMap = Map<string, Pixel>;

export async function fetchPixels(supabase: any): Promise<PixelMap> {
  const { data, error } = await supabase
    .from('pixels')
    .select('*')
    .eq('claimed', true);

  if (error) throw error;

  const map: PixelMap = new Map();
  for (const pixel of data) {
    map.set(`${pixel.x},${pixel.y}`, pixel);
  }
  return map;
}

export async function claimPixel(
  supabase: any,
  x: number,
  y: number,
  user_id: string,
  username: string,
  display_name: string,
  profile_pic_url: string,
  message: string
): Promise<Pixel> {
  // Check if pixel already claimed
  const { data: existing } = await supabase
    .from('pixels')
    .select('claimed')
    .eq('x', x)
    .eq('y', y)
    .single();

  if (existing?.claimed) {
    throw new Error('Pixel already claimed');
  }

  // Check if user already claimed a pixel
  const { data: userPixel } = await supabase
    .from('pixels')
    .select('id')
    .eq('user_id', user_id)
    .eq('claimed', true)
    .maybeSingle();

  if (userPixel) {
    throw new Error('You have already claimed a pixel');
  }

  // Upsert: insert or update (claim)
  const { data, error } = await supabase
    .from('pixels')
    .upsert({
      x,
      y,
      claimed: true,
      user_id,
      username,
      display_name,
      profile_pic_url,
      message: message.slice(0, 100),
      claimed_at: new Date().toISOString(),
    }, {
      onConflict: 'x,y',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
