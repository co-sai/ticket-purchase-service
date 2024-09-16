import {
    Body,
    Controller,
    HttpCode,
    InternalServerErrorException,
    Post,
} from '@nestjs/common';
import { UserService } from '../user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { AuthService } from '../../auth/auth.service';
import { PurchaseService } from 'src/event/service/purchase.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('User Authentication API')
@Controller({ path: 'auth/user', version: '1' })
export class UserAuthController {
    constructor(
        private readonly userService: UserService,
        private readonly authService: AuthService,
        private readonly purchaseService: PurchaseService
    ) { }

    @Post('signup')
    @HttpCode(201)
    @ApiOperation({ summary: 'User Register' })
    @ApiResponse({ status: 201 })
    @ApiBody({ type: CreateUserDto })
    async signup(@Body() body: CreateUserDto) {
        if (body.email) {
            const exUser = await this.userService.findByEmail(body.email);
            if (exUser) {
                throw new InternalServerErrorException(
                    'Email is already registered.',
                );
            }
        }

        const user = await this.userService.signUp(body);
        const { password, ...result } = user.toJSON();

        const { access_token } = await this.authService.generateToken(user);
        await this.purchaseService.createEmptyPurchase(user._id as string);
        return {
            data: {
                user: result,
                access_token,
            },
        };
    }

    @Post('signin')
    @HttpCode(200)
    @ApiOperation({ summary: 'User Login' })
    @ApiResponse({ status: 200 })
    @ApiBody({
        description: 'User login data',
        required: true,
        examples: {
            example1: {
                summary: 'User login example',
                value: {
                    email: 'john@gmail.com',
                    password: 'password@123',
                },
            },
        },
    })
    async signIn(@Body() body: { email: string; password: string }) {
        const user = await this.userService.signIn(body);
        if (!user) {
            throw new InternalServerErrorException('Account not found.');
        }
        const { access_token } = await this.authService.generateToken(user);
        const { password, ...result } = user.toJSON();

        return {
            data: {
                user: result,
                access_token,
            },
        };
    }
}
