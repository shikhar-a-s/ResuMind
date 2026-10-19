export const apiConfig = {
    baseURL: import.meta.env.DEV ? "" : import.meta.env.VITE_API_URL || "http://localhost:3000",
    withCredentials: true
};
