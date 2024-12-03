import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Entry from "@/pages/Entry";
import Result from "@/pages/Result";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/entry" element={<Entry />} />
        <Route path="/result" element={<Result />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
