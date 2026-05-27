"use client";

import React, { useRef, useState } from "react";
import * as Icons from "lucide-react";

interface AppItem {
  id: string;
  label: string;
  icon: keyof typeof Icons;
  color: "blue" | "yellow" | "green";
}

// Exactement comme dans la maquette mobile_prototype.html
const apps: AppItem[] = [
  // Page 1 (6 modules)
  { id: "project", label: "Projet + Taches", icon: "FolderKanban", color: "blue" },
  { id: "dashboard", label: "Tableau de bord", icon: "LayoutDashboard", color: "green" },
  { id: "reports", label: "Rapports", icon: "FileText", color: "yellow" },
  { id: "portfolio", label: "Portefeuille", icon: "Wallet", color: "blue" },
  { id: "assistant-ia", label: "Assistant IA", icon: "Bot", color: "green" },
  { id: "alerts", label: "Alertes", icon: "Bell", color: "yellow" },
  // Page 2 (6 modules)
  { id: "team", label: "Equipe", icon: "Users", color: "blue" },
  { id: "partners", label: "Partenaires", icon: "Handshake", color: "yellow" },
  { id: "messages", label: "Messages", icon: "MessageSquare", color: "green" },
  { id: "vault", label: "Coffre-fort", icon: "ShieldCheck", color: "blue" },
  { id: "settings", label: "Paramètres", icon: "Settings", color: "yellow" },
  { id: "calendar", label: "Calendrier", icon: "Calendar", color: "green" },
];

interface ProjectGridProps {
  onAppClick: (id: string) => void;
}

export default function ProjectGrid({ onAppClick }: ProjectGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);

  const handleScroll = () => {
    if (scrollRef.current) {
      const page = Math.round(
        scrollRef.current.scrollLeft / scrollRef.current.offsetWidth
      );
      setActivePage(page);
    }
  };

  const colorClasses = {
    blue: "bg-vibrant-blue text-white",
    yellow: "bg-light-yellow text-[#854d0e]",
    green: "bg-light-green text-[#166534]",
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
      >
        {/* Page 1 — 6 modules en grille 2x3 */}
        <div className="min-width-full w-full shrink-0 snap-start grid grid-cols-2 grid-rows-3 gap-5 p-6 px-5 content-start">
          {apps.slice(0, 6).map((app) => (
            <div
              key={app.id}
              onClick={() => onAppClick(app.id)}
              className="flex flex-col items-center gap-2 cursor-pointer"
            >
              <div
                className={`w-[72px] h-[72px] rounded-[20px] flex items-center justify-center shadow-lg shine-effect ${colorClasses[app.color]}`}
              >
                {/* @ts-ignore */}
                {React.createElement(Icons[app.icon], { size: 30 })}
              </div>
              <span className="text-[14px] font-extrabold text-slate-900 text-center leading-tight">
                {app.label}
              </span>
            </div>
          ))}
        </div>

        {/* Page 2 — 6 modules en grille 2x3 */}
        <div className="min-width-full w-full shrink-0 snap-start grid grid-cols-2 grid-rows-3 gap-5 p-6 px-5 content-start">
          {apps.slice(6).map((app) => (
            <div
              key={app.id}
              onClick={() => onAppClick(app.id)}
              className="flex flex-col items-center gap-2 cursor-pointer"
            >
              <div
                className={`w-[72px] h-[72px] rounded-[20px] flex items-center justify-center shadow-lg shine-effect ${colorClasses[app.color]}`}
              >
                {/* @ts-ignore */}
                {React.createElement(Icons[app.icon], { size: 30 })}
              </div>
              <span className="text-[14px] font-extrabold text-slate-900 text-center leading-tight">
                {app.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 pb-3">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${activePage === 0
            ? "w-4 bg-[var(--bg-navy-textured)]"
            : "w-1.5 bg-slate-300"
            }`}
        />
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${activePage === 1
            ? "w-4 bg-[var(--bg-navy-textured)]"
            : "w-1.5 bg-slate-300"
            }`}
        />
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .min-width-full {
          min-width: 100%;
        }
      `}</style>
    </div>
  );
}