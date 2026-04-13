import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { BarChart3, Layers, ExternalLink, Zap, ArrowLeftRight } from "lucide-react";

const navItems = [
  { path: "/", label: "Indexes", icon: Layers },
  { path: "/tokens", label: "All Tokens", icon: BarChart3 },
  { path: "/compare", label: "Compare", icon: ArrowLeftRight },
];

export default function Header() {
  const location = useLocation();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="border-b border-bags-border/50 bg-bags-dark/80 backdrop-blur-xl sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img
                src="/icon.svg"
                alt="BagsIndex"
                className="w-9 h-9 rounded-lg shadow-lg shadow-bags-primary/20 group-hover:shadow-bags-primary/40 transition-shadow"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-bags-green rounded-full border-2 border-bags-dark pulse-dot" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white tracking-tight">
                BagsIndex
              </span>
              <Badge variant="default" className="hidden sm:inline-flex">
                <Zap className="w-3 h-3 mr-1" />
                AI Agent
              </Badge>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
            <div className="w-px h-6 bg-bags-border mx-2 hidden sm:block" />
            <a
              href="https://bags.fm"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" className="gap-2">
                Open Bags
                <ExternalLink className="w-3 h-3" />
              </Button>
            </a>
          </nav>
        </div>
      </div>
    </motion.header>
  );
}
