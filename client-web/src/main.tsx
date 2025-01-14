import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import BootstrapApp from "./component/BootstrapApp.tsx";

const rootElement = document.getElementById("root")!;

createRoot(rootElement).render(
  <StrictMode>
    <BootstrapApp />
  </StrictMode>,
);
