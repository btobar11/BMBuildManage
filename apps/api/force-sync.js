require('dotenv').config();
const fs = require('fs');
const { NestFactory } = require('@nestjs/core');

// Override console
const logStream = fs.createWriteStream('sync_log.txt');
console.log = function (msg, ...args) { logStream.write(msg + ' ' + args.join(' ') + '\n'); };
console.error = function (msg, ...args) { logStream.write('ERROR: ' + msg + ' ' + args.join(' ') + '\n'); };

async function bootstrap() {
  process.env.NODE_ENV = 'development'; // force synchronize: true in AppModule
  try {
    const { AppModule } = require('./dist/src/app.module.js');
    const app = await NestFactory.create(AppModule, { logger: false });
    await app.init();
    console.log('Database synchronization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to sync:', JSON.stringify(error, null, 2));
    if (error.message) console.error(error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

bootstrap();
