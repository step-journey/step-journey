import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../styles/theme.css"; // 이미 선언된 design tokens

// 메인 래퍼 스타일 (디버거처럼)
export const debuggerWrapper = style({
  display: "flex",
  flexDirection: "column",
  backgroundColor: vars.color.bg.secondary,
  minHeight: "calc(100vh - 60px)",
  border: `1px solid ${vars.color.border.default}`,
  borderRadius: "8px",
  overflow: "hidden",
});

// 상단 툴바 스타일
export const toolbar = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: vars.color.bg.primary,
  borderBottom: `1px solid ${vars.color.border.default}`,
  padding: "0 1rem",
  height: "40px",
});

// 왼쪽 탭/버튼 영역
export const leftActions = style({
  display: "flex",
  gap: "8px",
  alignItems: "center",
});

// 오른쪽 액션들 (run/debug 등)
export const rightActions = style({
  display: "flex",
  gap: "8px",
  alignItems: "center",
});

// 전체 컨텐츠 영역 (에디터/트리/디버거 패널 등)
export const contentArea = style({
  display: "flex",
  flex: 1,
  // 아래 예시는 IntelliJ처럼 좌우 두 패널 (예: 프로젝트 트리 / 에디터 + 디버 창)
});

// 왼쪽 패널 (단계 목록, 예: Frames)
export const leftPanel = style({
  width: "280px",
  backgroundColor: vars.color.bg.primary,
  borderRight: `1px solid ${vars.color.border.default}`,
  display: "flex",
  flexDirection: "column",
  padding: "0.5rem",
});

// 중앙(혹은 우측) 패널 (코드 뷰, 변수 뷰, 평가 뷰 등)
export const mainPanel = style({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  backgroundColor: vars.color.bg.primary,
  // ... etc.
  padding: "1rem",
});

// 단계 이동 버튼들(“앞으로” “뒤로” 등)을 하단 고정으로 둔다면:
export const bottomNav = style({
  borderTop: `1px solid ${vars.color.border.default}`,
  padding: "0.5rem 1rem",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
});

// 예시로 “디버거 단계 리스트 아이템” 스타일
export const frameItem = style({
  padding: "0.25rem 0.5rem",
  borderRadius: "4px",
  selectors: {
    "&:hover": {
      backgroundColor: vars.color.gray["100"],
      cursor: "pointer",
    },
  },
});

export const frameItemActive = style([
  frameItem,
  {
    backgroundColor: vars.color.brand.secondary + "20",
    // half-transparent secondary brand color
  },
]);

// ------------------------------
// Phase 라벨(제목) 스타일
// ------------------------------
export const groupLabelBase = style({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  cursor: "pointer",
  padding: "0.25rem 0.5rem",
  borderRadius: 4,
});

export const groupLabel = styleVariants({
  default: [
    groupLabelBase,
    {
      // 일반 상태
      backgroundColor: "transparent",
    },
  ],
  expanded: [
    groupLabelBase,
    {
      backgroundColor: "#ececec",
    },
  ],
  activeDefault: [
    groupLabelBase,
    {
      // "현재 Phase"이지만 접혀있을 때
      color: vars.color.brand.primary, // 혹은 강조 색상
      fontWeight: "bold", // 굵게
    },
  ],
  activeExpanded: [
    groupLabelBase,
    {
      color: vars.color.brand.primary,
      fontWeight: "bold",
      backgroundColor: "#ececec",
    },
  ],
});

/** Phase 내부 Step 목록 아코디언 영역 */
export const phaseContentTransition = styleVariants({
  collapsed: {
    overflow: "hidden",
    maxHeight: "0px",
    transition: "max-height 0.3s ease",
  },
  expanded: {
    overflow: "auto", // 펼쳐진 상태이므로 스크롤 허용
    maxHeight: "280px", // 원하는 높이
    transition: "max-height 0.3s ease",
  },
});
