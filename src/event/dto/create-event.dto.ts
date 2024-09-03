import { Type } from 'class-transformer';
import { IsDate, IsDateString, isDateString, IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateEventDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsDate()
    @IsNotEmpty()
    @Type(() => Date)
    date: Date;

    @IsString()
    @IsNotEmpty()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d) (AM|PM)$/i, {
        message: 'Time must be in the format HH:MM AM/PM',
    })
    time: string;

    @IsString()
    @IsNotEmpty()
    venue: string;
}
