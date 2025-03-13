import { BlockEditor } from "@/components/BlockEditor";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BlockEditor />
    </QueryClientProvider>
  );
}

export default App;
