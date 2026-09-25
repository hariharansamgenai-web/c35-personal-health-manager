// Domain types for the Personal Health Manager.
// These mirror the Supabase database schema established in Phase 2.

// ── Enum-like union types (backed by CHECK constraints) ─────────────

export type Sex = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type Relationship = 'self' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other';

export type Mood = 'great' | 'good' | 'okay' | 'low' | 'poor';

export type ActivityType =
  | 'walking'
  | 'running'
  | 'cycling'
  | 'swimming'
  | 'strength'
  | 'yoga'
  | 'sports'
  | 'other';

export type ExerciseIntensity = 'low' | 'moderate' | 'high';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type GoalCategory =
  | 'exercise'
  | 'nutrition'
  | 'sleep'
  | 'weight'
  | 'mental_health'
  | 'other';

export type GoalStatus = 'active' | 'completed' | 'abandoned';

export type DocumentCategory =
  | 'lab_results'
  | 'imaging'
  | 'prescriptions'
  | 'visit_notes'
  | 'insurance'
  | 'other';

export type AchievementCategory =
  | 'exercise'
  | 'nutrition'
  | 'sleep'
  | 'streak'
  | 'goal'
  | 'other';

export type ShareStatus = 'pending' | 'active' | 'revoked';

export type SharePermission = 'read' | 'write';

export type ShareResourceType = 'all' | 'documents' | 'timeline' | 'check_ins' | 'goals';

export type DeviceType = 'apple_health' | 'google_fit' | 'fitbit' | 'garmin' | 'other';

export type AuditAction =
  | 'document_upload'
  | 'document_download'
  | 'document_delete'
  | 'share_created'
  | 'share_revoked'
  | 'data_export';

// ── Table row types ──────────────────────────────────────────────────

export interface Profile {
  id: string;
  owner_id: string;
  display_name: string;
  relationship: Relationship;
  date_of_birth: string | null;
  sex: Sex | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  profile_id: string;
  title: string;
  category: GoalCategory;
  target_value: number | null;
  current_value: number | null;
  unit: string | null;
  status: GoalStatus;
  target_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  profile_id: string;
  date: string;
  activity_type: ActivityType;
  duration_min: number;
  intensity: ExerciseIntensity | null;
  calories_burned: number | null;
  distance_km: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyCheckIn {
  id: string;
  profile_id: string;
  date: string;
  mood: Mood | null;
  energy_level: number | null;
  sleep_hours: number | null;
  stress_level: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  profile_id: string;
  name: string;
  description: string | null;
  category: AchievementCategory;
  earned_at: string;
  created_at: string;
}

export interface Food {
  id: string;
  profile_id: string;
  name: string;
  calories_per_100g: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  serving_size_g: number | null;
  created_at: string;
  updated_at: string;
}

export interface Meal {
  id: string;
  profile_id: string;
  date: string;
  meal_type: MealType;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FoodLog {
  id: string;
  meal_id: string;
  food_id: string;
  quantity_g: number;
  created_at: string;
}

export interface MedicalDocument {
  id: string;
  profile_id: string;
  file_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  category: DocumentCategory;
  description: string | null;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface MedicalShare {
  id: string;
  profile_id: string;
  shared_with_email: string;
  resource_type: ShareResourceType;
  permissions: SharePermission[];
  share_token: string;
  expires_at: string | null;
  status: ShareStatus;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  profile_id: string;
  device_type: DeviceType;
  device_name: string | null;
  sync_enabled: boolean;
  last_synced_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface AISummary {
  id: string;
  profile_id: string;
  summary_text: string;
  period_start: string;
  period_end: string;
  data_hash: string;
  generated_at: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  profile_id: string;
  actor_id: string;
  action: AuditAction;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
