import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './create-event.dto';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateEventDto extends PartialType(CreateEventDto) {
    @IsOptional()
    @IsNotEmpty()
    name?: string;

    @IsOptional()
    @IsNotEmpty()
    date?: Date;

    @IsOptional()
    @IsNotEmpty()
    time?: string;

    @IsOptional()
    @IsNotEmpty()
    venue?: string;
}
