import axios from "axios";
import { API_URL } from "@/constants/apiConfig";

/**
 * 환경에 따라 달라지는 API 서버 주소를 자동으로 불러옵니다.
 * ex) .env.local, .env.dev, .env.prod 등의 파일에서 VITE_API_URL 값을 다르게 설정.
 */
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export default apiClient;
