import { BrowserRouter } from "react-router-dom";
import App from "../../App";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryProvider } from "@/providers/QueryProvider";

export default function BootstrapApp() {
  return (
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
  );
}
