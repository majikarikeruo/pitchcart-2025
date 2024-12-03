import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Entry from "@/pages/Entry";
import Result from "@/pages/Result";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@/style.css";

function App() {
  return (
    <MantineProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/entry" element={<Entry />} />
          <Route path="/result" element={<Result />} />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;
