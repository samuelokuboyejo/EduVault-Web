import axios, { type AxiosError } from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api"

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

 api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any

    if (error.response?.status === 401 || error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem("refreshToken")
        if (!refreshToken) {
          throw new Error("No refresh token")
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        })

        const { accessToken } = response.data
        localStorage.setItem("accessToken", accessToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        console.warn("Session expired — redirecting to login");
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")
        
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
          return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (credentials: { email?: string; matricNumber?: string; password: string }) =>
    api.post("/auth/login", credentials),

  registerStudent: (data: { matricNumber: string; email: string; password: string }) =>
    api.post("/auth/register/student", data),

  registerWithInvite: (token: string, data: FormData, config?: any) =>
    api.post(`/auth/register?token=${token}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
      ...config,
    }),

  googleLogin: (data: any) => api.post("/auth/google", data),

  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),

  resetPassword: (token: string, newPassword: string) =>
     api.post(`/auth/reset-password?token=${token}`, { newPassword }),


  changeRole: (email: string, role: string) => api.post("/auth/change-role", { email, role }),

  getCurrentUser: ()=> api.get("/users/me"),
}

// Admin API
export const adminApi = {
  createInvite: (data: { email: string; role: string }) => api.post("/admin/create-invite", data),

  getPrivilegedUsers: () => api.get("/admin/users/privileged"),

  getRoleAudit: () => api.get("/admin/audit/roles"),

  updateAccountStatus: (email: string, status: string) =>
    api.put(`/admin/account/status?email=${email}&status=${status}`),

  deleteUser: (email: string) => api.delete(`/admin/delete/${email}`),
}

// Receipt API
export const receiptApi = {
  upload: (category: string, data: FormData, config?: any) =>
    api.post(`/${category}/upload`, data, {
      headers: { "Content-Type": "multipart/form-data" },
      ...config,
    }),

  getUserReceipts: (category: string) => api.get(`/${category}/me`),

  downloadUserReceipts: (category: string) => api.get(`/${category}/me/download`, { responseType: "blob" }),

  downloadAllReceipts: (category: string) =>
    api.get(`/${category}/all/download`, { responseType: "blob" }),

  getAllReceipts: (category: string) => api.get(`/retrieve/${category}`),

  approve: (category: string, receiptId: string) => api.put(`/receipts/${category}/approve`, { receiptId }),

  reject: (category: string, receiptId: string, reason: string) =>
    api.put(`/receipts/${category}/reject`, { receiptId, reason }),
}

// Analytics API
export const analyticsApi = {
  getApprovedReceipts: () => api.get("/analytics/approved-receipts"),

  getApprovedCount: () => api.get("/analytics/approved-receipts/count"),

  getUploadsThisMonth: () => api.get("/analytics/uploads/this-month"),

  getApprovedThisWeek: () => api.get("/analytics/approved/this-week"),

  getApprovers: () => api.get("/analytics/approvers"),

  getNewStudents: () => api.get("/analytics/students/new-this-month"),

  getAllStudents: () => api.get("/analytics/students"),

  getStaffActivity: () => api.get("/analytics/staff/activity-this-month"),

  downloadAllReceipts: () => api.get("/analytics/download/approved-receipts", { responseType: "blob" }),
}

// Notifications API
export const notificationsApi = {
  getAll: () => api.get("/notifications/all"),

  getUnreadCount: () => api.get("/notifications/unread-count"),

  markAsRead: (notificationId: string) => api.post(`/notifications/mark-read/${notificationId}`),

  markAllAsRead: () => api.post("/notifications/mark-all-read"),

  broadcastToStudents: (data: { title: string; message: string }) =>
    api.post("/notifications/broadcast/students", data),

  broadcastToStaff: (data: { title: string; message: string }) => api.post("/notifications/broadcast/staff", data),

  sendCustom: (data: { recipients: string[]; title: string; message: string }) => api.post("/notifications/send", data),
}
