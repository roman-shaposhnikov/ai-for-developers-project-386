"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const domain_exception_filter_1 = require("./controllers/filters/domain-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api/v1');
    app.enableCors();
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: (errors) => {
            const message = errors
                .map((e) => Object.values(e.constraints ?? {}).join('; '))
                .filter(Boolean)
                .join('; ') || 'Validation failed';
            return new common_1.BadRequestException({
                error: { code: 'VALIDATION_ERROR', message },
            });
        },
    }));
    app.useGlobalFilters(new domain_exception_filter_1.DomainExceptionFilter());
    await app.listen(3000);
}
bootstrap();
//# sourceMappingURL=main.js.map