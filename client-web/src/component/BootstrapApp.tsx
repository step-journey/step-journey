import { BrowserRouter } from "react-router-dom";
import { ProviderBuilder } from "../utils/ProviderBuilder.tsx";
import App from "../App.tsx";

export default function BootstrapApp() {
  const ProviderWrappedApp = new ProviderBuilder(() => <App />).build();

  return (
    <BrowserRouter>
      <ProviderWrappedApp />
    </BrowserRouter>
  );
}
