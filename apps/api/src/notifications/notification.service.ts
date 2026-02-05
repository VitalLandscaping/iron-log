import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import * as admin from 'firebase-admin';

const HARDCODED_USER_ID = 'cm9qaz1jk0000v88c3xjq8r4z';

const NUDGE_MESSAGES = [
  { title: 'Quick 10 💪', body: 'Drop and give me 10 pushups right now.' },
  { title: 'No excuses', body: '10 pushups. Takes 30 seconds. Go.' },
  { title: 'Micro workout', body: '20 squats. Your legs will thank you.' },
  { title: 'Posture check', body: 'Sit up straight. Now do 10 pushups.' },
  { title: 'Quick set', body: '15 bodyweight squats. Right now. Let\'s go.' },
  { title: '30 seconds', body: 'Plank. 30 seconds. Timer starts when you get down.' },
  { title: 'Iron Log reminder', body: 'Have you logged your workout today?' },
  { title: 'Easy gains', body: '10 pushups, 10 squats, 10 lunges. Under 2 minutes.' },
  { title: "Don't break the streak", body: 'Your streak is alive. Keep it going.' },
  { title: 'Quick pump', body: '3 sets of 10 pushups. Rest 30s between. Go.' },
];

@Injectable()
export class NotificationService implements OnModuleInit {
  private scheduledHour: number | null = null;
  private sentToday = false;
  private firebaseInitialized = false;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.initializeFirebase();
    this.scheduleRandomTime();
  }

  private initializeFirebase() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.log('[Notifications] Firebase credentials not configured - notifications disabled');
      return;
    }

    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey: privateKey.replace(/\\n/g, '\n'),
            clientEmail,
          }),
        });
      }
      this.firebaseInitialized = true;
      console.log('[Notifications] Firebase Admin initialized successfully');
    } catch (error) {
      console.error('[Notifications] Failed to initialize Firebase:', error);
    }
  }

  // Runs at midnight — pick a random hour for today's nudge
  @Cron('0 0 * * *')
  scheduleRandomTime() {
    this.scheduledHour = Math.floor(Math.random() * 12) + 9; // 9am - 9pm
    this.sentToday = false;
    console.log(`[Notifications] Today's nudge scheduled for ${this.scheduledHour}:00`);
  }

  // Check every hour if it's time to send
  @Cron('0 * * * *')
  async checkAndSend() {
    const currentHour = new Date().getHours();
    if (currentHour === this.scheduledHour && !this.sentToday) {
      await this.sendRandomNudge();
      this.sentToday = true;
    }
  }

  private async sendRandomNudge() {
    if (!this.firebaseInitialized) {
      console.log('[Notifications] Firebase not initialized - skipping nudge');
      return;
    }

    const msg = NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)];
    const tokens = await this.prisma.deviceToken.findMany();

    if (tokens.length === 0) {
      console.log('[Notifications] No registered devices - skipping nudge');
      return;
    }

    console.log(`[Notifications] Sending "${msg.title}" to ${tokens.length} device(s)`);

    for (const deviceToken of tokens) {
      try {
        await admin.messaging().send({
          token: deviceToken.token,
          notification: { title: msg.title, body: msg.body },
          apns: {
            payload: {
              aps: { sound: 'default', badge: 1 },
            },
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
            },
          },
        });
        console.log(`[Notifications] Sent "${msg.title}" to ${deviceToken.platform}`);
      } catch (error: any) {
        // If token is invalid, remove it
        if (
          error.code === 'messaging/registration-token-not-registered' ||
          error.code === 'messaging/invalid-registration-token'
        ) {
          await this.prisma.deviceToken.delete({ where: { id: deviceToken.id } });
          console.log(`[Notifications] Removed invalid token: ${deviceToken.id}`);
        } else {
          console.error(`[Notifications] Error sending:`, error);
        }
      }
    }
  }

  async registerToken(token: string, platform: string) {
    return this.prisma.deviceToken.upsert({
      where: { token },
      update: { platform },
      create: { token, platform, userId: HARDCODED_USER_ID },
    });
  }

  async unregisterToken(token: string) {
    try {
      await this.prisma.deviceToken.delete({ where: { token } });
      return { success: true };
    } catch (error) {
      // Token might not exist, that's OK
      return { success: true };
    }
  }

  // For testing — manually trigger a notification
  async sendTestNotification(token: string) {
    if (!this.firebaseInitialized) {
      throw new Error('Firebase not initialized');
    }

    const msg = NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)];

    await admin.messaging().send({
      token,
      notification: { title: msg.title, body: msg.body },
      apns: {
        payload: {
          aps: { sound: 'default', badge: 1 },
        },
      },
    });

    return { sent: true, message: msg };
  }
}
