export interface User {
  email: string
  role: "STUDENT" | "STAFF" | "ADMIN"
  matricNumber?: string
}

export const getStoredUser = (): User | null => {
  if (typeof window === "undefined") return null

  const userStr = localStorage.getItem("user")
  return userStr ? JSON.parse(userStr) : null
}

export const setStoredUser = (user: User) => {
  localStorage.setItem("user", JSON.stringify(user))
}

export const clearAuth = () => {
  localStorage.removeItem("accessToken")
  localStorage.removeItem("refreshToken")
  localStorage.removeItem("user")
}

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem("accessToken")
}

export const hasRole = (allowedRoles: string[]): boolean => {
  const user = getStoredUser()
  return user ? allowedRoles.includes(user.role) : false
}
