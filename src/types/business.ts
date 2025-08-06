export interface BusinessType {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface Business {
  id: string;
  user_id: string;
  name: string;
  business_type_id?: number;
  business_type?: BusinessType;
  business_type_name?: string; // From API query join
  business_type_description?: string; // From API query join
  website?: string;
  address?: string;
  google_maps_url?: string;
  description?: string;
  status: "active" | "inactive" | "pending";
  created_at: string;
  updated_at: string;
  tags?: BusinessTag[];
  phone_numbers?: BusinessPhoneNumber[];
  email_addresses?: BusinessEmailAddress[];
  metrics?: BusinessMetrics;
  total_reviews?: number;
  total_qr_scans?: number;
  average_rating?: number;
  conversion_rate?: number;
}

export interface BusinessTag {
  id: number;
  business_id: string;
  tag: string;
  created_at: string;
}

export interface BusinessPhoneNumber {
  id: number;
  business_id: string;
  phone_number: string;
  is_primary: boolean;
  label: string;
  created_at: string;
}

export interface BusinessEmailAddress {
  id: number;
  business_id: string;
  email_address: string;
  is_primary: boolean;
  label: string;
  created_at: string;
}

export interface BusinessMetrics {
  id: string;
  business_id: string;
  total_qr_scans: number;
  total_reviews: number;
  average_rating: number;
  conversion_rate: number;
  last_updated: string;
}

export interface CreateBusinessRequest {
  name: string;
  business_type_id?: number;
  website?: string;
  address?: string;
  google_maps_url?: string;
  description?: string;
  tags?: string[];
  phone_numbers?: {
    phone_number: string;
    is_primary: boolean;
    label: string;
  }[];
  email_addresses?: {
    email_address: string;
    is_primary: boolean;
    label: string;
  }[];
}

export interface UpdateBusinessRequest extends Partial<CreateBusinessRequest> {
  id: string;
  status?: "active" | "inactive" | "pending";
}

export interface BusinessListResponse {
  businesses: Business[];
  total: number;
  page: number;
  limit: number;
}
