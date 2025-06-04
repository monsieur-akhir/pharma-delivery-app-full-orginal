export interface Users {
  id?: number;
  username: string;
  email?: string;
  phone?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  role: string;
  password_hash?: string;
  is_active?: boolean;
  address?: string;
  avatar_url?: string;
  created_at?: Date;
  updated_at?: Date;
  last_login_at?: Date;
  reset_token?: string;
  reset_token_expires?: Date;
  preferences?: any;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

export interface CreateUserDto extends Omit<Users, 'id' | 'created_at' | 'updated_at' | 'password_hash'> {
  password: string;
}

export interface UpdateUserDto extends Partial<Omit<Users, 'id' | 'password_hash'>> {
  password?: string;
}