import { BrowserRouter } from "react-router-dom";
import { ProviderBuilder } from "@/utils/ProviderBuilder";
import App from "../App";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function BootstrapApp() {
  const ProviderWrappedApp = new ProviderBuilder(() => <App />)
    .wrap(TooltipProvider)
    .wrap(QueryClientProvider, { client: queryClient })
    .build();

  return (
    <BrowserRouter>
      <ProviderWrappedApp />
    </BrowserRouter>
  );
}
