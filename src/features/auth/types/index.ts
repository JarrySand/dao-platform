export interface AuthFormData {
  email: string;
  password: string;
}

export interface SignupFormData extends AuthFormData {
  confirmPassword: string;
}

export interface ResetPasswordFormData {
  email: string;
}
