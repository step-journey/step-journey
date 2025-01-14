import { globalStyle } from "@vanilla-extract/css";
import { vars } from "./theme.css";
import "./font.css.ts";

/* 1) 박스 사이징 & Reset-ish */
globalStyle("*", {
  boxSizing: "border-box",
  margin: 0,
  padding: 0,
});
globalStyle("*::before, *::after", {
  boxSizing: "inherit",
});

globalStyle("html", {
  fontSize: "16px",
  lineHeight: "1.5",
  WebkitTextSizeAdjust: "100%",
});

globalStyle("html, body", {
  margin: 0,
  padding: 0,
  fontFamily: vars.font.sans,
  backgroundColor: vars.color.bg.primary,
  color: vars.color.text.primary,
  width: "100%",
  height: "100%",
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
});

/* 2) 앵커 태그 기본 제거 */
globalStyle("a", {
  textDecoration: "none",
  color: "inherit",
});

/* 3) 리스트 기본 제거 */
globalStyle("ul, ol", {
  margin: 0,
  padding: 0,
  listStyle: "none",
});

/* 4) 이미지/비디오, SVG 등 반응형 */
globalStyle("img, svg, video, canvas, picture", {
  display: "block",
  maxWidth: "100%",
  height: "auto",
});

/* 5) Button 초기화 */
globalStyle("button", {
  border: "none",
  background: "none",
  padding: 0,
  cursor: "pointer",
  fontFamily: "inherit",
  color: "inherit",
});

/* 6) Input, Textarea 기본 폰트 & 아웃라인 제거 */
globalStyle("input, textarea", {
  fontFamily: "inherit",
  border: "none",
  outline: "none",
  backgroundColor: "transparent",
  color: "inherit",
});
