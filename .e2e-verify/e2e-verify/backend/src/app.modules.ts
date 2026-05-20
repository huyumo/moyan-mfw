import { Module } from '@nestjs/common';
import AdModule from 'moyan-mfw-extension-ad/backend';

@Module({
  imports: [AdModule],
})
export class AppModule {}
