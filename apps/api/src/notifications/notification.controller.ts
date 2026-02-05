import { Controller, Post, Delete, Body } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('register')
  register(@Body() body: { token: string; platform: 'ios' | 'android' }) {
    return this.notificationService.registerToken(body.token, body.platform);
  }

  @Delete('unregister')
  unregister(@Body() body: { token: string }) {
    return this.notificationService.unregisterToken(body.token);
  }

  @Post('test')
  test(@Body() body: { token: string }) {
    return this.notificationService.sendTestNotification(body.token);
  }
}
