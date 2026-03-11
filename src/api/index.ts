import axios from "axios";
import { toast } from "@/hooks/use-toast";
import i18n from "../plugins/i18n";

const baseURL =`${window.location.origin}/api`
// const baseURL =`http://localhost:3018/api`

const baseApi = axios.create({
  baseURL,
  withCredentials: true,
});

baseApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: any[] = [];
const isPublicEndpoint = (url?: string) =>
  Boolean(url && /^\/?public(\/|$)/.test(url));

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

baseApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 403 && !originalRequest.url?.includes("/auth/signin")) {
      toast({
        title: i18n.t("common.forbidden_action"),
        variant: "destructive",
      });
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Public flow endpoints must not force auth refresh or redirect to /login.
      if (isPublicEndpoint(originalRequest.url)) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = "Bearer " + token;
            return baseApi(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise(function (resolve, reject) {
        axios
          .post(`${baseURL}/auth/refresh`)
          .then(({ data }) => {
            localStorage.setItem("accessToken", data.accessToken);
            baseApi.defaults.headers.common["Authorization"] =
              "Bearer " + data.accessToken;
            originalRequest.headers["Authorization"] =
              "Bearer " + data.accessToken;
            processQueue(null, data.accessToken);
            resolve(baseApi(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
            window.location.href = "/login";
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  }
);
export default baseApi;
