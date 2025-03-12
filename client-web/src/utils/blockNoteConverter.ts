import { Block as BlockNoteBlock } from "@blocknote/core";
import { v4 as uuidv4 } from "uuid";
import { Journey, GroupData, Step } from "@/types/journey";

// 중간 그룹 데이터를 위한 명시적 인터페이스 정의
interface TempGroup {
  groupId: string;
  groupLabel: string;
  mapDescription: string;
  steps: Step[];
}

// BlockNote 문서를 Journey 구조로 변환
export const convertBlockNoteToJourney = (
  blocks: BlockNoteBlock[],
  existingJourney?: Partial<Journey>,
): { journey: Partial<Journey>; groups: GroupData[] } => {
  // 기본 Journey 정보
  const journey: Partial<Journey> = {
    id: existingJourney?.id || uuidv4(),
    title: "Untitled Journey",
    description: "",
    step_order: existingJourney?.step_order || [],
    created_at: existingJourney?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    groups: [],
  };

  const groups: GroupData[] = [];

  // 명시적 타입 선언
  let currentGroup: TempGroup | null = null;
  let currentStep: Step | null = null;

  // 첫 번째 블록이 제목이면 제목으로 설정
  if (
    blocks.length > 0 &&
    blocks[0].type === "heading" &&
    blocks[0].props?.level === 1
  ) {
    const titleText = extractTextFromBlockContent(blocks[0]);
    if (titleText) journey.title = titleText;
    blocks = blocks.slice(1); // 제목 블록 제거
  }

  // 첫 번째 블록이 문단이면 설명으로 설정
  if (blocks.length > 0 && blocks[0].type === "paragraph") {
    const descText = extractTextFromBlockContent(blocks[0]);
    if (descText) journey.description = descText;
    blocks = blocks.slice(1); // 설명 블록 제거
  }

  // 문제 설명 찾기
  const problemIndex = blocks.findIndex(
    (block) =>
      block.type === "heading" &&
      block.props?.level === 2 &&
      extractTextFromBlockContent(block).toLowerCase().includes("문제"),
  );

  if (problemIndex >= 0 && problemIndex + 1 < blocks.length) {
    const problemTextBlock = blocks[problemIndex + 1];
    if (problemTextBlock.type === "paragraph") {
      journey.pinnedProblem = extractTextFromBlockContent(problemTextBlock);
      // 문제 블록들 제거
      blocks = [
        ...blocks.slice(0, problemIndex),
        ...blocks.slice(problemIndex + 2),
      ];
    }
  }

  // 나머지 블록들을 그룹과 스텝으로 파싱
  blocks.forEach((block) => {
    if (block.type === "heading" && block.props?.level === 2) {
      // 새 그룹 시작
      if (currentGroup && currentGroup.steps.length > 0) {
        groups.push(currentGroup as unknown as GroupData);
      }

      currentGroup = {
        groupId: `group-${uuidv4()}`,
        groupLabel: extractTextFromBlockContent(block),
        mapDescription: "",
        steps: [],
      };
      currentStep = null;
    } else if (block.type === "paragraph" && currentGroup && !currentStep) {
      // 그룹 설명
      currentGroup.mapDescription = extractTextFromBlockContent(block);
    } else if (
      block.type === "heading" &&
      block.props?.level === 3 &&
      currentGroup
    ) {
      // 새 스텝 시작
      if (currentStep) {
        currentGroup.steps.push(currentStep);
      }

      currentStep = {
        id: (currentGroup.steps.length + 10).toString(),
        label: extractTextFromBlockContent(block),
        desc: "",
        content: [],
      };
    } else if (block.type === "paragraph" && currentGroup && currentStep) {
      // 스텝 설명 또는 내용
      if (!currentStep.desc) {
        currentStep.desc = extractTextFromBlockContent(block);
      } else {
        // 이미 설명이 있으면 콘텐츠로 추가
        const content = extractTextFromBlockContent(block);
        if (content) {
          currentStep.content.push(content);
        }
      }
    }
  });

  // 마지막 그룹과 스텝 처리 - 타입 단언으로 해결
  if (currentStep && currentGroup) {
    (currentGroup as TempGroup).steps.push(currentStep);
  }

  if (currentGroup && (currentGroup as TempGroup).steps.length > 0) {
    groups.push(currentGroup as unknown as GroupData);
  }

  // 그룹이 하나도 없으면 기본 그룹과 단계 추가
  if (groups.length === 0) {
    console.log("No groups found, adding a default group and step");
    const defaultGroup: GroupData = {
      groupId: `group-${uuidv4()}`,
      groupLabel: "기본 그룹",
      mapDescription: "내용을 추가하려면 편집 버튼을 클릭하세요.",
      steps: [
        {
          id: 1,
          label: "기본 단계",
          desc: "이 단계는 기본적으로 생성되었습니다.",
          content: ["여기에 내용을 추가하세요."],
        } as Step,
      ],
    };
    groups.push(defaultGroup);
  }

  journey.groups = groups;
  return { journey, groups };
};

// 블록 콘텐츠에서 텍스트 추출 (helper 함수)
function extractTextFromBlockContent(block: BlockNoteBlock): string {
  // 타입 안전을 위한 접근 방식
  // BlockNote의 content 속성은 블록 타입에 따라 다름
  const content = (block as any).content;

  if (!content) return "";

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        // @ts-ignore - BlockNote 타입과 호환성 이슈 우회
        if (item.type === "text") return item.text;
        // @ts-ignore - BlockNote 타입과 호환성 이슈 우회
        if (item.type === "link" && Array.isArray(item.content)) {
          // @ts-ignore - BlockNote 타입과 호환성 이슈 우회
          return item.content.map((c) => c.text).join("");
        }
        return "";
      })
      .join("");
  }

  return "";
}
