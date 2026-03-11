import { IsEmail, IsString, MinLength, Matches, IsIn } from 'class-validator';

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
}

export class UpdateRoleDto {
  @IsIn(['user', 'admin'], { message: 'Rol inválido. Valores permitidos: user, admin' })
  role!: string;
}
