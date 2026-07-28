import { AppModule } from './app.module';
import { configureApp, createApp, startApp } from './config';

createApp(AppModule).then(configureApp).then(startApp);
