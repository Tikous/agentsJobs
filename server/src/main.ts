import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Enable CORS
  app.enableCors();

  // Set global prefix
  app.setGlobalPrefix('api');

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Agents & Jobs API')
    .setDescription('API documentation for Agents and Jobs management system')
    .setVersion('1.0')
    .addTag('agents', 'Agent management operations')
    .addTag('jobs', 'Job management operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Get port from environment variable or use default
  const port = process.env.PORT || 3000;

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(
    `Swagger documentation available at: http://localhost:${port}/api`,
  );
}
void bootstrap();
