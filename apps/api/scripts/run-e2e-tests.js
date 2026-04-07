#!/usr/bin/env node

const { execSync } = require('child_process');
const { existsSync } = require('fs');

console.log('🚀 Starting E2E Test Setup...\n');

// Check if Docker is running
try {
  execSync('docker info', { stdio: 'pipe' });
  console.log('✅ Docker is running');
} catch {
  console.log('❌ Docker is not running. Please start Docker Desktop.');
  process.exit(1);
}

// Check if test container exists
const containerExists = execSync('docker ps -a --filter "name=bmbuild-test-db" --format "{{.Names}}"', { encoding: 'utf8' }).trim();

if (containerExists === 'bmbuild-test-db') {
  console.log('🔄 Removing existing test container...');
  execSync('docker rm -f bmbuild-test-db', { stdio: 'pipe' });
}

// Start test database
console.log('🗄️  Starting test database...');
execSync('docker compose -f ../docker-compose.test.yml up -d', { stdio: 'inherit' });

// Wait for database to be ready
console.log('⏳ Waiting for database to be ready...');
let retries = 0;
const maxRetries = 30;

while (retries < maxRetries) {
  try {
    execSync('docker exec bmbuild-test-db pg_isready -U postgres', { stdio: 'pipe' });
    console.log('✅ Database is ready!');
    break;
  } catch {
    retries++;
    process.stdout.write('.');
    execSync('sleep 1');
  }
}

if (retries === maxRetries) {
  console.log('\n❌ Database failed to start');
  process.exit(1);
}

console.log('\n🎯 Running E2E tests...');

try {
  execSync('npm run test:e2e', { stdio: 'inherit', cwd: __dirname });
} catch (error) {
  console.log('\n❌ Tests failed');
  process.exit(1);
}

console.log('\n🎉 Tests completed successfully!');
