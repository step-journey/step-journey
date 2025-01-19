import { BrowserRouter } from "react-router-dom";
import { ProviderBuilder } from "@/utils/ProviderBuilder";
import App from "../App";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function BootstrapApp() {
  const ProviderWrappedApp = new ProviderBuilder(() => <App />)
    .wrap(TooltipProvider)
    .build();

  return (
    <BrowserRouter>
      <ProviderWrappedApp />
    </BrowserRouter>
  );
}
