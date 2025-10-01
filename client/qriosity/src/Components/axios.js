import axios from "axios";

// Local backend API
const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Automatically attach token if present
API.interceptors.request.use(req => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.token) req.headers.Authorization = `Bearer ${user.token}`;
  return req;
});

export default API;
