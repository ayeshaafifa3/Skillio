import axios from "axios";

// Prefer env-configured backend URL; fall back to Vite dev proxy.
// - Dev: Vite proxy maps `/api/*` -> `http://127.0.0.1:8000/*`
// - Prod: set `VITE_API_BASE_URL` to your backend origin (e.g. https://api.example.com)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 second timeout for all requests (development)
  // Don't set default Content-Type - let axios set it automatically based on data type
  // For JSON: application/json
  // For FormData: multipart/form-data with boundary
});

// Attach token automatically and set Content-Type appropriately
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Set Content-Type for JSON requests (but not for FormData - axios handles that)
  if (config.data && !(config.data instanceof FormData) && !config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }
  
  return config;
});

// Handle 401 errors (unauthorized) - redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // Only redirect if we're not already on login/signup page
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/signup')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Resume and Job Description APIs
export const uploadsApi = {
  // Resume endpoints
  uploadResume: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/resume/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  },
  
  getResumeHistory: () => api.get("/resume/history"),
  
  getResume: (resumeId: number) => api.get(`/resume/${resumeId}`),
  
  deleteResume: (resumeId: number) => api.delete(`/resume/${resumeId}`),
  
  // Job Description endpoints
  uploadJobDescription: (file: File, title: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    return api.post("/resume/job-description/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  },
  
  saveJobDescriptionText: (title: string, content: string) => 
    api.post("/resume/job-description/text", { title, content }),
  
  getJobDescriptionHistory: () => api.get("/resume/job-description/history"),
  
  getJobDescription: (jdId: number) => api.get(`/resume/job-description/${jdId}`),
  
  deleteJobDescription: (jdId: number) => api.delete(`/resume/job-description/${jdId}`)
};

// ATS Score Analysis
export const getATSScore = async (jobDescription: string) => {
  return api.post("/analysis/ats-score", null, {
    params: { job_description: jobDescription }
  });
};

export const getResumeImprovements = async (jobDescription: string) => {
  return api.post("/analysis/resume-improvement", null, {
    params: { job_description: jobDescription }
  });
};

