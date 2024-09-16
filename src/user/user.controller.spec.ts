import { Test, TestingModule } from '@nestjs/testing';
import { UserAuthController } from './controller/user.auth.controller';
import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';
import { PurchaseService } from 'src/event/service/purchase.service';
import { InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './schema/user.schema';

describe('UserAuthController', () => {
    let userAuthController: UserAuthController;
    let userService: UserService;
    let authService: AuthService;
    let purchaseService: PurchaseService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserAuthController],
            providers: [
                UserService,
                {
                    provide: getModelToken(User.name),
                    useValue: jest.fn(),
                },
                {
                    provide: AuthService,
                    useValue: {
                        generateToken: jest.fn(),
                    },
                },
                {
                    provide: PurchaseService,
                    useValue: {
                        createEmptyPurchase: jest.fn(),
                    },
                },
            ],
        }).compile();

        userAuthController = module.get<UserAuthController>(UserAuthController);
        userService = module.get<UserService>(UserService);
        authService = module.get<AuthService>(AuthService);
        purchaseService = module.get<PurchaseService>(PurchaseService);
    });

    it('should sign up a user successfully', async () => {
        const createUserDto: CreateUserDto = {
            name: "test",
            email: 'test@example.com',
            password: 'test1234',
        };

        const mockUser = {
            _id: '1',
            email: createUserDto.email,
            password: 'hashedPassword',
            toJSON: jest.fn().mockReturnValue({
                _id: '1',
                email: 'test@example.com',
            }),
        };

        jest.spyOn(userService, 'findByEmail').mockResolvedValue(null);
        jest.spyOn(userService, 'signUp').mockResolvedValue(mockUser as any);
        jest.spyOn(authService, 'generateToken').mockResolvedValue({ access_token: 'mockToken' });
        jest.spyOn(purchaseService, 'createEmptyPurchase').mockResolvedValue(null);

        const result = await userAuthController.signup(createUserDto);

        expect(userService.findByEmail).toHaveBeenCalledWith(createUserDto.email);
        expect(userService.signUp).toHaveBeenCalledWith(createUserDto);
        expect(authService.generateToken).toHaveBeenCalledWith(mockUser);
        expect(purchaseService.createEmptyPurchase).toHaveBeenCalledWith(mockUser._id.toString());
        expect(result).toEqual({
            data: {
                user: { _id: '1', email: 'test@example.com' },
                access_token: 'mockToken',
            },
        });
    });

    it('should throw an error if email is already registered', async () => {
        const createUserDto: CreateUserDto = {
            name: "test",
            email: 'test@example.com',
            password: 'test1234',
        };

        jest.spyOn(userService, 'findByEmail').mockResolvedValue({} as any);

        await expect(userAuthController.signup(createUserDto)).rejects.toThrow(
            new InternalServerErrorException('Email is already registered.'),
        );
    });

    it('should return user and access token on successful sign in', async () => {
        const signInDto = { email: 'test@example.com', password: 'password123' };
        const mockUser = {
            _id: 'user-id',
            email: 'test@example.com',
            password: 'hashed-password',
            toJSON: jest.fn().mockReturnValue({
                _id: 'user-id',
                email: 'test@example.com',
            }),
        };

        const mockAccessToken = 'mock-access-token';

        jest.spyOn(userService, 'signIn').mockResolvedValue(mockUser as any);
        jest.spyOn(authService, 'generateToken').mockResolvedValue({ access_token: mockAccessToken });

        const result = await userAuthController.signIn(signInDto);

        expect(result).toEqual({
            data: {
                user: {
                    _id: 'user-id',
                    email: 'test@example.com',
                },
                access_token: mockAccessToken,
            },
        });
    });

});
