import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ReactModal from "react-modal";
import "@/index.css"; // Tailwind Global Styles

import BootstrapApp from "./components/common/BootstrapApp.tsx";

ReactModal.setAppElement("#root");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BootstrapApp />
  </StrictMode>,
);
