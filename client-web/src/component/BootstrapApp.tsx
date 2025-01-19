import { BrowserRouter } from "react-router-dom";
import { ProviderBuilder } from "@/utils/ProviderBuilder";
import App from "../App";

export default function BootstrapApp() {
  const ProviderWrappedApp = new ProviderBuilder(() => <App />).build();

  return (
    <BrowserRouter>
      <ProviderWrappedApp />
    </BrowserRouter>
  );
}
