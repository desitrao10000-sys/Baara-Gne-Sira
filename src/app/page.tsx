"use client";

import { useState, useRef } from "react";
import Header from "@/components/Header";
import Dock from "@/components/Dock";
import ProjectGrid from "@/components/ProjectGrid";
import ProjectView from "@/components/ProjectView";
import ProjectDetailView from "@/components/ProjectDetailView";
import ProjectSectionsLanding from "@/components/ProjectSectionsLanding";
import SectionTeamView from "@/components/SectionTeamView";
import SectionDetailView from "@/components/SectionDetailView";
import SectionTasksView from "@/components/SectionTasksView";
import ProjectCreationWizard, { ProjectInfo } from "@/components/ProjectCreationWizard";
import BusinessPlanWizard, { BusinessPlanData } from "@/components/BusinessPlanWizard";
import DocumentUploadFlow from "@/components/DocumentUploadFlow";
import GanttChart from "@/components/GanttChart";
import TodoProjet from "@/components/TodoProjet";
import TodoPerso from "@/components/TodoPerso";
import { useSupabaseProjects, Project } from "@/lib/useSupabaseProjects";
import { PlusCircle, ChevronRight, FolderKanban, Calendar, MapPin, Upload, FileText, Image, Sparkles, AlertCircle, CheckCircle2, X, Loader2 } from "lucide-react";

export default function Home() {
  const [currentView, setCurrentView] = useState("home");
  const [activeTab, setActiveTab] = useState("home");
  const { projects, loading, saveProject, deleteProject, saveBusinessPlan, saveManager, saveTasks, saveDocuments } = useSupabaseProjects();
  const [showWizard, setShowWizard] = useState(false);
  const [showBusinessPlan, setShowBusinessPlan] = useState(false);
  const [showDocUpload, setShowDocUpload] = useState(false);
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
    else if (tabId === "todo-project") setCurrentView("todo-projet");
    else if (tabId === "todo-perso") setCurrentView("todo-perso");
    else if (tabId === "gantt") setCurrentView("gantt");
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
    setCurrentView("sections-landing");
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

  // Show document upload flow fullscreen
  if (showDocUpload) {
    return (
      <DocumentUploadFlow
        onComplete={async (project) => {
          await saveProject(project);
          setShowDocUpload(false);
          setSelectedProject(project);
          setCurrentView("project-detail");
        }}
        onCancel={() => setShowDocUpload(false)}
      />
    );
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
          setCurrentView("sections-landing");
        }}
        onBack={() => { setShowBusinessPlan(false); setCurrentView("sections-landing"); }}
      />
    );
  }

  return (
    <main className="flex flex-col h-screen overflow-hidden bg-pastel">
      <Header title={currentView === "project-list" ? "Mes Projets" : currentView === "gantt" ? "Diagramme de Gantt" : currentView === "todo-projet" ? "Todo-Projet" : currentView === "todo-perso" ? "Todo-Perso" : currentView === "project" ? "Gestion Projet" : "Baara Gnè - Sira"} showBack={currentView !== "home"} onBack={handleBack} />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {currentView === "home" ? (
          <ProjectGrid onAppClick={handleAppClick} />
        ) : currentView === "project-list" ? (
          <ProjectListView projects={projects} onCreateProject={() => { setSelectedProject(null); setCurrentView("sections-landing"); }} onSelectProject={(p) => { setSelectedProject(p); setCurrentView("project-detail"); }} onDocUpload={() => setShowDocUpload(true)} />
        ) : currentView === "sections-landing" ? (
          <ProjectSectionsLanding
            project={selectedProject}
            onBack={() => { setCurrentView("project-list"); setSelectedProject(null); }}
            onSectionClick={(section) => {
              // Si pas de projet, en créer un minimal automatiquement
              let proj = selectedProject;
              if (!proj) {
                proj = {
                  id: crypto.randomUUID(),
                  info: { name: "", sector: "", location: "", zone: "", startDate: "", duration: "", description: "", objectives: "" },
                  createdAt: new Date().toISOString(),
                };
                saveProject(proj);
                setSelectedProject(proj);
              }
              if (section === "team") {
                setCurrentView("section-team");
              } else if (section === "detail") {
                setCurrentView("section-detail");
              } else if (section === "business") {
                setShowBusinessPlan(true);
              } else if (section === "tasks") {
                setCurrentView("section-tasks");
              }
            }}
            onCreateProject={() => setShowWizard(true)}
            onFinish={async () => {
              if (selectedProject) {
                await saveProject(selectedProject);
              }
              setSelectedProject(null);
              setCurrentView("project-list");
            }}
            onDelete={async (projectId: string) => {
              await deleteProject(projectId);
              setSelectedProject(null);
              setCurrentView("project-list");
            }}
          />
        ) : currentView === "section-detail" && selectedProject ? (
          <SectionDetailView
            project={selectedProject}
            onBack={() => setCurrentView("sections-landing")}
            onSave={async (updatedInfo: ProjectInfo) => {
              const updated = { ...selectedProject, info: updatedInfo };
              await saveProject(updated);
              setSelectedProject(updated);
              setCurrentView("sections-landing");
            }}
            onDelete={async (projectId: string) => {
              await deleteProject(projectId);
              setSelectedProject(null);
              setCurrentView("project-list");
            }}
          />
        ) : currentView === "section-team" && selectedProject ? (
          <SectionTeamView
            project={selectedProject}
            onBack={() => setCurrentView("sections-landing")}
            onSaveManager={async (manager) => {
              await saveManager(selectedProject.id, manager);
              setSelectedProject((prev) => prev ? { ...prev, manager } : null);
            }}
          />
        ) : currentView === "section-tasks" && selectedProject ? (
          <SectionTasksView
            project={selectedProject}
            onBack={() => setCurrentView("sections-landing")}
            onSaveTasks={async (tasks) => {
              await saveTasks(selectedProject.id, tasks);
              setSelectedProject((prev) => prev ? { ...prev, tasks } : null);
            }}
          />
        ) : currentView === "project-detail" && selectedProject ? (
          <ProjectDetailView
            project={selectedProject}
            onBack={() => { setCurrentView("project-list"); }}
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
            onSaveManager={async (manager) => {
              await saveManager(selectedProject.id, manager);
              setSelectedProject((prev) => prev ? { ...prev, manager } : null);
            }}
            onSaveTasks={async (tasks) => {
              await saveTasks(selectedProject.id, tasks);
              setSelectedProject((prev) => prev ? { ...prev, tasks } : null);
            }}
          />
        ) : currentView === "todo-projet" ? (
          <TodoProjet projects={projects} onSaveTasks={saveTasks} />
        ) : currentView === "todo-perso" ? (
          <TodoPerso />
        ) : currentView === "gantt" ? (
          <GanttChart projects={projects} />
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
function ProjectListView({ projects, onCreateProject, onSelectProject, onDocUpload }: { projects: Project[]; onCreateProject: () => void; onSelectProject: (p: Project) => void; onDocUpload: () => void; }) {
  const sectorLabels: Record<string, string> = { commerce: "🛒 Commerce", agriculture: "🌾 Agriculture", service: "💼 Service", industrie: "🏭 Industrie", elevage: "🐄 Élevage", artisanat: "🪵 Artisanat", transport: "🚚 Transport", technologie: "💻 Technologie", sante: "🏥 Santé", education: "📚 Éducation", restauration: "🍽️ Restauration", batiment: "🏗️ Bâtiment" };
  const durationLabels: Record<string, string> = { "3-mois": "3 mois", "6-mois": "6 mois", "1-an": "1 an", "2-ans": "2 ans", "3-ans": "3 ans", "5-ans": "5 ans", "10-ans": "10 ans" };

  const getProgress = (p: Project) => {
    let c = 0;
    if (p.manager) c++;
    if (p.info.name) c++;
    if (p.businessPlan) c++;
    if (p.tasks && p.tasks.length > 0) c++;
    return c;
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 slide-in">
      <div className="bg-white rounded-[25px] p-5 shadow-md border border-slate-200 mb-5">
        <h2 className="text-xl font-black text-slate-900 mb-2">Mes Projets</h2>
        <p className="text-sm text-slate-700 mb-4 font-semibold">Crée un nouveau projet pour commencer à planifier, exécuter et suivre ton activité.</p>
        <button onClick={onCreateProject} className="w-full py-4 bg-gradient-to-r from-[var(--bg-navy-textured)] to-blue-700 text-white rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95 transition-transform">
          <PlusCircle size={20} /> Créer un Nouveau Projet
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">ou</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button onClick={onDocUpload} className="w-full py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 transition-transform">
          <Sparkles size={20} className="text-yellow-300" /> Remplissage Projet / Plan d'affaire par document
        </button>
        <p className="text-[11px] text-slate-400 font-semibold mt-2 text-center">PDF, Word ou photos — L'IA remplit automatiquement les sections</p>
      </div>

      {projects.length > 0 && (
        <div className="mt-2">
          <h3 className="text-lg font-black text-slate-800 mb-4 ml-2">Projets créés ({projects.filter(p => p.info.name.trim()).length})</h3>
          <div className="space-y-3">
            {projects.filter(p => p.info.name.trim()).map((project) => {
              const progress = getProgress(project);
              return (
                <button key={project.id} onClick={() => onSelectProject(project)} className="w-full bg-white rounded-2xl shadow-md border border-slate-200 active:scale-[0.98] transition-transform text-left overflow-hidden">
                  {/* Top bar */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><FolderKanban size={20} className="text-white" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white truncate">{project.info.name || "Projet sans nom"}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-white/70 font-bold">{sectorLabels[project.info.sector] || project.info.sector}</span>
                        {project.info.location && <span className="text-[10px] text-white/60 font-semibold flex items-center gap-0.5"><MapPin size={8} />{project.info.location}</span>}
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-white/50 shrink-0" />
                  </div>
                  {/* Info body */}
                  <div className="px-4 py-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${project.manager ? "bg-green-500" : "bg-slate-300"}`} />
                        <span className="text-slate-600 font-semibold">Équipe : {project.manager ? project.manager.nomComplet || "Défini" : "Vide"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${project.businessPlan ? "bg-green-500" : "bg-slate-300"}`} />
                        <span className="text-slate-600 font-semibold">Plan chiffré : {project.businessPlan ? "✅" : "❌"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${project.tasks && project.tasks.length > 0 ? "bg-green-500" : "bg-slate-300"}`} />
                        <span className="text-slate-600 font-semibold">Tâches : {project.tasks?.length || 0}</span>
                      </div>
                      {project.info.duration && (
                        <div className="flex items-center gap-1.5">
                          <Calendar size={10} className="text-slate-400 shrink-0" />
                          <span className="text-slate-600 font-semibold">{durationLabels[project.info.duration] || project.info.duration}</span>
                        </div>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div className="flex items-center gap-2 pt-1">
                      <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-400 to-green-500 rounded-full transition-all duration-500" style={{ width: `${(progress / 4) * 100}%` }} />
                      </div>
                      <span className="text-[10px] font-black text-slate-500">{progress}/4</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {projects.filter(p => p.info.name.trim()).length === 0 && (
        <div className="text-center py-10">
          <div className="text-6xl mb-4">📁</div>
          <p className="text-slate-400 font-bold">Aucun projet pour le moment</p>
          <p className="text-slate-400 text-sm mt-1">Crée ton premier projet pour commencer !</p>
        </div>
      )}
    </div>
  );
}
