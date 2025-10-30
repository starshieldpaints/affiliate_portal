declare module 'argon2' {
  export type Options = {
    timeCost?: number;
    memoryCost?: number;
    parallelism?: number;
    type?: number;
    salt?: Buffer;
    hashLength?: number;
    version?: number;
    raw?: boolean;
  };

  export function hash(
    data: string | Buffer,
    options?: Options
  ): Promise<string>;

  export function verify(
    hash: string | Buffer,
    data: string | Buffer,
    options?: Options
  ): Promise<boolean>;

  const _default: {
    hash: typeof hash;
    verify: typeof verify;
  };

  export default _default;
}

