import { BrowserRouter } from "react-router-dom";
import { MantineProvider, createTheme } from "@mantine/core";
import { ProviderBuilder } from "../utils/ProviderBuilder";
import App from "../App";

export default function BootstrapApp() {
  const mantineTheme = createTheme({
    fontFamily:
      "Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    primaryColor: "blue",
  });

  const ProviderWrappedApp = new ProviderBuilder(() => <App />)
    .wrap(MantineProvider, {
      theme: mantineTheme,
      defaultColorScheme: "light" as const,
    })
    .build();

  return (
    <BrowserRouter>
      <ProviderWrappedApp />
    </BrowserRouter>
  );
}
