import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';
import { User } from './schema/user.schema';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
const scrypt = promisify(_scrypt);

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
    ){}

    async findByEmail(email: string) {
        const user = await this.userModel
            .findOne({ email: email.toLowerCase() })
            .exec();
        return user;
    }

    async signUp(body: CreateUserDto): Promise<User> {
        const salt = randomBytes(8).toString('hex');

        const hash = (await scrypt(body.password, salt, 32)) as Buffer;

        const result = salt + '.' + hash.toString('hex');

        const user = new this.userModel({
            ...body,
            password: result,
        });
        await user.save();

        return user;
    }

    async signIn(body: { email: string; password: string }) {
        const user = await this.userModel.findOne({ email: body.email.toLowerCase() });

        if (!user) {
            throw new InternalServerErrorException(
                `An account with this ${body.email} was not found. Please try a different sign in method or contact support if you are unable to access your account.`,
            );
        }

        const [salt, storedHash] = user.password.split('.');

        const hash = (await scrypt(body.password, salt, 32)) as Buffer;

        if (storedHash !== hash.toString('hex')) {
            throw new InternalServerErrorException("Invalid credentials. Please try again.");
        }
        return user;
    }
}
