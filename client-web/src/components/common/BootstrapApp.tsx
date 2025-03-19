import { BrowserRouter } from "react-router-dom";
import App from "../../App";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient();

export default function BootstrapApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <App />
        </TooltipProvider>
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition={"bottom-left"}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
