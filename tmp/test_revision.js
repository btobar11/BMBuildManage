const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../apps/api/dist/app.module');
const { BudgetsService } = require('../apps/api/dist/modules/budgets/budgets.service');

async function run() {
  console.log('Starting Test Context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(BudgetsService);
  try {
    const budgetId = '0e723170-ac71-4af1-8a5c-d3c1b5fd039e';
    const userId = '11111111-1111-1111-1111-111111111111'; // Admin user
    let res = await service.createRevision(budgetId, userId);
    console.log('Success!', res.id);
  } catch (err) {
    console.log('--- RAW DB EXCEPTION ---');
    console.log(err.message);
    console.log(err.stack);
    console.log(JSON.stringify(err, null, 2));
  }
  await app.close();
}

run();
