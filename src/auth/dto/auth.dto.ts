import { IsArray, IsEmail, IsIn, IsNumber, IsObject, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
  })
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  apellidoPaterno!: string;

  @IsString()
  apellidoMaterno!: string;

  @IsOptional()
  @IsString()
  recaptchaToken?: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @IsString()
  password!: string;

  @IsString()
  recaptchaToken!: string;
}

export class UpdateRoleDto {
  @IsIn(['user', 'admin'], { message: 'Rol inválido. Valores permitidos: user, admin' })
  role!: string;
}

// ── Biometric DTOs ───────────────────────────────────────────────────────

export class WebAuthnVerifyRegistrationDto {
  @IsObject()
  registrationResponse!: Record<string, unknown>;
}

export class WebAuthnVerifyAuthDto {
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  // Optional: returned by /webauthn/login/options when email is provided.
  // If absent, backend resolves user from credential ID (discoverable credentials flow).
  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsObject()
  authenticationResponse!: Record<string, unknown>;
}

export class FaceDescriptorDto {
  @IsArray()
  @IsNumber({}, { each: true })
  descriptor!: number[];
}

// Face login = second factor: password required + face descriptor optional.
export class FaceLoginDto extends LoginDto {
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  faceDescriptor?: number[];
}

// Face-only login: requires email to narrow search to single user.
export class FaceOnlyLoginDto {
  @IsEmail({}, { message: 'Email invalido' })
  email!: string;

  @IsArray()
  @IsNumber({}, { each: true })
  faceDescriptor!: number[];
}

// ── Email Verification + Password Reset DTOs ──────────────────────────────

/**
 * Solo acepta type: 'email' — el tipo correcto para confirmación de cuenta
 * via token_hash. Impide que un token de recovery active una cuenta.
 */
export class VerifyEmailDto {
  @IsString()
  token_hash!: string;

  @IsIn(['email'])
  type!: 'email';
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  token_hash!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
  })
  newPassword!: string;
}

export class ResendVerificationDto {
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;
}
