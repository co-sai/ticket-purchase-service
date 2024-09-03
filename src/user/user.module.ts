import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './controller/user.controller';
import { AuthModule } from 'src/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/user.schema';
import { UserAuthController } from './controller/user.auth.controller';
import { EventModule } from 'src/event/event.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        AuthModule,
        forwardRef(() => EventModule)
    ],
    controllers: [UserController, UserAuthController],
    providers: [UserService, AuthModule],
    exports: [UserService]
})
export class UserModule { }
