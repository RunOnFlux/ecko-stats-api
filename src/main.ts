import { Logger, ValidationPipe } from '@nestjs/common';
import { NestApplication, NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  let httpsOptions = null;
  if (process.env.SSL_PRIV_KEY_PEM && process.env.SSL_FULL_CHAIN_PEM) {
    const privKeyPath = join(__dirname, process.env.SSL_PRIV_KEY_PEM);
    const fullChainPath = join(__dirname, process.env.SSL_FULL_CHAIN_PEM);
    httpsOptions = {
      key: fs.readFileSync(privKeyPath),
      cert: fs.readFileSync(fullChainPath),
    };
    Logger.log(
      `SSL_PRIV_KEY_PEM at ${privKeyPath} ${
        fs.existsSync(privKeyPath) ? 'FOUND' : 'NOT FOUND'
      }`,
    );
    Logger.log(
      `SSL_FULL_CHAIN_PEM at ${fullChainPath} ${
        fs.existsSync(fullChainPath) ? 'FOUND' : 'NOT FOUND'
      }`,
    );
  }
  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });

  const config = new DocumentBuilder()
    .setTitle('Kaddex Stats API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  await app.listen(process.env.PORT);
  Logger.log(
    `Running process on port ${process.env.PORT}`,
    NestApplication.name,
  );
}
bootstrap();
