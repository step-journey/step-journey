import { useNavigate } from "react-router-dom";
import { Accordion, Button, List, Text, Title } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";

export default function AboutPage() {
  const navigate = useNavigate();

  const goHome = () => {
    navigate("/");
  };

  return (
    <div style={{ padding: "1rem" }}>
      {/* 돌아가기 버튼을 상단에 배치 */}
      <div style={{ marginBottom: "1rem" }}>
        <Button variant="outline" size="xs" onClick={goHome}>
          돌아가기
        </Button>
      </div>

      <Title order={2} mb="md">
        패킷의 여행 (PacketJourney)
      </Title>

      {/* 아이디에이션 */}
      <Accordion
        variant="separated"
        multiple
        defaultValue={["ideation"]}
        /* chevron을 왼쪽(Accordion.Control 앞)에 배치 */
        chevronPosition="left"
        /* 펼쳐지기 전 아이콘 */
        chevron={<IconChevronRight size={16} />}
        /* styles에서 아이콘과 텍스트 사이 간격 조절 등 가능 */
        styles={{
          chevron: {
            marginRight: 8, // (왼쪽에 아이콘이 오므로 marginRight를 설정)
          },
        }}
      >
        <Accordion.Item value="ideation">
          <Accordion.Control>
            <Text fw={600} size="sm">
              2025.01.13 (월) 아이디에이션
            </Text>
          </Accordion.Control>
          <Accordion.Panel>
            <List size="sm" withPadding>
              <List.Item>
                <Text fw={500}>한 줄 소개</Text>
                <List size="sm" withPadding listStyleType="disc">
                  <List.Item>
                    일상적으로 사용하는 앱의 기능을 단계별로 조작하며 동작
                    원리를 이해하게 해주는 교육 서비스
                  </List.Item>
                </List>
              </List.Item>
              <List.Item>
                <Text fw={500}>풀고자 하는 문제</Text>
                <List size="sm" withPadding listStyleType="disc">
                  <List.Item>
                    매우 중요한 기술인 소프트웨어 개발을 재미없는 방식으로 접해
                    흥미를 가지지 못하는 문제
                  </List.Item>
                  <List.Item>
                    전체 그림을 파악하지 않고 이론적·개념적 학습만 진행해
                    동기부여가 떨어지는 문제
                  </List.Item>
                  <List.Item>
                    큰 그림을 모르면 학습이 불안하고 재미가 없어 학습 효율이
                    떨어짐
                  </List.Item>
                  <List.Item>
                    반면, 소프트웨어 개발을 “패킷 이동을 위한 여정 준비”라고
                    생각하면 여행처럼 재미있는 접근 가능
                  </List.Item>
                  <List.Item>
                    재미 없는 간단한 예시 서비스로만 학습할 때 몰입도나 재미가
                    부족
                  </List.Item>
                </List>
              </List.Item>
              <List.Item>
                <Text fw={500}>솔루션</Text>
                <List size="sm" withPadding listStyleType="disc">
                  <List.Item>
                    **실제 앱 중심**의 “디버거형” 학습: 매일 쓰는 앱의 특정
                    기능을 단계별로 추적하고 직접 조작
                  </List.Item>
                  <List.Item>
                    **‘큰 그림’을 먼저 보여주는 접근**: 패킷 이동의 전체 흐름을
                    스토리텔링(“데이터의 여행”)으로 학습 흥미 유발
                  </List.Item>
                  <List.Item>
                    **직접 조작**을 통한 능동적 학습: 앞으로/뒤로 이동하며 실제
                    코드, 서버 로그, API 응답 등을 디버거처럼 확인
                  </List.Item>
                  <List.Item>
                    **사용자 친화적인 웹 서비스**: 브라우저만 있으면 되고,
                    IntelliJ 디버거와 유사한 단계 이동/중단점/스택 보기 기능
                  </List.Item>
                  <List.Item>
                    **개인화된 학습 시나리오**: 게임 레벨을 클리어하듯 주요
                    기능별 체크리스트 제공, 가상 배지로 동기부여 유지
                  </List.Item>
                </List>
              </List.Item>
            </List>
          </Accordion.Panel>
        </Accordion.Item>

        {/* 1차 구현 */}
        <Accordion.Item value="implementation">
          <Accordion.Control>
            <Text fw={600} size="sm">
              2025.01.14 (화) 1차 구현
            </Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text size="sm">
              실제 학습 환경에 적용하기 위해 초기 버전을 구현했습니다.
              디버거처럼 단계별 추적이 가능한 UI를 제공하며,
              <br />
              추후 더욱 다양한 기능(메모 기능, 단계별 퀴즈, 기록 공유 등)을
              추가할 예정입니다.
            </Text>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </div>
  );
}
