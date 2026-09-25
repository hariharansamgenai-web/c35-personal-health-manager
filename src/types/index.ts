// Shared domain types for the Personal Health Manager.
// These will be expanded as features are implemented in later phases.

export type Sex = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type Mood = 'great' | 'good' | 'okay' | 'low' | 'poor';

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

export type TimelineCategory =
  | 'check_in'
  | 'exercise'
  | 'goal'
  | 'document'
  | 'nutrition'
  | 'medical_event'
  | 'manual';

export type ShareStatus = 'pending' | 'active' | 'revoked';

export type SharePermission = 'read' | 'write';

export type ShareResourceType =
  | 'profile'
  | 'documents'
  | 'timeline'
  | 'check_ins'
  | 'goals';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  date_of_birth: string | null;
  sex: Sex | null;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  owner_id: string;
  name: string;
  relationship: string;
  date_of_birth: string | null;
  sex: Sex | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckIn {
  id: string;
  user_id: string;
  family_member_id: string | null;
  date: string;
  mood: Mood | null;
  energy_level: number | null;
  sleep_hours: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  user_id: string;
  family_member_id: string | null;
  date: string;
  activity_type: string;
  duration_min: number;
  intensity: ExerciseIntensity | null;
  calories_burned: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  family_member_id: string | null;
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

export interface NutritionLog {
  id: string;
  user_id: string;
  family_member_id: string | null;
  date: string;
  meal_type: MealType;
  food_name: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  family_member_id: string | null;
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

export interface TimelineEvent {
  id: string;
  user_id: string;
  family_member_id: string | null;
  event_date: string;
  title: string;
  description: string | null;
  category: TimelineCategory;
  source_type: string;
  created_at: string;
  updated_at: string;
}

export interface Share {
  id: string;
  owner_id: string;
  shared_with_email: string;
  resource_type: ShareResourceType;
  resource_id: string | null;
  permissions: SharePermission[];
  expires_at: string | null;
  status: ShareStatus;
  created_at: string;
  updated_at: string;
}

export interface AISummary {
  id: string;
  user_id: string;
  summary_text: string;
  period_start: string;
  period_end: string;
  generated_at: string;
  data_hash: string;
  created_at: string;
}
