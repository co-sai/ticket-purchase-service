import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

function toLower(val: string): string {
    return val.toLowerCase();
}

@Schema({ timestamps: true })
export class Event extends Document {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    date: Date;

    @Prop({ required: true })
    time: String; // Store time as a Date object with a fixed date

    @Prop({ required: true })
    venue: string;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    })
    user_id: mongoose.Types.ObjectId;
}
export const EventSchema = SchemaFactory.createForClass(Event);
