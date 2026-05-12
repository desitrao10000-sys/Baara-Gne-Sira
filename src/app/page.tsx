"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Dock from "@/components/Dock";
import ProjectGrid from "@/components/ProjectGrid";
import ProjectView from "@/components/ProjectView";

export default function Home() {
  const [currentView, setCurrentView] = useState("home");
  const [activeTab, setActiveTab] = useState("home");
  
  // MÉMOIRE GLOBALE DES PROJETS (Pour éviter qu'ils disparaissent)
  const [projects, setProjects] = useState<string[]>([]);

  const handleAppClick = (id: string) => {
    if (id === "project") {
      setCurrentView("project");
      setActiveTab("todo-project");
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      setCurrentView("home");
    } else if (tabId === "todo-project") {
      setCurrentView("project");
    }
  };

  const handleBack = () => {
    setCurrentView("home");
    setActiveTab("home");
  };

  const getHeaderTitle = () => {
    switch (currentView) {
      case "project": return "Gestion Projet";
      default: return "Baara Gnè - Sira";
    }
  };

  return (
    <main className="flex flex-col h-screen overflow-hidden bg-pastel">
      <Header 
        title={getHeaderTitle()} 
        showBack={currentView !== "home"} 
        onBack={handleBack} 
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {currentView === "home" ? (
          <ProjectGrid onAppClick={handleAppClick} />
        ) : currentView === "project" ? (
          <ProjectView projects={projects} setProjects={setProjects} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 font-bold italic p-10 text-center">
            Le module {activeTab} est en cours de développement...
          </div>
        )}
      </div>

      <Dock activeTab={activeTab} onTabChange={handleTabChange} />

      {/* System Bar (Fonctionnelle) */}
      <div className="h-[45px] bg-black flex justify-between items-center px-12 shrink-0">
        <button 
          onClick={handleBack}
          className="text-slate-400 hover:text-white text-[11px] font-extrabold tracking-tighter transition-colors"
        >
          PRÉCÉDENT
        </button>
        <button 
          className="text-slate-600 text-[11px] font-extrabold tracking-tighter cursor-not-allowed"
        >
          SUIVANT
        </button>
      </div>
    </main>
  );
}
