import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './controller/user.controller';
import { AuthModule } from 'src/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/user.schema';
import { UserAuthController } from './controller/user.auth.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    AuthModule,
  ],
  controllers: [UserController, UserAuthController],
  providers: [UserService, AuthModule],
})
export class UserModule { }
