import React, { createContext, useContext, ReactNode } from "react";
import { Block } from "../../types";

/**
 * 모든 블록 렌더러에서 공통적으로 사용하는 컨텍스트
 */
export interface BlockContextProps {
  allBlocks: Block[]; // 모든 블록 목록
  currentStepIndex: number; // 현재 활성화된 스텝 인덱스
  setCurrentStepIndex: (index: number) => void; // 현재 스텝 인덱스 변경 함수
}

const BlockContext = createContext<BlockContextProps | undefined>(undefined);

export interface BlockContextProviderProps {
  children: ReactNode;
  value: BlockContextProps;
}

export const BlockContextProvider: React.FC<BlockContextProviderProps> = ({
  children,
  value,
}) => {
  return (
    <BlockContext.Provider value={value}>{children}</BlockContext.Provider>
  );
};

export const useBlockContext = (): BlockContextProps => {
  const context = useContext(BlockContext);
  if (!context) {
    throw new Error(
      "useBlockContext must be used within a BlockContextProvider",
    );
  }
  return context;
};
