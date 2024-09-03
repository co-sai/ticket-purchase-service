import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { CATEGORY } from '../schema/ticket.schema';
import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketDto } from './create-ticket.dto';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
    @IsEnum(CATEGORY, {
        message: `Category must be one of the following values: ${Object.values(CATEGORY).join(', ')}`,
    })
    category?: CATEGORY;

    @IsNumber()
    @IsNotEmpty()
    price?: number;

    @IsNumber()
    @IsNotEmpty()
    available_ticket?: number;
}
