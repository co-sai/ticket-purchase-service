import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePurchaseDto {
    @ApiProperty({ example: 'event _id' })
    @IsString()
    @IsNotEmpty()
    event_id: string;

    @ApiProperty({ example: 'ticket _id' })
    @IsString()
    @IsNotEmpty()
    ticket_id: string;

    @ApiProperty({ example: 'user _id' })
    @IsString()
    @IsNotEmpty()
    user_id: string;
}
