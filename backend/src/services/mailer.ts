import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;
  if (!env.MAIL_HOST || !env.MAIL_USER) {
    logger.warn('Mail not configured, mails will be logged only');
    transporter = nodemailer.createTransport({ jsonTransport: true });
    return transporter;
  }
  transporter = nodemailer.createTransport({
    host: env.MAIL_HOST,
    port: env.MAIL_PORT,
    secure: env.MAIL_PORT === 465,
    auth: { user: env.MAIL_USER, pass: env.MAIL_PASS },
  });
  return transporter;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}): Promise<void> {
  const t = getTransporter();
  try {
    const info = await t.sendMail({
      from: env.MAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    logger.info({ to: opts.to, subject: opts.subject, id: info.messageId }, 'mail sent');
  } catch (err) {
    logger.error({ err, to: opts.to }, 'mail send failed');
    throw err;
  }
}

export function verifyCodeMail(code: string): { subject: string; html: string; text: string } {
  return {
    subject: '【闭环】您的验证码',
    text: `您的验证码是 ${code}，10 分钟内有效。如非本人操作请忽略。`,
    html: `<p>您好，</p><p>您的验证码是 <b style="font-size:18px">${code}</b>，10 分钟内有效。</p><p>如非本人操作请忽略此邮件。</p><p>—— 闭环</p>`,
  };
}

export function reminderMail(content: string, level: number): {
  subject: string;
  html: string;
  text: string;
} {
  const tag = level >= 2 ? '【紧急·待闭环】' : '【提醒】';
  return {
    subject: `${tag} ${content}`,
    text: `任务提醒：${content}\n请尽快闭环或选择延期。`,
    html: `<p>任务提醒：</p><p style="font-size:16px"><b>${content}</b></p><p>请尽快完成闭环或在系统中选择延期。</p><p>—— 闭环</p>`,
  };
}

export function summaryMail(period: 'week' | 'month', html: string): {
  subject: string;
  html: string;
} {
  return {
    subject: period === 'week' ? '【闭环】本周总结' : '【闭环】本月总结',
    html,
  };
}
