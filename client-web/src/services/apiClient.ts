import axios, { AxiosError, AxiosResponse } from "axios";
import { API_URL } from "@/constants/apiConfig";
import { toast } from "sonner";
import { isApiErrorResponse } from "@/types/api";

/**
 * 환경에 따라 달라지는 API 서버 주소를 자동으로 불러옵니다.
 * ex) .env.local, .env.dev, .env.prod 등의 파일에서 VITE_API_URL 값을 다르게 설정.
 */
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// 응답 인터셉터 - 에러 처리 중앙화
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    handleApiError(error);
    return Promise.reject(error);
  },
);

// API 에러 처리 함수
export const handleApiError = (error: AxiosError): void => {
  const status = error.response?.status;

  // 서버 응답에서 에러 메시지 추출
  let errorMessage = "알 수 없는 오류가 발생했습니다.";

  if (error.response?.data) {
    const data = error.response.data;

    // 타입 가드를 사용하여 안전하게 메시지 추출
    if (isApiErrorResponse(data)) {
      errorMessage = data.message || data.error || errorMessage;
    } else if (typeof data === "string") {
      errorMessage = data;
    }
  } else if (error.message) {
    errorMessage = error.message;
  }

  // 상태 코드별 에러 처리
  switch (status) {
    case 401:
      toast.error("인증이 필요합니다. 다시 로그인해주세요.");
      break;
    case 403:
      toast.error("접근 권한이 없습니다.");
      break;
    case 404:
      toast.error("요청한 리소스를 찾을 수 없습니다.");
      break;
    case 500:
      toast.error("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      break;
    default:
      toast.error(`오류: ${errorMessage}`);
      break;
  }
};

export default apiClient;
