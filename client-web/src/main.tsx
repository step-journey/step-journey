import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import BootstrapApp from "./component/BootstrapApp.tsx";
import "@mantine/core/styles.css";
import "./styles/global.css.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BootstrapApp />
  </StrictMode>,
);
