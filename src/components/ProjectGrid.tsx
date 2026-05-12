"use client";

import React, { useRef, useEffect, useState } from "react";
import * as Icons from "lucide-react";

interface AppItem {
  id: string;
  label: string;
  icon: keyof typeof Icons;
  color: 'blue' | 'yellow' | 'green';
}

const apps: AppItem[] = [
  // Page 1
  { id: 'project', label: 'Projet', icon: 'FolderKanban', color: 'blue' },
  { id: 'calendar', label: 'Calendrier', icon: 'Calendar', color: 'green' },
  { id: 'risks', label: 'Risques', icon: 'AlertTriangle', color: 'yellow' },
  { id: 'portfolio', label: 'Portefeuille', icon: 'Wallet', color: 'green' },
  { id: 'resources', label: 'Ressources', icon: 'Truck', color: 'yellow' },
  { id: 'status', label: 'Bilan Projet', icon: 'FilePieChart', color: 'blue' },
  { id: 'reports', label: 'Rapports', icon: 'FileText', color: 'yellow' },
  { id: 'ai-pred', label: 'IA Prédictive', icon: 'BrainCircuit', color: 'blue' },
  // Page 2
  { id: 'vault', label: 'Coffre-fort', icon: 'ShieldCheck', color: 'blue' },
  { id: 'radar', label: 'Radar Santé', icon: 'Activity', color: 'green' },
  { id: 'ai-import', label: 'IA Import', icon: 'Brain', color: 'yellow' },
  { id: 'partners', label: 'Partenaires', icon: 'Handshake', color: 'green' },
  { id: 'messages', label: 'Messages', icon: 'MessageSquare', color: 'blue' },
  { id: 'settings', label: 'Paramètres', icon: 'Settings', color: 'green' },
  { id: 'team', label: 'Équipe', icon: 'Users', color: 'yellow' },
];

interface ProjectGridProps {
  onAppClick: (id: string) => void;
}

export default function ProjectGrid({ onAppClick }: ProjectGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);

  const handleScroll = () => {
    if (scrollRef.current) {
      const page = Math.round(scrollRef.current.scrollLeft / scrollRef.current.offsetWidth);
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
        {/* Page 1 (8 items) */}
        <div className="min-width-full w-full shrink-0 snap-start grid grid-cols-3 gap-6 p-6 content-start">
          {apps.slice(0, 8).map((app) => (
            <div key={app.id} onClick={() => onAppClick(app.id)} className="flex flex-col items-center gap-2 cursor-pointer">
              <div className={`w-[72px] h-[72px] rounded-[20px] flex items-center justify-center shadow-lg shine-effect ${colorClasses[app.color]}`}>
                {/* @ts-ignore */}
                {React.createElement(Icons[app.icon], { size: 30 })}
              </div>
              <span className="text-[13px] font-extrabold text-slate-700 text-center leading-tight">
                {app.label}
              </span>
            </div>
          ))}
        </div>

        {/* Page 2 (7 items) */}
        <div className="min-width-full w-full shrink-0 snap-start grid grid-cols-3 gap-6 p-6 content-start">
          {apps.slice(8).map((app) => (
            <div key={app.id} onClick={() => onAppClick(app.id)} className="flex flex-col items-center gap-2 cursor-pointer">
              <div className={`w-[72px] h-[72px] rounded-[20px] flex items-center justify-center shadow-lg shine-effect ${colorClasses[app.color]}`}>
                {/* @ts-ignore */}
                {React.createElement(Icons[app.icon], { size: 30 })}
              </div>
              <span className="text-[13px] font-extrabold text-slate-700 text-center leading-tight">
                {app.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 pb-4">
        <div className={`h-1.5 rounded-full transition-all duration-300 ${activePage === 0 ? "w-4 bg-navy-800 bg-[var(--bg-navy-textured)]" : "w-1.5 bg-slate-300"}`} />
        <div className={`h-1.5 rounded-full transition-all duration-300 ${activePage === 1 ? "w-4 bg-navy-800 bg-[var(--bg-navy-textured)]" : "w-1.5 bg-slate-300"}`} />
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .min-width-full { min-width: 100%; }
      `}</style>
    </div>
  );
}
