import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Purchase extends Document {
    
    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    })
    user_id: mongoose.Types.ObjectId;

    @Prop({ 
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseItem' }]
    })
    purchase_items: mongoose.Types.ObjectId[];

    @Prop({ default: 0 })
    total_price: number;

}

export const PurchaseSchema = SchemaFactory.createForClass(Purchase);
