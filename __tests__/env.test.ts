import ENV from '../src/config/env';

describe('Environment Configuration', () => {
  it('loads environment variables with valid values', () => {
    expect(ENV).toBeDefined();
    expect(ENV.GOOGLE_MAPS_API_KEY_ANDROID).toBeDefined();
    expect(typeof ENV.GOOGLE_MAPS_API_KEY_ANDROID).toBe('string');
    expect(ENV.GOOGLE_MAPS_API_KEY_IOS).toBeDefined();
    expect(typeof ENV.GOOGLE_MAPS_API_KEY_IOS).toBe('string');
    expect(typeof ENV.IS_TEST_MODE).toBe('boolean');
    expect(typeof ENV.TEST_PHONE).toBe('string');
    expect(typeof ENV.TEST_OTP).toBe('string');
    expect(typeof ENV.DISTANCE_FILTER_KM).toBe('number');
  });

  it('correctly parses numbers and booleans', () => {
    expect(ENV.DISTANCE_FILTER_KM).toBeGreaterThan(0);
  });
});
