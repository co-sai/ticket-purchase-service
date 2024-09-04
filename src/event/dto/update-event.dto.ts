import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './create-event.dto';
import { IsDate, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateEventDto extends PartialType(CreateEventDto) {
    @ApiProperty({ example: 'Update Swagger Event' })
    @IsOptional()
    @IsNotEmpty()
    name?: string;

    @ApiProperty({ example: '2024-09-04' })
    @IsDate()
    @IsNotEmpty()
    @Type(() => Date)
    date?: Date;

    @ApiProperty({ example: '10:00 PM' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d) (AM|PM)$/i, {
        message: 'Time must be in the format HH:MM AM/PM',
    })
    time?: string;

    @ApiProperty({ example: 'Bangkok' })
    @IsOptional()
    @IsNotEmpty()
    venue?: string;
}
