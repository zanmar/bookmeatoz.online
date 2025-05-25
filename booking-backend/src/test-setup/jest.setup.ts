// Example: Mock global Date (if you need consistent dates in tests)
// const MOCK_DATE = '2024-01-01T12:00:00.000Z';
// const RealDate = Date;
// global.Date = class extends RealDate {
//   constructor(...args: any[]) {
//     if (args.length) {
//       // @ts-ignore
//       return new RealDate(...args);
//     }
//     return new RealDate(MOCK_DATE);
//   }
//   static now() {
//     return new RealDate(MOCK_DATE).getTime();
//   }
// } as any;

// Example: Mock a global utility or environment variable for tests
// process.env.SOME_TEST_SPECIFIC_VAR = 'test_value';

// You can also set up global mocks for modules here, e.g.,
// jest.mock('@/utils/logger', () => ({
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
//   debug: jest.fn(),
//   http: jest.fn(),
//   fatal: jest.fn(),
//   child: jest.fn().mockReturnThis(), // If logger.child is used
// }));

beforeAll(async () => {
  // Global setup before all test suites
});

afterAll(async () => {
  // Global teardown after all test suites
});

beforeEach(() => {
  // Runs before each test file
});

afterEach(() => {
  // Runs after each test file
  jest.clearAllMocks(); // Good practice if not using clearMocks in jest.config.js
});
