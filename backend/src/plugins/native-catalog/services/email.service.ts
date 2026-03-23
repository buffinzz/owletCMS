import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailLog, EmailType } from '../entities/email-log.entity';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectRepository(EmailLog)
    private emailLogRepository: Repository<EmailLog>,
  ) {}

  private getTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) return null;

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  async send(
    patronId: number,
    type: EmailType,
    to: string,
    subject: string,
    html: string,
    relatedId?: number,
  ): Promise<void> {
    const transporter = this.getTransporter();
    const from = process.env.SMTP_FROM || 'noreply@library.org';

    let failed = false;
    let error: string | undefined;

    if (!transporter) {
      this.logger.warn('Email not configured — skipping send');
      failed = true;
      error = 'SMTP not configured';
    } else {
      try {
        await transporter.sendMail({ from, to, subject, html });
        this.logger.log(`Email sent to ${to}: ${subject}`);
      } catch (err) {
        failed = true;
        error = err.message;
        this.logger.error(`Email failed to ${to}: ${err.message}`);
      }
    }

    await this.emailLogRepository.save(
      this.emailLogRepository.create({
        patronId,
        type,
        subject,
        relatedId,
        failed,
        error,
      })
    );
  }

  async sendCheckoutConfirmation(
    patronId: number,
    patronEmail: string,
    patronName: string,
    itemTitle: string,
    dueDate: Date,
    circulationId: number,
  ): Promise<void> {
    await this.send(
      patronId,
      EmailType.CHECKOUT,
      patronEmail,
      `Checkout confirmation: ${itemTitle}`,
      `
        <h2>Checkout Confirmation</h2>
        <p>Hi ${patronName},</p>
        <p>You have checked out <strong>${itemTitle}</strong>.</p>
        <p>Due date: <strong>${dueDate.toLocaleDateString()}</strong></p>
        <p>Please return it on time to avoid any fines.</p>
      `,
      circulationId,
    );
  }

  async sendDueReminder(
    patronId: number,
    patronEmail: string,
    patronName: string,
    itemTitle: string,
    dueDate: Date,
    circulationId: number,
  ): Promise<void> {
    const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    await this.send(
      patronId,
      EmailType.DUE_REMINDER,
      patronEmail,
      `Reminder: ${itemTitle} due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
      `
        <h2>Due Date Reminder</h2>
        <p>Hi ${patronName},</p>
        <p><strong>${itemTitle}</strong> is due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} on <strong>${dueDate.toLocaleDateString()}</strong>.</p>
        <p>Please return it on time or contact us to renew.</p>
      `,
      circulationId,
    );
  }

  async sendOverdueNotice(
    patronId: number,
    patronEmail: string,
    patronName: string,
    itemTitle: string,
    dueDate: Date,
    fineAmount: number,
    circulationId: number,
  ): Promise<void> {
    const daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    await this.send(
      patronId,
      EmailType.OVERDUE,
      patronEmail,
      `Overdue notice: ${itemTitle}`,
      `
        <h2>Overdue Notice</h2>
        <p>Hi ${patronName},</p>
        <p><strong>${itemTitle}</strong> was due on ${dueDate.toLocaleDateString()} and is now ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue.</p>
        ${fineAmount > 0 ? `<p>Current fine: <strong>$${fineAmount.toFixed(2)}</strong></p>` : ''}
        <p>Please return it as soon as possible.</p>
      `,
      circulationId,
    );
  }

  async sendHoldReady(
    patronId: number,
    patronEmail: string,
    patronName: string,
    itemTitle: string,
    expiresAt: Date,
    holdId: number,
  ): Promise<void> {
    await this.send(
      patronId,
      EmailType.HOLD_READY,
      patronEmail,
      `Your hold is ready: ${itemTitle}`,
      `
        <h2>Hold Ready for Pickup</h2>
        <p>Hi ${patronName},</p>
        <p>Your hold on <strong>${itemTitle}</strong> is ready for pickup!</p>
        <p>Please pick it up by <strong>${expiresAt.toLocaleDateString()}</strong> or your hold will expire.</p>
      `,
      holdId,
    );
  }
}