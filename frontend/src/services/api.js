import axios from "axios";
// Allow overriding API base URL at build time using Vite env var `VITE_API_URL`.
// If not provided, frontend will call relative `/api` (useful when proxied or when backend is same origin).
const BASE_URL = (import.meta && import.meta.env && import.meta.env.VITE_API_URL) ? import.meta.env.VITE_API_URL : "/api";
const api = axios.create({ baseURL: BASE_URL });

// Attach JWT token from localStorage automatically
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {}
  return config;
});

export const getProducts = (opts = {}) => api.get("/products", { params: opts });
export const getProductByAsin = (asin) => api.get(`/products/${asin}`);
export const getUser = (reviewerID) => api.get(`/user/${reviewerID}`);
export const registerUser = (data) => api.post('/user/register', data);
export const loginUser = (user_id, password) => api.post('/user/login', { user_id, password });
export const changePassword = (currentPassword, newPassword) => api.post('/user/change-password', { currentPassword, newPassword });
export const getMe = () => api.get('/user/me');
export const toggleLike = (reviewerID, asin) =>
  api.put(`/user/${reviewerID}/like`, { asin });
export const getUserReviews = (reviewerID) => api.get(`/reviews/${reviewerID}`);
export const getReviewsForProduct = (asin) =>
  api.get(`/reviews/product/${asin}`);
export const addReview = (reviewData) => api.post("/reviews", reviewData);
export const getRecommendations = (top_n = 10, user_id = null) =>
  api.get(`/recommendations?top_n=${top_n}${user_id ? `&user_id=${encodeURIComponent(user_id)}` : ''}`);

export const retrain = (user_id) => api.post('/recommendations/retrain', {}, { headers: { 'x-user-id': user_id } });
export const retrainStatus = () => api.get('/recommendations/retrain/status');
export const retrainClean = (user_id) => api.post('/recommendations/retrain/clean', {}, { headers: { 'x-user-id': user_id } });
export const runModel = (user_id) => api.post('/recommendations/model/run', {}, { headers: { 'x-user-id': user_id } });
export const getModelCounters = (user_id) => api.get('/recommendations/model/counters', { headers: { 'x-user-id': user_id } });
export const resetModelCounters = (user_id) => api.post('/recommendations/model/counters/reset', {}, { headers: { 'x-user-id': user_id } });

// Cart APIs
export const fetchCart = (user_id) =>
  api.get(`/cart/${user_id}`);
export const addToCart = (user_id, asin, quantity, product) =>
  api.post(`/cart/${user_id}`, { asin, quantity, product });
export const removeFromCart = (user_id, asin) =>
  api.delete(`/cart/${user_id}/${asin}`);
export const updateQuantity = (user_id, asin, quantity) =>
  api.put(`/cart/${user_id}/${asin}`, { quantity });

// Order APIs
export const createOrder = (user_id, orderData) =>
  api.post(`/orders/${user_id}`, orderData);
export const getUserOrders = (user_id) =>
  api.get(`/orders/${user_id}`);
export const getOrderById = (user_id, orderId) =>
  api.get(`/orders/${user_id}/order/${orderId}`);
export const getOrderByNumber = (user_id, orderNumber) =>
  api.get(`/orders/${user_id}/number/${orderNumber}`);
export const updateOrderStatus = (orderId, status) =>
  api.put(`/orders/${orderId}/status`, { status });
export const cancelOrder = (orderId) =>
  api.put(`/orders/${orderId}/cancel`);
export const getOrderStats = (user_id) =>
  api.get(`/orders/${user_id}/stats`);

export default api;
