import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({ example: 'John' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'john@gmail.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'password@123' })
    @IsNotEmpty()
    @IsString()
    password: string;
}
