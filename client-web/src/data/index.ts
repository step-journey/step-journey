/**
 * client-web/src/data/index.ts
 *
 * 이 파일은 data 폴더에 있는 여러 phase별 JSON을 import해서
 * groupData, flattenSteps 등을 production-ready 형태로 내보낸다.
 */

// 1) import
import phase1 from "./phase1.json";
import phase2 from "./phase2.json";
import phase3 from "./phase3.json";
import phase4 from "./phase4.json";
import phase5 from "./phase5.json";

import { GroupData, FlattenedStep } from "@/types/journey";

// 2) JSON → GroupData 형 변환 (TS에서 JSON import 시 any로 인식할 수 있으므로 as 단언 사용)
const phase1Data = phase1 as GroupData;
const phase2Data = phase2 as GroupData;
const phase3Data = phase3 as GroupData;
const phase4Data = phase4 as GroupData;
const phase5Data = phase5 as GroupData;

// 3) groupData: 여러 phase들을 하나의 배열로 합치기
export const groupData: GroupData[] = [
  phase1Data,
  phase2Data,
  phase3Data,
  phase4Data,
  phase5Data,
];

/**
 * 4) flattenSteps: groupData를 일렬로 펼치면서 globalIndex를 매긴다
 *    - 각 groupData의 steps 개수만큼 오프셋을 누적하여 globalIndex를 계산
 */
export const flattenSteps: FlattenedStep[] = groupData.flatMap(
  (grp, groupIdx) => {
    // 앞선 group들의 steps.length 합을 offset으로 사용
    const offset = groupData
      .slice(0, groupIdx)
      .reduce((acc, g) => acc + g.steps.length, 0);

    return grp.steps.map((step, stepIdx) => ({
      ...step,
      groupId: grp.groupId,
      stepIdInGroup: step.id,
      globalIndex: offset + stepIdx,
    }));
  },
);

// production-level 에서는 export만 있어도 충분하며, 필요하다면 default export도 가능
// export default { groupData, flattenSteps };
