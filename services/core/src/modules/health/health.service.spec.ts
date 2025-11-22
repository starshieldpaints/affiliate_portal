import { HealthService } from './health.service';

describe('HealthService', () => {
  const mockPrisma = {
    $queryRaw: jest.fn()
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns ok when database ping succeeds', async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);
    const service = new HealthService(mockPrisma);

    const result = await service.readiness();

    expect(result.ok).toBe(true);
    expect(result.checks.database).toBe(true);
    expect(mockPrisma.$queryRaw).toHaveBeenCalled();
  });

  it('returns not ok when database ping fails', async () => {
    mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('db down'));
    const service = new HealthService(mockPrisma);

    const result = await service.readiness();

    expect(result.ok).toBe(false);
    expect(result.checks.database).toBe(false);
  });
});
