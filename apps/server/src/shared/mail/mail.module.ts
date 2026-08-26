import { Global, Module } from '@nestjs/common';

import { MailEventListener } from './listeners/mail-event.listener';
import { MailService } from './mail.service';

@Global()
@Module({
  providers: [MailService, MailEventListener],
  exports: [MailService],
})
export class MailModule {}
