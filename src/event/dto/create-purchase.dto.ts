import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePurchaseDto {
    @IsString()
    @IsNotEmpty()
    event_id: string;

    @IsString()
    @IsNotEmpty()
    ticket_id: string;

    @IsString()
    @IsNotEmpty()
    user_id: string;
}
