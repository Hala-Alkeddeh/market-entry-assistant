import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Input from "../pages/Input";
import Analysis from "../pages/Analysis";
import Result from "../pages/Result";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/input" element={<Input />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/result" element={<Result />} />
      </Routes>
    </BrowserRouter>
  );
}