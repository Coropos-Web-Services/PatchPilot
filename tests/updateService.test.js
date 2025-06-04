import { UpdateService } from '../src/services/updateService.js';

describe('isNewerVersion', () => {
  const service = new UpdateService();

  test('1.1.0 is newer than 1.0.0', () => {
    expect(service.isNewerVersion('1.1.0', '1.0.0')).toBe(true);
  });

  test('1.0.1 is newer than 1.0.0', () => {
    expect(service.isNewerVersion('1.0.1', '1.0.0')).toBe(true);
  });

  test('1.0.0 is not newer than 1.1.0', () => {
    expect(service.isNewerVersion('1.0.0', '1.1.0')).toBe(false);
  });

  test('same versions are not newer', () => {
    expect(service.isNewerVersion('1.0.0', '1.0.0')).toBe(false);
  });
});
