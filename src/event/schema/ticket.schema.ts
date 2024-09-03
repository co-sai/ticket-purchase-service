import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export enum CATEGORY {
    VIP = 'VIP',
    GENERAL_ADMISSION = 'General Admission',
}

@Schema({ timestamps: true })
export class Ticket extends Document {
    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    })
    event_id: mongoose.Types.ObjectId;

    @Prop({ required: true, default: CATEGORY.GENERAL_ADMISSION })
    category: CATEGORY;

    @Prop({ required: true })
    price: number;

    @Prop({ required: true })
    available_ticket: number;
}
export const TicketSchema = SchemaFactory.createForClass(Ticket);
