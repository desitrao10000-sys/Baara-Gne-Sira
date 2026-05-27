"use client";

import { useState } from "react";
import { PlusCircle, CheckCircle, ChevronRight } from "lucide-react";

interface ProjectViewProps {
  projects: string[];
  setProjects: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function ProjectView({ projects, setProjects }: ProjectViewProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [projectName, setProjectName] = useState("");

  const handleCreate = () => {
    if (projectName.trim() === "") {
      alert("Veuillez donner un nom au projet.");
      return;
    }
    setProjects([...projects, projectName]);
    setProjectName("");
    setIsCreating(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 slide-in">
      <div className="bg-white rounded-[25px] p-5 shadow-sm border border-black/5 mb-5">
        <h2 className="text-xl font-black text-[var(--bg-navy-textured)] mb-2">
          Composant Projet
        </h2>
        <p className="text-sm leading-relaxed text-slate-500 mb-4">
          Le composant projet permet de créer un nouveau projet que tu nommes. 
          Dans chaque projet, tu pourras créer des tâches alimentant tous les autres modules.
        </p>

        {!isCreating ? (
          <button 
            onClick={() => setIsCreating(true)}
            className="w-full py-4 bg-[var(--bg-navy-textured)] text-white rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95 transition-transform"
          >
            <PlusCircle size={20} />
            Création Projet
          </button>
        ) : (
          <div className="space-y-3">
            <input 
              type="text" 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Nom du projet..."
              className="w-full p-4 rounded-xl border-2 border-slate-200 outline-none focus:border-[var(--vibrant-blue)] transition-colors text-slate-800"
              autoFocus
            />
            <button 
              onClick={handleCreate}
              className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95 transition-transform"
            >
              <CheckCircle size={20} />
              Valider le Projet
            </button>
          </div>
        )}
      </div>

      {projects.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-black text-slate-800 mb-4 ml-2">Mes Projets</h3>
          <div className="space-y-3">
            {projects.map((p, i) => (
              <div key={i} className="bg-white p-4 px-5 rounded-2xl flex items-center justify-between shadow-sm border-l-4 border-[var(--vibrant-blue)]">
                <span className="font-bold text-slate-700">{p}</span>
                <ChevronRight size={20} className="text-slate-300" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
