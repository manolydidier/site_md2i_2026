// types/next-auth.d.ts
import { DefaultSession, DefaultJWT } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id:       string
      role:     string | null
      roleId:   string | null
      roleCode: string | null
    }
  }
  interface User {
    role:     string | null
    roleId:   string | null
    roleCode: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id:       string
    role:     string | null
    roleId:   string | null
    roleCode: string | null
  }
}