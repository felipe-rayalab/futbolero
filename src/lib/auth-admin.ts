import { timingSafeEqual } from 'crypto'
import { NextRequest } from 'next/server'

// Verifica el token de admin usando comparación de tiempo constante
// para prevenir timing attacks.
export function verifyAdminToken(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false

  const token = req.headers.get('authorization')?.replace('Bearer ', '').trim()
  if (!token) return false

  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(secret))
  } catch {
    // Los buffers tienen distinto largo — token incorrecto
    return false
  }
}
