import type { ApiEnvelope } from 'src/module/core/features/auth/types';

// ----------------------------------------------------------------------

export type CompanyType = 'holding' | 'subsidiary';

export type Company = {
  id: string;
  parent_id: string | null;
  name: string;
  type: CompanyType;
  logo_url: string | null;
  owner_id: string | null;
  owner_name: string | null;
  sort: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CompanyListParams = {
  page?: number;
  limit?: number;
  search?: string;
  parent_id?: string;
  type?: CompanyType;
  is_active?: boolean;
};

export type CreateCompanyPayload = {
  parent_id?: string | null;
  name: string;
  type: CompanyType;
  logo_url?: string | null;
  owner_id?: string | null;
};

export type UpdateCompanyPayload = {
  name?: string;
  type?: CompanyType;
  logo_url?: string | null;
  owner_id?: string | null;
  sort?: number;
  is_active?: boolean;
};

export type CompanyListEnvelope = ApiEnvelope<Company[]>;

export type CompanyUser = {
  id: string;
  company_id: string;
  user_id: string;
  role_id?: string | null;
  role_name?: string | null;
  role_code?: string | null;
  user_email?: string | null;
  user_username?: string | null;
  user_full_name?: string | null;
  is_primary: boolean;
  is_active: boolean;
  joined_at: string;
  created_at: string;
};
