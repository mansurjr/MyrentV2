import AppRouter from "./pages";
import { Toaster } from "@/components/ui/toaster";

export function App() {
  return (
    <>
      <AppRouter />
      <Toaster />
    </>
  );
}

export default App;