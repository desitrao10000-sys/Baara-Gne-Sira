"use client";

import { ArrowLeft, ClipboardList } from "lucide-react";
import { Project, ProjectTask } from "@/lib/useSupabaseProjects";
import ProjectTasksSection from "./ProjectTasksSection";

interface SectionTasksViewProps {
    project: Project;
    onBack: () => void;
    onSaveTasks: (tasks: ProjectTask[]) => void;
}

export default function SectionTasksView({ project, onBack, onSaveTasks }: SectionTasksViewProps) {
    const teamMembers = project.manager
        ? [project.manager.nomComplet, ...(project.manager.membres ?? []).map((m) => `${m.prenom} ${m.nom}`)]
        : [];

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="relative overflow-hidden shrink-0">
                <div className="textured-navy p-4 pb-6 flex items-center gap-3 relative z-10">
                    <button onClick={onBack} className="text-white p-1" aria-label="Retour">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-black text-white tracking-wide truncate">
                            Section 4 — Tâches
                        </h1>
                        <p className="text-white/60 text-xs font-bold">{project.info.name}</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                        <ClipboardList size={22} className="text-purple-300" />
                    </div>
                </div>
                <div className="absolute -bottom-3 left-0 right-0 h-6 bg-pastel rounded-t-[20px]" />
            </div>

            {/* Contenu */}
            <div className="flex-1 overflow-y-auto px-4 pt-2 pb-6">
                <ProjectTasksSection tasks={project.tasks} projectMembers={teamMembers} onSave={onSaveTasks} />
            </div>
        </div>
    );
}