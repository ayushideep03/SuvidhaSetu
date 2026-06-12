export interface UserProfile {
  applicant_type: "individual" | "business" | "family";
  state: string;
  age?: number;
  gender?: "male" | "female" | "trans" | "any";
  caste?: "general" | "obc" | "sc" | "st" | "ews" | "any";
  income_band?: "below_1l" | "1l_to_3l" | "3l_to_5l" | "5l_to_8l" | "above_8l";
  occupation?: string;
  student_level?: string;
  course?: string;
  stream?: string;
  branch?: string;
  engg_interests?: string[];
  phd_field?: string;
  student_trade?: string;
  marks?: number;
  achievements?: string[];
  special_status?: string[];
  farming_activity?: string[];
  land_size?: string;
  kcc_status?: boolean | string;
  biz_size?: string;
  sector?: string;
  udyam?: boolean | string;
  owner_bg?: string;
  benefit_preferences?: string[];
  sector_preferences?: string[];
}

export interface SchemeCard {
  slug: string;
  scheme_name: string;
  ministry: string;
  state: string | null;
  score: number;
  monetary_benefit: string | null;
  brief_description: string;
  tags: string[];
  category: string;
  matched?: string[];
  gaps?: string[];
}

export interface SchemeDetail {
  slug: string;
  scheme_name: string;
  ministry: string;
  state: string | null;
  score: number;
  brief_description: string;
  eligibility_md: string;
  benefits_md: string;
  exclusions_md: string | null;
  documents_required_md: string | null;
  application_process: ApplicationStep[];
  official_url: string | null;
  tags: string[];
  implementing_agency: string | null;
  matched_criteria: string[];
  eligibility_grid: EligibilityCell[];
  monetary_benefit: string | null;
}

export interface ApplicationStep {
  step: number;
  description: string;
  mode?: string;
}

export interface EligibilityCell {
  label: string;
  status: "match" | "no-requirement" | "missing";
  detail?: string;
}

export interface RankResult {
  schemes: SchemeCard[];
  total: number;
  profile_summary: string;
}

export interface BrowseResult {
  schemes: BrowseSchemeCard[];
  total: number;
  page: number;
  per_page: number;
}

export interface BrowseSchemeCard {
  slug: string;
  scheme_name: string;
  ministry: string | null;
  state: string | null;
  level: "State" | "Central";
  category: string;
  brief_description: string;
  tags: string[];
}

export interface InsightStats {
  total_schemes: number;
  state_schemes: number;
  central_schemes: number;
  student_schemes: number;
  farmer_schemes: number;
  women_specific: number;
  states_covered: number;
}

export type QuestionType =
  | "single_choice"
  | "multi_select"
  | "number_input"
  | "state_search";

export interface QuestionOption {
  value: string;
  label: string;
  hindiLabel?: string;
  emoji?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  hindiPrompt?: string;
  options?: QuestionOption[];
  min?: number;
  max?: number;
  unit?: string;
  profileKey: keyof UserProfile | string;
  nextFn?: (value: unknown) => string | null;
  optional?: boolean;
  multiKey?: string; // for multi_select → array fields
}
