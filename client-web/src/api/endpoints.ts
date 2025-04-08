import { Endpoint } from "./types";

export const API_ENDPOINTS = {
  auth: {
    googleAuth: "/api/v1/auth/google/redirect" as Endpoint,
    kakaoAuth: "/api/v1/auth/kakao/redirect" as Endpoint,
    naverAuth: "/api/v1/auth/naver/redirect" as Endpoint,
    logout: "/api/v1/auth/logout" as Endpoint,
  },

  users: {
    me: "/api/v1/users/me" as Endpoint,
  },
};
