import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { CATEGORY } from '../schema/ticket.schema';
import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketDto } from './create-ticket.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
    @ApiProperty({ example: 'VIP', enum: CATEGORY })
    @IsEnum(CATEGORY, {
        message: `Category must be one of the following values: ${Object.values(CATEGORY).join(', ')}`,
    })
    category?: CATEGORY;

    @ApiProperty({ example: 120000 })
    @IsNumber()
    @IsNotEmpty()
    price?: number;

    @ApiProperty({ example: 200 })
    @IsNumber()
    @IsNotEmpty()
    available_ticket?: number;
}
