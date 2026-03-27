import { IsArray, IsEmail, IsIn, IsNumber, IsObject, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'usuario@ejemplo.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @ApiProperty({ example: 'MiPass123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
  })
  password!: string;

  @ApiProperty({ example: 'María' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'García' })
  @IsString()
  apellidoPaterno!: string;

  @ApiProperty({ example: 'López' })
  @IsString()
  apellidoMaterno!: string;

  @ApiPropertyOptional({ description: 'Token de reCAPTCHA v3' })
  @IsOptional()
  @IsString()
  recaptchaToken?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'usuario@ejemplo.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @ApiProperty({ example: 'MiPass123' })
  @IsString()
  password!: string;

  @ApiProperty({ description: 'Token de reCAPTCHA v3' })
  @IsString()
  recaptchaToken!: string;
}

export class UpdateRoleDto {
  @ApiProperty({ enum: ['user', 'admin'], example: 'admin' })
  @IsIn(['user', 'admin'], { message: 'Rol inválido. Valores permitidos: user, admin' })
  role!: string;
}

// ── Biometric DTOs ───────────────────────────────────────────────────────

export class WebAuthnVerifyRegistrationDto {
  @ApiProperty({ description: 'Respuesta de registro del navegador (RegistrationResponseJSON)' })
  @IsObject()
  registrationResponse!: Record<string, unknown>;
}

export class WebAuthnVerifyAuthDto {
  @ApiPropertyOptional({ example: 'usuario@ejemplo.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @ApiPropertyOptional({ description: 'ID del usuario (opcional para discoverable credentials)' })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiProperty({ description: 'Respuesta de autenticación del navegador (AuthenticationResponseJSON)' })
  @IsObject()
  authenticationResponse!: Record<string, unknown>;
}

export class FaceDescriptorDto {
  @ApiProperty({ description: 'Array de 128 valores numéricos del descriptor facial', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  descriptor!: number[];
}

// Face login = second factor: password required + face descriptor optional.
export class FaceLoginDto extends LoginDto {
  @ApiPropertyOptional({ description: 'Descriptor facial para verificación (opcional)', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  faceDescriptor?: number[];
}

// Face-only login: requires email to narrow search to single user.
export class FaceOnlyLoginDto {
  @ApiProperty({ example: 'usuario@ejemplo.com' })
  @IsEmail({}, { message: 'Email invalido' })
  email!: string;

  @ApiProperty({ description: 'Descriptor facial de 128 valores', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  faceDescriptor!: number[];
}

// ── Email Verification + Password Reset DTOs ──────────────────────────────

export class VerifyEmailDto {
  @ApiProperty({ description: 'Hash del token de verificación de Supabase' })
  @IsString()
  token_hash!: string;

  @ApiProperty({ enum: ['email'], default: 'email' })
  @IsIn(['email'])
  type!: 'email';
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'usuario@ejemplo.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Hash del token de recuperación de Supabase' })
  @IsString()
  token_hash!: string;

  @ApiProperty({ example: 'NuevaPass123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
  })
  newPassword!: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: 'usuario@ejemplo.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;
}
