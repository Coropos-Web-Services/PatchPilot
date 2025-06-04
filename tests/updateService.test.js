import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { UpdateService } from '../src/services/updateService.js';

describe('isNewerVersion', () => {
  const service = new UpdateService();

  test('1.1.0 is newer than 1.0.0', () => {
    assert.strictEqual(service.isNewerVersion('1.1.0', '1.0.0'), true);
  });

  test('1.0.1 is newer than 1.0.0', () => {
    assert.strictEqual(service.isNewerVersion('1.0.1', '1.0.0'), true);
  });

  test('1.0.0 is not newer than 1.1.0', () => {
    assert.strictEqual(service.isNewerVersion('1.0.0', '1.1.0'), false);
  });

  test('same versions are not newer', () => {
    assert.strictEqual(service.isNewerVersion('1.0.0', '1.0.0'), false);
  });
});
