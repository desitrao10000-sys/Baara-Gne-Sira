"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Dock from "@/components/Dock";
import ProjectGrid from "@/components/ProjectGrid";
import ProjectView from "@/components/ProjectView";
import ProjectDetailView from "@/components/ProjectDetailView";
import ProjectCreationWizard, { ProjectInfo } from "@/components/ProjectCreationWizard";
import BusinessPlanWizard, { BusinessPlanData } from "@/components/BusinessPlanWizard";
import { useSupabaseProjects, Project } from "@/lib/useSupabaseProjects";
import { PlusCircle, ChevronRight, FolderKanban, Calendar, MapPin } from "lucide-react";

export default function Home() {
  const [currentView, setCurrentView] = useState("home");
  const [activeTab, setActiveTab] = useState("home");
  const { projects, loading, saveProject, deleteProject, saveBusinessPlan } = useSupabaseProjects();
  const [showWizard, setShowWizard] = useState(false);
  const [showBusinessPlan, setShowBusinessPlan] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleAppClick = (id: string) => {
    if (id === "project") {
      setCurrentView("project-list");
      setActiveTab("todo-project");
    } else {
      setCurrentView(id);
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") setCurrentView("home");
    else if (tabId === "todo-project") setCurrentView("project-list");
  };

  const handleBack = () => {
    setCurrentView("home");
    setActiveTab("home");
  };

  const handleWizardComplete = (info: ProjectInfo) => {
    const newProject: Project = { id: crypto.randomUUID(), info, createdAt: new Date().toISOString() };
    saveProject(newProject);
    setShowWizard(false);
    setSelectedProject(newProject);
    setCurrentView("project-detail");
  };

  if (loading) {
    return (
      <main className="flex flex-col h-screen items-center justify-center bg-pastel">
        <div className="text-2xl font-black text-slate-700 animate-pulse">Chargement...</div>
      </main>
    );
  }

  // Show creation wizard fullscreen
  if (showWizard) {
    return <ProjectCreationWizard onComplete={handleWizardComplete} onCancel={() => setShowWizard(false)} />;
  }

  // Show business plan wizard fullscreen
  if (showBusinessPlan && selectedProject) {
    const existingBP = selectedProject.businessPlan ? (JSON.parse(selectedProject.businessPlan) as BusinessPlanData) : undefined;
    return (
      <BusinessPlanWizard
        initialData={existingBP}
        onComplete={async (bpData) => {
          await saveBusinessPlan(selectedProject.id, bpData);
          setSelectedProject((prev) => prev ? { ...prev, businessPlan: JSON.stringify(bpData) } : null);
          setShowBusinessPlan(false);
        }}
        onBack={() => setShowBusinessPlan(false)}
      />
    );
  }

  return (
    <main className="flex flex-col h-screen overflow-hidden bg-pastel">
      <Header title={currentView === "project-list" ? "Mes Projets" : currentView === "project" ? "Gestion Projet" : "Baara Gnè - Sira"} showBack={currentView !== "home"} onBack={handleBack} />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {currentView === "home" ? (
          <ProjectGrid onAppClick={handleAppClick} />
        ) : currentView === "project-list" ? (
          <ProjectListView projects={projects} onCreateProject={() => setShowWizard(true)} onSelectProject={(p) => { setSelectedProject(p); setCurrentView("project-detail"); }} />
        ) : currentView === "project-detail" && selectedProject ? (
          <ProjectDetailView
            project={selectedProject}
            onBack={() => { setCurrentView("project-list"); setSelectedProject(null); }}
            onSave={async (updatedInfo: ProjectInfo) => {
              const updated = { ...selectedProject, info: updatedInfo };
              await saveProject(updated);
              setSelectedProject(updated);
            }}
            onSaveBusinessPlan={async (bpData: BusinessPlanData) => {
              await saveBusinessPlan(selectedProject.id, bpData);
              setSelectedProject((prev) => prev ? { ...prev, businessPlan: JSON.stringify(bpData) } : null);
            }}
            onDelete={async (projectId: string) => {
              await deleteProject(projectId);
              setSelectedProject(null);
              setCurrentView("project-list");
            }}
            onStartBusinessPlan={() => setShowBusinessPlan(true)}
            onDeleteBusinessPlan={async () => {
              const updated = { ...selectedProject, businessPlan: null };
              await saveProject(updated);
              setSelectedProject(updated);
            }}
          />
        ) : currentView === "project" ? (
          <ProjectView projects={projects.map((p) => p.info.name)} setProjects={() => { }} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 font-bold italic p-10 text-center">
            Le module « {currentView} » est en cours de développement...
          </div>
        )}
      </div>

      <Dock activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="h-[45px] bg-black flex justify-between items-center px-12 shrink-0">
        <button onClick={handleBack} className="text-slate-400 hover:text-white text-[11px] font-extrabold tracking-tighter transition-colors">PRÉCÉDENT</button>
        <button className="text-slate-600 text-[11px] font-extrabold tracking-tighter cursor-not-allowed">SUIVANT</button>
      </div>
    </main>
  );
}

// ─── Project List Component ────────────────────────────────────────
function ProjectListView({ projects, onCreateProject, onSelectProject }: { projects: Project[]; onCreateProject: () => void; onSelectProject: (p: Project) => void; }) {
  const sectorLabels: Record<string, string> = { commerce: "🛒 Commerce", agriculture: "🌾 Agriculture", service: "💼 Service", industrie: "🏭 Industrie", elevage: "🐄 Élevage", artisanat: "🪵 Artisanat", transport: "🚚 Transport", technologie: "💻 Technologie", sante: "🏥 Santé", education: "📚 Éducation", restauration: "🍽️ Restauration", batiment: "🏗️ Bâtiment" };
  const durationLabels: Record<string, string> = { "3-mois": "3 mois", "6-mois": "6 mois", "1-an": "1 an", "2-ans": "2 ans", "3-ans": "3 ans", "5-ans": "5 ans", "10-ans": "10 ans" };

  return (
    <div className="flex-1 overflow-y-auto p-5 slide-in">
      <div className="bg-white rounded-[25px] p-5 shadow-md border border-slate-200 mb-5">
        <h2 className="text-xl font-black text-slate-900 mb-2">Mes Projets</h2>
        <p className="text-sm text-slate-700 mb-4 font-semibold">Crée un nouveau projet pour commencer à planifier, exécuter et suivre ton activité.</p>
        <button onClick={onCreateProject} className="w-full py-4 bg-gradient-to-r from-[var(--bg-navy-textured)] to-blue-700 text-white rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95 transition-transform">
          <PlusCircle size={20} /> Créer un Nouveau Projet
        </button>
      </div>

      {projects.length > 0 && (
        <div className="mt-2">
          <h3 className="text-lg font-black text-slate-800 mb-4 ml-2">Projets créés ({projects.length})</h3>
          <div className="space-y-3">
            {projects.map((project) => (
              <button key={project.id} onClick={() => onSelectProject(project)} className="w-full bg-white p-4 px-5 rounded-2xl flex items-center gap-4 shadow-md border-l-4 border-[var(--vibrant-blue)] active:scale-[0.98] transition-transform text-left border-y border-r border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0"><FolderKanban size={24} className="text-blue-700" /></div>
                <div className="flex-1 min-w-0">
                  <span className="font-black text-slate-900 block truncate">{project.info.name}</span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-700 font-bold">{sectorLabels[project.info.sector] || project.info.sector}</span>
                    {project.info.location && <span className="text-xs text-slate-600 font-semibold flex items-center gap-1"><MapPin size={10} />{project.info.location}</span>}
                    {project.info.duration && <span className="text-xs text-slate-600 font-semibold flex items-center gap-1"><Calendar size={10} />{durationLabels[project.info.duration] || project.info.duration}</span>}
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {projects.length === 0 && (
        <div className="text-center py-10">
          <div className="text-6xl mb-4">📁</div>
          <p className="text-slate-400 font-bold">Aucun projet pour le moment</p>
          <p className="text-slate-400 text-sm mt-1">Crée ton premier projet pour commencer !</p>
        </div>
      )}
    </div>
  );
}