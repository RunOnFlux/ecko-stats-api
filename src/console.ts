import { BootstrapConsole } from 'nestjs-console';
import { AppModule } from './app.module';

const bootstrap = new BootstrapConsole({
  module: AppModule,
  useDecorators: true,
});
bootstrap.init().then(async (app) => {
  try {
    // init your app
    await app.init();
    // boot the cli
    await bootstrap.boot();
    app.close();
    process.exit(0);
  } catch (e) {
    process.exit(1);
  }
});
