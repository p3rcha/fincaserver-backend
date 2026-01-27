import { supabase } from './supabase.js';

/**
 * Player Validator
 * 
 * Validates Minecraft usernames against the whitelist table.
 * The whitelist table is empty initially and usernames are added later.
 */

/**
 * Check if a Minecraft username is in the whitelist
 */
export const isValidPlayer = async (mcName: string): Promise<boolean> => {
  if (!mcName || !mcName.trim()) {
    return false;
  }

  // Normalize MC name (trim only - keep case for display, but compare case-insensitive)
  const normalizedName = mcName.trim();

  try {
    // Use case-insensitive comparison (ILIKE for PostgreSQL)
    const { data, error } = await supabase
      .from('player_whitelist')
      .select('id')
      .ilike('mc_name', normalizedName)
      .eq('is_active', true)
      .single();

    if (error) {
      // If no rows found, that's fine - just means not whitelisted
      if (error.code === 'PGRST116') {
        return false;
      }
      // Other errors should be logged
      console.error('Error checking player whitelist:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Exception checking player whitelist:', error);
    return false;
  }
};

/**
 * Get all active whitelisted players (for admin purposes)
 */
export const getWhitelistedPlayers = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('player_whitelist')
      .select('mc_name')
      .eq('is_active', true)
      .order('mc_name', { ascending: true });

    if (error) {
      console.error('Error fetching whitelisted players:', error);
      return [];
    }

    return data?.map(row => row.mc_name) || [];
  } catch (error) {
    console.error('Exception fetching whitelisted players:', error);
    return [];
  }
};
