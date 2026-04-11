import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import IndexDetail from "./components/IndexDetail";
import Tokens from "./components/Tokens";

export default function App() {
  return (
    <div className="min-h-screen bg-bags-dark">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/index/:id" element={<IndexDetail />} />
          <Route path="/tokens" element={<Tokens />} />
        </Routes>
      </main>
    </div>
  );
}
