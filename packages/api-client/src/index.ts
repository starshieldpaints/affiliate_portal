import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';

const authenticationResponse = z.object({
  accessToken: z.string(),
  refreshToken: z.string()
});

export type AuthenticationResponse = z.infer<typeof authenticationResponse>;

export class StarShieldApiClient {
  private readonly http: AxiosInstance;

  constructor(baseURL: string, options?: { accessToken?: string }) {
    this.http = axios.create({
      baseURL,
      headers: options?.accessToken
        ? { Authorization: `Bearer ${options.accessToken}` }
        : undefined
    });
  }

  async login(email: string, password: string): Promise<AuthenticationResponse> {
    const { data } = await this.http.post('/auth/login', { email, password });
    return authenticationResponse.parse(data);
  }
}
