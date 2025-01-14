import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ReactModal from "react-modal";
import BootstrapApp from "./component/BootstrapApp.tsx";
import "@mantine/core/styles.css";
import "./styles/global.css.ts";

ReactModal.setAppElement("#root"); // <-- 추가

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BootstrapApp />
  </StrictMode>,
);
