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
  lastName!: string;
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
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  // userId returned by /webauthn/login/options to avoid regenerating the challenge
  @IsNumber()
  userId!: number;

  @IsObject()
  authenticationResponse!: Record<string, unknown>;
}

export class FaceDescriptorDto {
  @IsArray()
  @IsNumber({}, { each: true })
  descriptor!: number[];
}

// Face login = second factor: password required + face descriptor optional.
// If user has a saved face and sends descriptor, it must match.
// If user has no saved face, login proceeds with password only.
export class FaceLoginDto extends LoginDto {
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  faceDescriptor?: number[];
}
