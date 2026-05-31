import { z } from 'zod';

export const SendCodeSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  scene: z.enum(['register', 'login']).default('login'),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, '验证码应为6位数字'),
  password: z.string().min(6, '密码至少6位').max(64),
});

export const LoginPasswordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(64),
});

export const LoginByCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
});
