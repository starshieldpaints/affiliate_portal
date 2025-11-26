import { api, setAccessToken } from './api';

class MockResponse {
  status: number;
  private body: string;
  private headerMap: Map<string, string>;
  constructor(body: string, init?: { status?: number; headers?: Record<string, string> }) {
    this.body = body;
    this.status = init?.status ?? 200;
    this.headerMap = new Map(
      Object.entries(init?.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v])
    );
  }
  get ok() {
    return this.status >= 200 && this.status < 300;
  }
  json() {
    return Promise.resolve(JSON.parse(this.body));
  }
  text() {
    return Promise.resolve(this.body);
  }
  headers = {
    get: (key: string) => this.headerMap.get(key.toLowerCase())
  } as any;
}
// @ts-ignore
global.Response = MockResponse as any;

describe('api refresh retry', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    // @ts-ignore
    global.fetch = originalFetch;
    setAccessToken(null);
  });

  it('retries once after refresh token and succeeds', async () => {
    let call = 0;
    const fetchMock = jest.fn(async (url: any, options: any) => {
      call += 1;
      if (call === 1) {
        return new Response('unauthorized', { status: 401 });
      }
      if (call === 2 && url === '/auth/admin/refresh') {
        return new Response(JSON.stringify({ accessToken: 'new-token' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      if (call === 3) {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      return new Response('error', { status: 500 });
    });
    // @ts-ignore
    global.fetch = fetchMock;
    setAccessToken('expired');

    const result = await api.get<{ ok: boolean }>('/admin/secure');
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect((fetchMock.mock.calls[2][1].headers as any).Authorization).toBe('Bearer new-token');
  });
});
