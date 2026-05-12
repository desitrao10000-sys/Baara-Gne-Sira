"use client";

import { ListChecks, Home, UserCheck, CalendarRange } from "lucide-react";

interface DockProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Dock({ activeTab, onTabChange }: DockProps) {
  const tabs = [
    { id: 'todo-project', label: 'Todo-Projet', icon: ListChecks },
    { id: 'home', label: 'Accueil', icon: Home },
    { id: 'todo-perso', label: 'Todo-Perso', icon: UserCheck },
    { id: 'gantt', label: 'Gantt', icon: CalendarRange },
  ];

  return (
    <nav className="textured-navy p-4 flex justify-around items-center shrink-0">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className="flex flex-col items-center gap-1 text-white"
        >
          {/* Toutes les icônes en Jaune Or */}
          <tab.icon 
            size={24} 
            className="text-primary-yellow" 
          />
          <span className={`text-[10px] font-bold ${activeTab === tab.id ? "text-primary-yellow" : "text-white/70"}`}>
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
