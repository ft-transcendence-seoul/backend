import { Module } from '@nestjs/common';
import { SecureShieldService } from './secure-shield.service';

@Module({
  providers: [SecureShieldService],
  exports: [SecureShieldService],
})
export class SecureShieldModule {}
