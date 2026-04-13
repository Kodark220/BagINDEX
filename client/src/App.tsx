import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import IndexDetail from "./components/IndexDetail";
import Tokens from "./components/Tokens";
import Compare from "./components/Compare";
import { Toaster } from "./components/ui/toaster";

export default function App() {
  return (
    <div className="min-h-screen bg-bags-dark">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/index/:id" element={<IndexDetail />} />
          <Route path="/tokens" element={<Tokens />} />
          <Route path="/compare" element={<Compare />} />
        </Routes>
      </main>
      <Toaster />
    </div>
  );
}
