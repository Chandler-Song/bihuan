import bcrypt from 'bcryptjs';

export const hashPassword = (raw: string): Promise<string> => bcrypt.hash(raw, 10);
export const comparePassword = (raw: string, hashed: string): Promise<boolean> =>
  bcrypt.compare(raw, hashed);
