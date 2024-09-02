import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

function toLower(val: string): string {
    return val.toLowerCase();
}

@Schema({ timestamps: true })
export class User extends Document {
    @Prop({ required: true })
    name: string;

    @Prop({ unique: true, set: toLower, sparse: true })
    email: string;

    @Prop({ required: true })
    password: string;
}
export const UserSchema = SchemaFactory.createForClass(User);
