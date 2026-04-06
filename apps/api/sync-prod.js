require('dotenv').config({path: '.env'});
const { DataSource } = require('typeorm');
const fs = require('fs');
const glob = require('glob');

async function sync() {
  const dbUrl = process.env.DATABASE_URL;
  console.log("DB URL:", dbUrl);
  
  // Need to compile TypeScript or use ts-node to load entities?
  // We can just run NestJS app context momentarily with synchronize: true by overriding process.env
  
  process.env.NODE_ENV = 'development'; // Force sync
}

sync();
