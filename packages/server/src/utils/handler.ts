import type { BeforeHandle, UserClaims } from "@/types"

export const isAdmin: BeforeHandle = async ({ bearer, jwt, set }) => {
  const user = (await jwt.verify(bearer)) as UserClaims
  if (user.role !== 'admin') {
    set.status = 403
    return 'Forbidden'
  }
}
