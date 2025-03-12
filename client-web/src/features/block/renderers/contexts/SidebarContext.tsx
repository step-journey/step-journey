import React, { createContext, useContext, ReactNode } from "react";

/**
 * 사이드바에서 블록 렌더링에 필요한 컨텍스트
 */
export interface SidebarContextProps {
  expandedGroups: Record<string, boolean>; // 펼쳐진 그룹 목록
  toggleGroup: (groupId: string) => void; // 그룹 펼치기/접기 토글 함수
  onClickStep: (groupId: string, stepIdInGroup: number) => void; // 스텝 클릭 핸들러
  currentStepId?: string; // 현재 활성화된 스텝 ID
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined,
);

export interface SidebarContextProviderProps {
  children: ReactNode;
  value: SidebarContextProps;
}

export const SidebarContextProvider: React.FC<SidebarContextProviderProps> = ({
  children,
  value,
}) => {
  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
};

export const useSidebarContext = (): SidebarContextProps => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error(
      "useSidebarContext must be used within a SidebarContextProvider",
    );
  }
  return context;
};
