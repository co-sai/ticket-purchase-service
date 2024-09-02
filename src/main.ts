import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AllExceptionsFilter } from './utils/all-exceptions.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Get the Winston logger
    const logger = app.get<Logger>(WINSTON_MODULE_PROVIDER);

    // Register the global exception filter
    app.useGlobalFilters(new AllExceptionsFilter(logger));

    // Define CORS options
    const corsOptions: CorsOptions = {
        origin: (origin, callback) => {
            if (!origin || process.env.NODE_ENV === 'development') {
                // Allow all origins in development mode
                callback(null, true);
            } else {
                const allowedOrigins = ['http://localhost:3000'];
                if (allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            }
        },
        methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS', // allow these HTTP methods
        allowedHeaders: 'Content-Type, Authorization', // allow these headers
        credentials: true,
    };

    // helmet
    app.use(helmet());

    // Enable CORS with the defined options
    app.enableCors(corsOptions);

    // Set a global prefix for all routes
    app.setGlobalPrefix('api/v1');

    await app.listen(8000);
}
bootstrap();
