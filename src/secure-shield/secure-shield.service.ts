import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { authenticator } from 'otplib';
import * as base32 from 'thirty-two';

@Injectable()
export class SecureShieldService {
  constructor(private configService: ConfigService) {}

  private readonly algorithm = 'aes-256-cbc';
  private readonly serviceName = 'ft_transendence';

  generateOtpAuthUrl(email: string, secretKey: string): string {
    return authenticator.keyuri(email, this.serviceName, secretKey);
  }

  generateSecretKey(): string {
    return authenticator.generateSecret();
  }

  isValidTotp(token: string, secretKey: string): boolean {
    return authenticator.verify({ token: token, secret: secretKey });
  }

  encrypt(text: string): string {
    const iv = randomBytes(16); // 초기화 벡터: 같은 데이터를 암호화해도 암호화 결과를 매번 다르게 해준다. 16자리 여야 함.
    // 암호화를 해주는 싸이퍼 객체를 생성함
    const cipher = createCipheriv(
      this.algorithm,
      this.configService.get<string>('ENCRYPT_KEY'), // AES-256이기 때문에 256비트인 32자리 수의 secret key를 사용해야 함
      iv,
    );
    let encrypted = cipher.update(text); // cipher를 가지고 text를 암호화
    // 암호화된 데이터('encrypted')와 마지막 암호화된 데이터조각 'cipher.final()'을 결합하여 암호화된 데이터를 연속된 버퍼로만듦.
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    // 추후에 암호문 해독을 위해서는 iv를 가지고 있어야하기 때문에 암호문과 iv를 같이 반환함.
    // buffer객체는 stringify로 자동으로 직렬화되지 않기 때문에 16진수로 변환해주어야 함
    return JSON.stringify({ iv: iv.toString('hex'), encrypted: encrypted.toString('hex') });
  }

  decrypt(text: string): string {
    const encryptionRes = JSON.parse(text) as { iv: string; encrypted: string };
    const iv = Buffer.from(encryptionRes.iv, 'hex'); // JSON.stringfy 때문에 직렬화된 iv를 다시 Buffer타입으로 변환
    const encrypted = Buffer.from(encryptionRes.encrypted, 'hex');
    const decipher = createDecipheriv(
      this.algorithm,
      this.configService.get<string>('ENCRYPT_KEY'),
      iv,
    );
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    const encoded = base32.encode(decrypted);
    return encoded;
  }
}
