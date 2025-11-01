import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: 'ADMIN' | 'OPERATEUR' | 'LECTURE'
    }
  }

  interface User {
    role: 'ADMIN' | 'OPERATEUR' | 'LECTURE'
  }
}
