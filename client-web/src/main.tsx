import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ReactModal from "react-modal";
import "@/index.css"; // Tailwind Global Styles
import "@/styles/text-editor.css";
import "@/styles/dnd-styles.css";
import "@/styles/alert-block.css";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import { QueryProvider } from "@/providers/QueryProvider";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import App from "@/App";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

ReactModal.setAppElement("#root");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <BrowserRouter>
        <TooltipProvider>
          <App />
        </TooltipProvider>
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition={"bottom-left"}
        />
      </BrowserRouter>
    </QueryProvider>
  </StrictMode>,
);
