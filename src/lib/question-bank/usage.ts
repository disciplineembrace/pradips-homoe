/**
 * Question Bank — Daily Usage Tracking
 *
 * Tracks how many MCQs a user has generated today.
 * Free users: 25/day limit. Premium users: unlimited.
 *
 * Uses Supabase when configured, falls back to in-memory otherwise.
 */
import { isSupabaseServerConfigured, getSupabaseServerClient } from '@/database/supabase/client';

export const FREE_DAILY_LIMIT = 25;

// In-memory fallback (resets on serverless cold start — acceptable)
const _memoryUsage: Record<string, { date: string; generated: number; attempted: number }> = {};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Check if a user has premium access.
 * Currently: admin role = premium. Can be extended with a separate premium flag.
 */
export function isPremiumUser(user: { role?: string; [key: string]: any }): boolean {
  return user?.role === 'admin' || user?.role === 'staff';
  // Future: check user.premiumUntil or a premium flag in user_profiles
}

/**
 * Get today's usage count for a user.
 */
export async function getDailyUsage(userId: string): Promise<{ generated: number; attempted: number }> {
  const today = todayStr();

  if (isSupabaseServerConfigured()) {
    try {
      const client = getSupabaseServerClient()!;
      const { data, error } = await client
        .from('mcq_daily_usage')
        .select('questions_generated, questions_attempted')
        .eq('user_id', userId)
        .eq('usage_date', today)
        .maybeSingle();
      if (error) throw error;
      return {
        generated: data?.questions_generated || 0,
        attempted: data?.questions_attempted || 0,
      };
    } catch {
      // Fall back to memory
    }
  }

  // Memory fallback
  const mem = _memoryUsage[userId];
  if (!mem || mem.date !== today) {
    _memoryUsage[userId] = { date: today, generated: 0, attempted: 0 };
    return { generated: 0, attempted: 0 };
  }
  return { generated: mem.generated, attempted: mem.attempted };
}

/**
 * Increment today's usage count for a user.
 */
export async function incrementDailyUsage(userId: string, generatedCount: number): Promise<void> {
  const today = todayStr();

  if (isSupabaseServerConfigured()) {
    try {
      const client = getSupabaseServerClient()!;
      // Try to fetch existing record
      const { data: existing } = await client
        .from('mcq_daily_usage')
        .select('questions_generated')
        .eq('user_id', userId)
        .eq('usage_date', today)
        .maybeSingle();

      if (existing) {
        // Update existing
        const newCount = (existing.questions_generated || 0) + generatedCount;
        const { error } = await client
          .from('mcq_daily_usage')
          .update({ questions_generated: newCount, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('usage_date', today);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await client
          .from('mcq_daily_usage')
          .insert({
            user_id: userId,
            usage_date: today,
            questions_generated: generatedCount,
            questions_attempted: 0,
            is_premium: false,
          });
        if (error) throw error;
      }
      return;
    } catch {
      // Fall back to memory
    }
  }

  // Memory fallback
  const mem = _memoryUsage[userId];
  if (!mem || mem.date !== today) {
    _memoryUsage[userId] = { date: today, generated: generatedCount, attempted: 0 };
  } else {
    mem.generated += generatedCount;
  }
}

/**
 * Record an attempt (when user answers a question).
 */
export async function recordAttempt(userId: string, _questionId: string): Promise<void> {
  const today = todayStr();

  if (isSupabaseServerConfigured()) {
    try {
      const client = getSupabaseServerClient()!;
      const { data: existing } = await client
        .from('mcq_daily_usage')
        .select('questions_attempted')
        .eq('user_id', userId)
        .eq('usage_date', today)
        .maybeSingle();

      if (existing) {
        const newCount = (existing.questions_attempted || 0) + 1;
        await client
          .from('mcq_daily_usage')
          .update({ questions_attempted: newCount, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('usage_date', today);
      }
      return;
    } catch {
      // Fall back
    }
  }

  // Memory fallback
  const mem = _memoryUsage[userId];
  if (mem && mem.date === today) {
    mem.attempted += 1;
  }
}
