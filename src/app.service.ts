import { Injectable, ConsoleLogger } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly logger = new ConsoleLogger(AppService.name);

  getHello() {
    return {
      name: process.env.APP_NAME,
      version: process.env.APP_VERSION,
    };
  }
}
