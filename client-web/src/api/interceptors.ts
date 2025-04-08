import { AxiosInstance } from "axios";

export const setupRequestInterceptors = (instance: AxiosInstance): void => {
  instance.interceptors.request.use(
    (config) => {
      // 요청 헤더에 토큰 추가 등
      return config;
    },
    (error: unknown) => {
      if (!(error instanceof Error)) {
        return Promise.reject(new Error(String(error)));
      }
      return Promise.reject(error);
    },
  );
};

export const setupResponseInterceptors = (instance: AxiosInstance): void => {
  instance.interceptors.response.use();
};
