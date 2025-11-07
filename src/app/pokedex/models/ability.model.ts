export interface Ability {
  id: number;
  slug: string;
  name: string;
  battleEffectCondition?: string | null;
  battleEffectShort?: string | null;
  battleEffectLong?: string | null;
  fieldEffectCondition?: string | null;
  fieldEffectLong?: string | null;
  description?: string | null;
}