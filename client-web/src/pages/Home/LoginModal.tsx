import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * 로그인 모달
 * Google, Kakao, Naver, Email 로그인 버튼을 노출
 */
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg">소셜 로그인</DialogTitle>
        </DialogHeader>

        {/* 실제 로그인 로직은 추후 추가 예정이므로 버튼만 배치 */}
        <div className="flex flex-col gap-3 mt-2">
          <Button variant="outline">Google 계정으로 로그인</Button>
          <Button variant="outline">Kakao 계정으로 로그인</Button>
          <Button variant="outline">Naver 계정으로 로그인</Button>
          <Button variant="outline">이메일로 로그인</Button>
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
