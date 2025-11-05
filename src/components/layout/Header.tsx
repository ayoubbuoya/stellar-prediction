import React from "react";
import { NavLink } from "react-router-dom";
import { Button } from "../ui/button";
import { Code2 } from "lucide-react";
import ConnectAccount from "../ConnectAccount";

interface HeaderProps {
  projectTitle: string;
}

export const Header: React.FC<HeaderProps> = ({ projectTitle }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b-4 border-border bg-secondary-background shadow-nav">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
            <h1 className="text-xl font-heading font-bold text-foreground">
              {projectTitle}
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-2">
            <NavLink to="/debug" style={{ textDecoration: "none" }}>
              {({ isActive }) => (
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <Code2 className="w-4 h-4" />
                  Debugger
                </Button>
              )}
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ConnectAccount />
        </div>
      </div>
    </header>
  );
};
