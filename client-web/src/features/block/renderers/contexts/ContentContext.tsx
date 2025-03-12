import React, { createContext, useContext, ReactNode } from "react";
import { FlattenedBlock } from "../../types";

/**
 * 콘텐츠 영역에서 블록 렌더링에 필요한 컨텍스트
 */
export interface ContentContextProps {
  currentStep: FlattenedBlock | null; // 현재 활성화된 스텝
  allSteps: FlattenedBlock[]; // 모든 스텝 목록
  highlightKeywords?: boolean; // 키워드 강조 여부
}

const ContentContext = createContext<ContentContextProps | undefined>(
  undefined,
);

export interface ContentContextProviderProps {
  children: ReactNode;
  value: ContentContextProps;
}

export const ContentContextProvider: React.FC<ContentContextProviderProps> = ({
  children,
  value,
}) => {
  return (
    <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
  );
};

export const useContentContext = (): ContentContextProps => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error(
      "useContentContext must be used within a ContentContextProvider",
    );
  }
  return context;
};
