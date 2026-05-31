import { Request, Response, NextFunction } from 'express';
import {
  SendCodeSchema,
  RegisterSchema,
  LoginPasswordSchema,
  LoginByCodeSchema,
} from './auth.schema';
import { ok } from '../../middleware/error';
import { Errors } from '../../utils/errors';
import {
  sendVerifyCode,
  register,
  loginByPassword,
  loginByCode,
  getUserById,
} from './auth.service';

export async function postSendCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = SendCodeSchema.parse(req.body);
    await sendVerifyCode(email);
    ok(res, { sent: true });
  } catch (e) {
    next(e);
  }
}

export async function postRegister(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, code, password } = RegisterSchema.parse(req.body);
    const r = await register(email, code, password);
    ok(res, r);
  } catch (e) {
    next(e);
  }
}

export async function postLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = LoginPasswordSchema.parse(req.body);
    const r = await loginByPassword(email, password);
    ok(res, r);
  } catch (e) {
    next(e);
  }
}

export async function postLoginByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, code } = LoginByCodeSchema.parse(req.body);
    const r = await loginByCode(email, code);
    ok(res, r);
  } catch (e) {
    next(e);
  }
}

export function postLogout(_req: Request, res: Response): void {
  ok(res, { logout: true });
}

export function getMe(req: Request, _res: Response, next: NextFunction): void {
  try {
    if (!req.user) throw Errors.unauthorized();
    const u = getUserById(req.user.sub);
    if (!u) throw Errors.notFound('用户不存在');
    ok(_res, u);
  } catch (e) {
    next(e);
  }
}
