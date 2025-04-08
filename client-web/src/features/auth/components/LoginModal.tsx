import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS } from "@/api/endpoints.ts";
import { BASE_URL } from "@/api/client";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const handleGoogleLogin = () => {
    window.location.href = `${BASE_URL}${API_ENDPOINTS.auth.googleAuth}`;
  };

  const handleKakaoLogin = () => {
    window.location.href = `${BASE_URL}${API_ENDPOINTS.auth.kakaoAuth}`;
  };

  const handleNaverLogin = () => {
    window.location.href = `${BASE_URL}${API_ENDPOINTS.auth.naverAuth}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[528px] p-6 px-8 sm:rounded-xl
        max-sm:w-[100vw] max-sm:h-[100vh] max-sm:rounded-none max-sm:m-0 max-sm:p-4
        flex flex-col max-sm:justify-center"
      >
        <DialogHeader>
          <DialogTitle className="text-xl text-center font-medium">
            Step Journey 에 오신 것을 환경합니다.
          </DialogTitle>
          <DialogClose className="absolute right-4 top-4 opacity-70 ring-offset-background transition-opacity hover:opacity-100" />
        </DialogHeader>

        <div className="flex flex-col gap-4 px-4 my-4">
          {/* 구글 로그인 버튼 */}
          <Button
            variant="outline"
            onClick={handleGoogleLogin}
            className="h-12 border rounded-full bg-white hover:bg-gray-50 text-gray-800 relative pl-14 pr-4"
          >
            <div className="absolute left-4 w-6 h-6 flex items-center justify-center">
              <svg
                width="20"
                height="20"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
              >
                <path
                  fill="#FFC107"
                  d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                ></path>
                <path
                  fill="#FF3D00"
                  d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                ></path>
                <path
                  fill="#4CAF50"
                  d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                ></path>
                <path
                  fill="#1976D2"
                  d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                ></path>
              </svg>
            </div>
            <span className="block text-center w-full">
              Google 계정으로 로그인
            </span>
          </Button>

          {/* 카카오 로그인 버튼 */}
          <Button
            variant="outline"
            onClick={handleKakaoLogin}
            className="h-12 border rounded-full bg-white hover:bg-gray-50 text-gray-800 relative pl-14 pr-4"
          >
            <div className="absolute left-4 w-6 h-6 flex items-center justify-center bg-[#FEE500] rounded-full">
              <svg
                width="16"
                height="16"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9 1.5C4.65076 1.5 1.125 4.43932 1.125 8.02893C1.125 10.4019 2.52676 12.4599 4.64626 13.5235C4.45725 14.1348 3.92401 16.0706 3.85876 16.3191C3.85876 16.3191 3.83175 16.4791 3.92851 16.5437C4.02526 16.6083 4.15351 16.5581 4.15351 16.5581C4.51351 16.5043 6.69151 14.9973 7.29226 14.5715C7.84801 14.6523 8.41726 14.6953 9 14.6953C13.3492 14.6953 16.875 11.7561 16.875 8.16643C16.875 4.57675 13.3492 1.5 9 1.5Z"
                  fill="black"
                />
              </svg>
            </div>
            <span className="block text-center w-full">
              카카오 계정으로 로그인
            </span>
          </Button>

          {/* 네이버 로그인 버튼 */}
          <Button
            variant="outline"
            onClick={handleNaverLogin}
            className="h-12 border rounded-full bg-white hover:bg-gray-50 text-gray-800 relative pl-14 pr-4"
          >
            <div className="absolute left-4 w-6 h-6 flex items-center justify-center bg-[#03C75A] rounded-full">
              <svg
                width="16"
                height="16"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.1477 9.45117L7.46892 4.5H5.25015V13.5H7.22215V8.54883L10.9009 13.5H13.1201V4.5H11.1477V9.45117Z"
                  fill="white"
                />
              </svg>
            </div>
            <span className="block text-center w-full">
              네이버 계정으로 로그인
            </span>
          </Button>
        </div>

        <div className="text-xs text-center text-gray-500 mt-4 max-sm:mt-6">
          로그인하면 이용약관에 동의하게 됩니다.
        </div>
      </DialogContent>
    </Dialog>
  );
}
