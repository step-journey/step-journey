import { globalFontFace } from "@vanilla-extract/css";

/* JetBrains Mono */
globalFontFace("JetBrainsMono", {
  src: 'url("/fonts/JetBrainsMono-2.304/JetBrainsMono-Regular.woff2") format("woff2")',
  fontWeight: "400",
  fontStyle: "normal",
  fontDisplay: "swap",
});

globalFontFace("JetBrainsMono", {
  src: 'url("/fonts/JetBrainsMono-2.304/JetBrainsMono-Bold.woff2") format("woff2")',
  fontWeight: "700",
  fontStyle: "normal",
  fontDisplay: "swap",
});

/* Pretendard Variable (가변 폰트) */
globalFontFace("Pretendard", {
  src: 'url("/fonts/Pretendard-1.3.9/PretendardVariable.woff2") format("woff2-variations")',
  fontWeight: "100 900", // 가변 범위 예시
  fontStyle: "normal",
  fontDisplay: "swap",
});
