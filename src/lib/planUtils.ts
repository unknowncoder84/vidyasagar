// Plan gating utilities for Vidyasagar Sir
// Plans (low -> high): trial, basic, pro, advanced, custom
// A feature requiring `pro` is unlocked for pro, advanced, and custom.

export type Plan = 'trial' | 'basic' | 'pro' | 'advanced' | 'custom';

// Numeric rank — higher tiers include everything in lower tiers
const PLAN_RANK: Record<Plan, number> = {
  trial: 0,
  basic: 1,
  pro: 2,
  advanced: 3,
  custom: 4,
};

/**
 * DISABLED: subscription gating is turned off app-wide — every feature is
 * free/unlocked regardless of plan. (Original rank-comparison logic kept
 * below, commented out, so this can be re-enabled later without rewriting it.)
 */
export const canAccess = (
  _userPlan: string | null | undefined,
  _requiredPlan: Plan
): boolean => {
  return true;
  // Original logic (disabled), using PLAN_RANK above:
  //   const userRank = PLAN_RANK[(_userPlan as Plan)] ?? 0;
  //   const requiredRank = PLAN_RANK[_requiredPlan] ?? 0;
  //   return userRank >= requiredRank;
};

// Keeps PLAN_RANK "used" while canAccess's real logic is disabled above,
// without deleting the lookup table (needed if this is re-enabled later).
export const _planRankTable = PLAN_RANK;

// Human-readable plan label.
// Note: the "advanced" plan is branded as "Premium" to users, while the
// underlying value stays "advanced" in the database and gating logic.
export const planLabel = (plan: string | null | undefined): string => {
  if (!plan) return 'Trial';
  if (plan === 'advanced') return 'Premium';
  return plan.charAt(0).toUpperCase() + plan.slice(1);
};
