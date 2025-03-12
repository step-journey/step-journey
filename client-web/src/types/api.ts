export interface ApiErrorResponse {
  message?: string;
  error?: string;
  statusCode?: number;
  details?: unknown;
}

// 에러 응답 형식 체크 헬퍼 함수
export function isApiErrorResponse(obj: unknown): obj is ApiErrorResponse {
  return (
    obj !== null &&
    typeof obj === "object" &&
    ("message" in obj || "error" in obj)
  );
}
