import { globalStyle } from "@vanilla-extract/css";
import { vars } from "./theme.css";
import "./font.css.ts";

// 기본 Reset-ish
globalStyle("html, body", {
  margin: 0,
  padding: 0,
  fontFamily: vars.font.sans,
  backgroundColor: vars.color.bg,
  color: vars.color.text,
});

globalStyle("a", {
  textDecoration: "none",
  color: "inherit",
});
