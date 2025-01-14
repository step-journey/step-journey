import { useState, useEffect } from "react";
import {
  Button,
  Text,
  Container,
  Group,
  Stack,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import { darkThemeClass } from "../../styles/theme.css";

const Test = () => {
  // 1) Mantine 다크 모드 제어
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  // 2) Vanilla Extract 다크 모드 제어 (html 태그에 darkThemeClass 붙임)
  const [vanillaDark, setVanillaDark] = useState(false);

  useEffect(() => {
    const rootElement = document.documentElement;
    if (vanillaDark) {
      rootElement.classList.add(darkThemeClass);
    } else {
      rootElement.classList.remove(darkThemeClass);
    }
  }, [vanillaDark]);

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Title>Mantine + Vanilla Extract Test Page</Title>

        {/* Mantine color scheme 상태 */}
        <Text>Mantine color scheme: {colorScheme}</Text>
        <Group>
          <Button onClick={() => setColorScheme("light")}>Mantine Light</Button>
          <Button onClick={() => setColorScheme("dark")}>Mantine Dark</Button>
        </Group>

        {/* Vanilla Extract 다크 모드 상태 */}
        <Text>Vanilla color scheme: {vanillaDark ? "dark" : "light"}</Text>
        <Group>
          <Button onClick={() => setVanillaDark(false)}>Vanilla Light</Button>
          <Button onClick={() => setVanillaDark(true)}>Vanilla Dark</Button>
        </Group>

        {/* Mantine 버튼 예시 */}
        <Group>
          <Button variant="filled">Filled Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="light">Light Button</Button>
        </Group>
      </Stack>
    </Container>
  );
};

export default Test;
