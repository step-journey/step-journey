import { useNavigate } from "react-router-dom";
import { IconChevronRight } from "@tabler/icons-react";

// shadcn/ui 컴포넌트
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function AboutPage() {
  const navigate = useNavigate();

  const goHome = () => {
    navigate("/");
  };

  return (
    <div className="p-4">
      {/* 돌아가기 버튼 */}
      <div className="mb-4">
        <Button variant="outline" size="sm" onClick={goHome}>
          돌아가기
        </Button>
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold mb-4">StepJourney</h2>

      {/* Accordion: multiple, default open “ideation” */}
      <Accordion
        type="multiple"
        defaultValue={["ideation"]}
        className="space-y-2"
      >
        {/* 아이디에이션 */}
        <AccordionItem value="ideation">
          <AccordionTrigger className="flex items-center gap-2">
            {/* Mantine처럼 “chevron을 왼쪽”에 두고, open 시 회전되도록 */}
            <IconChevronRight className="h-4 w-4 transition-transform data-[state=open]:rotate-90" />
            <span className="text-sm font-semibold">
              2025.01.13 (월) 아이디에이션
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-5 text-sm space-y-3">
              <li>
                <p className="font-medium">한 줄 소개</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>
                    일상적으로 사용하는 앱의 기능을 단계별로 조작하며 동작
                    원리를 이해하게 해주는 교육 서비스
                  </li>
                </ul>
              </li>
              <li>
                <p className="font-medium">풀고자 하는 문제</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>
                    매우 중요한 기술인 소프트웨어 개발을 재미없는 방식으로 접해
                    흥미를 가지지 못하는 문제
                  </li>
                  <li>
                    전체 그림을 파악하지 않고 이론적·개념적 학습만 진행해
                    동기부여가 떨어지는 문제
                  </li>
                  <li>
                    큰 그림을 모르면 학습이 불안하고 재미가 없어 학습 효율이
                    떨어짐
                  </li>
                  <li>
                    반면, 소프트웨어 개발을 “패킷 이동을 위한 여정 준비”라고
                    생각하면 여행처럼 재미있는 접근 가능
                  </li>
                  <li>
                    재미 없는 간단한 예시 서비스로만 학습할 때 몰입도나 재미가
                    부족
                  </li>
                </ul>
              </li>
              <li>
                <p className="font-medium">솔루션</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>
                    <b>실제 앱 중심</b>의 “디버거형” 학습: 매일 쓰는 앱의 특정
                    기능을 단계별로 추적하고 직접 조작
                  </li>
                  <li>
                    <b>‘큰 그림’을 먼저 보여주는 접근</b>: 패킷 이동의 전체
                    흐름을 스토리텔링(“데이터의 여행”)으로 학습 흥미 유발
                  </li>
                  <li>
                    <b>직접 조작</b>을 통한 능동적 학습: 앞으로/뒤로 이동하며
                    실제 코드, 서버 로그, API 응답 등을 디버거처럼 확인
                  </li>
                  <li>
                    <b>사용자 친화적인 웹 서비스</b>: 브라우저만 있으면 되고,
                    IntelliJ 디버거와 유사한 단계 이동/중단점/스택 보기 기능
                  </li>
                  <li>
                    <b>개인화된 학습 시나리오</b>: 게임 레벨을 클리어하듯 주요
                    기능별 체크리스트 제공, 가상 배지로 동기부여 유지
                  </li>
                </ul>
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* 1차 구현 */}
        <AccordionItem value="implementation">
          <AccordionTrigger className="flex items-center gap-2">
            <IconChevronRight className="h-4 w-4 transition-transform data-[state=open]:rotate-90" />
            <span className="text-sm font-semibold">
              2025.01.14 (화) 1차 구현
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm">
              실제 학습 환경에 적용하기 위해 초기 버전을 구현했습니다.
              디버거처럼 단계별 추적이 가능한 UI를 제공하며,
              <br />
              추후 더욱 다양한 기능(메모 기능, 단계별 퀴즈, 기록 공유 등)을
              추가할 예정입니다.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
