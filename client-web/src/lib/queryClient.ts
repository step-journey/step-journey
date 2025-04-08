import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 기본 쿼리 옵션들
      refetchOnWindowFocus: false, // 창 포커스 시 자동 갱신 비활성화
      retry: 1, // 실패 시 1번 재시도
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 재시도 지연 시간
      staleTime: 0, // 데이터가 오래된 것으로 간주되는 시간 (밀리초)
      gcTime: 5 * 60 * 1000, // 캐시 유지 시간 (5분)
      refetchOnMount: true, // 컴포넌트 마운트 시 재요청
      refetchOnReconnect: true, // 네트워크 재연결 시 재요청
      refetchInterval: false, // 주기적 재요청 간격
      refetchIntervalInBackground: false, // 백그라운드에서도 주기적 재요청 수행
      enabled: true, // 쿼리 활성화 여부
      retryOnMount: true, // 마운트 시 에러 발생한 쿼리 재시도
      networkMode: "online", // 네트워크 모드 (online, always, offlineFirst)
      throwOnError: false, // 에러 발생 시 예외 throw 여부
      // select: undefined, // 데이터 변환 함수
      // placeholderData: undefined, // 로딩 중 표시될 임시 데이터
      // notifyOnChangeProps: undefined, // 렌더링을 트리거할 속성 지정
    },
    mutations: {
      // 기본 뮤테이션 옵션들
      retry: 0, // 실패 시 재시도 횟수
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 재시도 지연 시간
      networkMode: "online", // 네트워크 모드 (online, always, offlineFirst)
      throwOnError: false, // 에러 발생 시 예외 throw 여부
      // onMutate: undefined, // 뮤테이션 시작 시 호출될 함수
      // onSuccess: undefined, // 뮤테이션 성공 시 호출될 함수
      // onError: undefined, // 뮤테이션 실패 시 호출될 함수
      // onSettled: undefined, // 뮤테이션 완료 시 호출될 함수 (성공/실패 모두)
    },
  },
});

export default queryClient;
