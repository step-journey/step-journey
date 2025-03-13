import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ReactModal from "react-modal";
import "@/index.css"; // Tailwind Global Styles
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import "@/styles/text-editor.css";

import BootstrapApp from "./components/common/BootstrapApp.tsx";

ReactModal.setAppElement("#root");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BootstrapApp />
  </StrictMode>,
);
