"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

export interface ProjectInfo {
    name: string;
    sector: string;
    location: string;
    zone: string;
    startDate: string;
    duration: string;
    description: string;
    objectives: string;
}

export interface ProjectMember {
    id: string;
    nom: string;
    prenom: string;
    contact: string;
    role: string;
}

export interface ProjectManager {
    nomComplet: string;
    contact: string;
    role: string;
    niveauAcces: "administrateur" | "editeur" | "lecteur";
    membres?: ProjectMember[];
    partenaires?: ProjectMember[];
}

export interface ProjectTask {
    id: string;
    designation: string;
    description: string;
    objectifs: string;
    responsable: string;
    dateDebut: string;
    dateFin: string;
    statut: "todo" | "en-cours" | "en-retard" | "termine";
    budgetEntreesPrev: number;
    budgetSortiesPrev: number;
    budgetEntreesReel: number;
    budgetSortiesReel: number;
    risques: string;
    suggestionResolution: string;
    commentaires: string;
}

export interface Project {
    id: string;
    info: ProjectInfo;
    createdAt: string;
    businessPlan?: string | null;
    manager?: ProjectManager | null;
    tasks?: ProjectTask[];
}

function projectToRow(p: Project) {
    return {
        name: p.info.name,
        description: p.info.description,
        status: "En cours",
        type: "standard",
        icon: "📁",
        color: "blue",
        sector: p.info.sector,
        target: p.info.objectives,
        budget: "",
        team: "",
        extra_info: { ...p.info, _manager: p.manager || null, _tasks: p.tasks || [] },
        created_at: p.createdAt,
    };
}

function rowToProject(row: any): Project {
    let info: ProjectInfo;
    let manager: ProjectManager | null = null;
    let tasks: ProjectTask[] = [];
    const extra = row.extra_info;
    if (extra && typeof extra === "object") {
        manager = extra._manager || null;
        tasks = Array.isArray(extra._tasks) ? extra._tasks : [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _manager: _m, _tasks: _t, ...infoData } = extra;
        info = infoData as ProjectInfo;
    } else if (extra && typeof extra === "string") {
        try {
            const parsed = JSON.parse(extra);
            manager = parsed._manager || null;
            tasks = Array.isArray(parsed._tasks) ? parsed._tasks : [];
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { _manager: _m, _tasks: _t, ...infoData } = parsed;
            info = infoData as ProjectInfo;
        } catch { info = defaultInfo(row); }
    } else {
        info = defaultInfo(row);
    }
    return {
        id: row.id,
        info,
        createdAt: row.created_at || new Date().toISOString(),
        businessPlan: row.bp_data || null,
        manager,
        tasks,
    };
}

function defaultInfo(row: any): ProjectInfo {
    return {
        name: row.name || "",
        sector: row.sector || "",
        location: "",
        zone: "",
        startDate: "",
        duration: "",
        description: row.description || "",
        objectives: row.target || "",
    };
}

export function useSupabaseProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    const loadProjects = useCallback(async () => {
        try {
            const { data: projRows, error: projError } = await supabase
                .from("projects")
                .select("*")
                .order("created_at", { ascending: false });

            if (projError) {
                console.error("Supabase load error:", projError);
                const saved = localStorage.getItem("baara-projects");
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        if (Array.isArray(parsed)) { setProjects(parsed); return; }
                    } catch { }
                }
                setProjects([]); return;
            }

            if (!projRows || projRows.length === 0) { setProjects([]); return; }

            const projectIds = projRows.map((r: any) => r.id);
            const { data: bpRows } = await supabase
                .from("business_plans")
                .select("project_id, data")
                .in("project_id", projectIds);

            const bpMap = new Map<string, string>();
            if (bpRows) bpRows.forEach((bp: any) => bpMap.set(bp.project_id, JSON.stringify(bp.data)));

            const loadedProjects = projRows.map((row: any) => {
                const project = rowToProject(row);
                project.businessPlan = bpMap.get(row.id) || null;
                return project;
            });

            setProjects(loadedProjects);
        } catch (err) {
            console.error("Load error:", err);
            const saved = localStorage.getItem("baara-projects");
            if (saved) { try { setProjects(JSON.parse(saved)); return; } catch { } }
            setProjects([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadProjects(); }, [loadProjects]);

    const saveProject = useCallback(async (project: Project) => {
        try {
            const row = projectToRow(project);
            const { error } = await supabase
                .from("projects")
                .upsert({ id: project.id, ...row, updated_at: new Date().toISOString() }, { onConflict: "id" })
                .select();
            if (error) throw error;
            if (project.businessPlan) {
                try {
                    const bpData = JSON.parse(project.businessPlan);
                    await supabase.from("business_plans").upsert(
                        { project_id: project.id, data: bpData, updated_at: new Date().toISOString() },
                        { onConflict: "project_id" }
                    );
                } catch (e) { console.error("BP save error:", e); }
            } else {
                await supabase.from("business_plans").delete().eq("project_id", project.id);
            }
        } catch (err) { console.error("Save error:", err); }

        setProjects((prev) => {
            const existing = prev.findIndex((p) => p.id === project.id);
            let updated;
            if (existing >= 0) { updated = [...prev]; updated[existing] = project; }
            else updated = [...prev, project];
            localStorage.setItem("baara-projects", JSON.stringify(updated));
            return updated;
        });
    }, []);

    const deleteProject = useCallback(async (projectId: string) => {
        try {
            await supabase.from("business_plans").delete().eq("project_id", projectId);
            await supabase.from("projects").delete().eq("id", projectId);
        } catch (err) { console.error("Delete error:", err); }
        setProjects((prev) => {
            const updated = prev.filter((p) => p.id !== projectId);
            if (updated.length > 0) localStorage.setItem("baara-projects", JSON.stringify(updated));
            else localStorage.removeItem("baara-projects");
            return updated;
        });
    }, []);

    const saveBusinessPlan = useCallback(async (projectId: string, bpData: any) => {
        const bpJson = JSON.stringify(bpData);
        try {
            await supabase.from("business_plans").upsert(
                { project_id: projectId, data: bpData, updated_at: new Date().toISOString() },
                { onConflict: "project_id" }
            );
        } catch (err) { console.error("BP save error:", err); }
        setProjects((prev) => {
            const updated = prev.map((p) => p.id === projectId ? { ...p, businessPlan: bpJson } : p);
            localStorage.setItem("baara-projects", JSON.stringify(updated));
            return updated;
        });
    }, []);

    const saveManager = useCallback(async (projectId: string, manager: ProjectManager | null) => {
        setProjects((prev) => {
            const updated = prev.map((p) => p.id === projectId ? { ...p, manager } : p);
            localStorage.setItem("baara-projects", JSON.stringify(updated));
            const project = updated.find((p) => p.id === projectId);
            if (project) {
                const row = projectToRow(project);
                supabase.from("projects")
                    .update({ extra_info: row.extra_info, updated_at: new Date().toISOString() })
                    .eq("id", projectId)
                    .then(({ error }) => { if (error) console.error("Manager save error:", error); });
            }
            return updated;
        });
    }, []);

    const saveTasks = useCallback(async (projectId: string, tasks: ProjectTask[]) => {
        setProjects((prev) => {
            const updated = prev.map((p) => p.id === projectId ? { ...p, tasks } : p);
            localStorage.setItem("baara-projects", JSON.stringify(updated));
            const project = updated.find((p) => p.id === projectId);
            if (project) {
                const row = projectToRow(project);
                supabase.from("projects")
                    .update({ extra_info: row.extra_info, updated_at: new Date().toISOString() })
                    .eq("id", projectId)
                    .then(({ error }) => { if (error) console.error("Tasks save error:", error); });
            }
            return updated;
        });
    }, []);

    return { projects, loading, saveProject, deleteProject, saveBusinessPlan, saveManager, saveTasks, reload: loadProjects };
}
