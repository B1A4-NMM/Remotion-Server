import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { encrypt, decrypt } from './crypto.util';

@Injectable()
export class CryptoService {
  private readonly secretKey: string;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('SECRET_KEY');
    if (!secretKey || secretKey.length !== 64) {
      throw new Error(
        'SECRET_KEY must be a 64-character hex string (32 bytes). Please check your .env file.',
      );
    }
    this.secretKey = secretKey;
  }

  /**
   * 문자열을 암호화합니다.
   * @param text 암호화할 평문
   * @returns 암호화된 문자열
   */
  encrypt(text: string): string {
    return encrypt(text, this.secretKey);
  }

  /**
   * 암호화된 문자열을 복호화합니다.
   * 암호화되지 않은 문자열은 그대로 반환됩니다.
   * @param encryptedText 복호화할 암호화된 문자열
   * @returns 복호화된 평문
   */
  decrypt(encryptedText: string): string {
    return decrypt(encryptedText, this.secretKey);
  }
}
