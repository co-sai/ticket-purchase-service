import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { CATEGORY } from '../schema/ticket.schema';

export class CreateTicketDto {
    @IsString()
    @IsNotEmpty()
    event_id: string;

    @IsEnum(CATEGORY, {
        message: `Category must be one of the following values: ${Object.values(CATEGORY).join(', ')}`,
    })
    category: CATEGORY;

    @IsNumber()
    @IsNotEmpty()
    price: number;

    @IsNumber()
    @IsNotEmpty()
    available_ticket: number;
}
