declare module 'ali-oss' {
  interface STSOptions {
    accessKeyId: string;
    accessKeySecret: string;
  }

  interface STSAssumeRoleResult {
    credentials: {
      AccessKeyId: string;
      AccessKeySecret: string;
      SecurityToken: string;
      Expiration: string;
    };
  }

  class STS {
    constructor(options: STSOptions);
    assumeRole(
      roleArn: string,
      policy?: string,
      expirationSeconds?: number,
    ): Promise<STSAssumeRoleResult>;
  }
}
