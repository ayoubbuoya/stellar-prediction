import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t-4 border-border bg-secondary-background mt-auto">
      <div className="container mx-auto px-4 py-6">
        <p className="text-sm text-foreground font-base text-center">
          © {new Date().getFullYear()} Stellar Prediction Market. Licensed
          under the{" "}
          <a
            href="http://www.apache.org/licenses/LICENSE-2.0"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-main transition-colors"
          >
            Apache License, Version 2.0
          </a>
          .
        </p>
      </div>
    </footer>
  );
};
