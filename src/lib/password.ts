export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(password, passwordHash);
}
