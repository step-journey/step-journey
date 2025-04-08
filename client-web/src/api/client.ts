import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import {
  setupRequestInterceptors,
  setupResponseInterceptors,
} from "./interceptors";
import {
  ApiResponse,
  ApiDataResponse,
  ApiPaginatedResponse,
  ApiListResponse,
  RequestParams,
  PaginationParams,
  SortParams,
} from "./types";

export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

setupRequestInterceptors(apiClient);
setupResponseInterceptors(apiClient);

export const api = {
  get: async <T>(
    url: string,
    params?: RequestParams,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    const response = await apiClient.get<ApiResponse<T>>(url, {
      ...config,
      params,
    });
    return response.data;
  },

  getData: async <T>(
    url: string,
    params?: RequestParams,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const response = await apiClient.get<ApiDataResponse<T>>(url, {
      ...config,
      params,
    });
    return response.data.data;
  },

  getList: async <T>(
    url: string,
    params?: RequestParams & PaginationParams & SortParams,
    config?: AxiosRequestConfig,
  ): Promise<ApiListResponse<T>> => {
    const response = await apiClient.get<ApiPaginatedResponse<T>>(url, {
      ...config,
      params,
    });
    return {
      items: response.data.data,
      pagination: response.data.pagination,
    };
  },

  post: async <T, D = Record<string, unknown>>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config);
    return response.data;
  },

  postData: async <T, D = Record<string, unknown>>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const response = await apiClient.post<ApiDataResponse<T>>(
      url,
      data,
      config,
    );
    return response.data.data;
  },

  put: async <T, D = Record<string, unknown>>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config);
    return response.data;
  },

  putData: async <T, D = Record<string, unknown>>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const response = await apiClient.put<ApiDataResponse<T>>(url, data, config);
    return response.data.data;
  },

  patch: async <T, D = Record<string, unknown>>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  },

  patchData: async <T, D = Record<string, unknown>>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const response = await apiClient.patch<ApiDataResponse<T>>(
      url,
      data,
      config,
    );
    return response.data.data;
  },

  delete: async <T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    const response = await apiClient.delete<ApiResponse<T>>(url, config);
    return response.data;
  },
};
