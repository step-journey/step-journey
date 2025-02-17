import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google/login`;
  };

  const handleKakaoLogin = () => {
    window.location.href = `${API_URL}/auth/kakao/login`;
  };

  const handleNaverLogin = () => {
    window.location.href = `${API_URL}/auth/naver/login`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg">소셜 로그인</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-2">
          <Button variant="outline" onClick={handleGoogleLogin}>
            Google 계정으로 로그인
          </Button>

          <Button variant="outline" onClick={handleKakaoLogin}>
            Kakao 계정으로 로그인
          </Button>

          <Button variant="outline" onClick={handleNaverLogin}>
            Naver 계정으로 로그인
          </Button>
        </div>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="secondary">닫기</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
