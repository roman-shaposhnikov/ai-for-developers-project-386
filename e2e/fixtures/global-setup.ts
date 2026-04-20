import { exec } from 'child_process';
import { promisify } from 'util';
import { clearAllData } from './test-data';

const execAsync = promisify(exec);

/**
 * Global setup for E2E tests
 * Starts backend and frontend before all tests
 */
export default async function globalSetup() {
  console.log('🚀 Starting E2E test setup...');

  // Check if services are already running
  try {
    await fetch('http://localhost:3000/health');
    await fetch('http://localhost:8080');
    console.log('✅ Services already running');
    return;
  } catch {
    console.log('⚠️  Services not running, tests should start them via webServer config');
  }
}

/**
 * Cleanup function to reset backend state
 * Called between test files for data isolation
 */
export async function resetBackendState(): Promise<void> {
  try {
    await clearAllData();
    console.log('🧹 Backend state reset');
  } catch (error) {
    console.warn('⚠️  Could not reset backend state:', error);
  }
}
