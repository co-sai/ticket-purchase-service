import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class PurchaseItem extends Document {
    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        required: true,
    })
    ticket_id: mongoose.Types.ObjectId;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    })
    user_id: mongoose.Types.ObjectId;

    @Prop({ required: true })
    quantity: number;

    @Prop({ required: true })
    unit_price: number;

    @Prop({ required: true })
    total_price: number;

    @Prop({ default: Date.now })
    purchase_date: Date;
}

export const PurchaseItemSchema = SchemaFactory.createForClass(PurchaseItem);
