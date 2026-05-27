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

export interface Project {
    id: string;
    info: ProjectInfo;
    createdAt: string;
    businessPlan?: string | null;
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
        extra_info: p.info,
        created_at: p.createdAt,
    };
}

function rowToProject(row: any): Project {
    let info: ProjectInfo;
    const extra = row.extra_info;
    if (extra && typeof extra === "object") {
        info = extra as ProjectInfo;
    } else if (extra && typeof extra === "string") {
        try { info = JSON.parse(extra); } catch { info = defaultInfo(row); }
    } else {
        info = defaultInfo(row);
    }
    return {
        id: row.id,
        info,
        createdAt: row.created_at || new Date().toISOString(),
        businessPlan: row.bp_data || null,
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

    // Charger les projets depuis Supabase
    const loadProjects = useCallback(async () => {
        try {
            // D'abord charger les projets
            const { data: projRows, error: projError } = await supabase
                .from("projects")
                .select("*")
                .order("created_at", { ascending: false });

            if (projError) {
                console.error("Supabase load error:", projError);
                // Fallback vers localStorage
                const saved = localStorage.getItem("baara-projects");
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        if (Array.isArray(parsed)) {
                            setProjects(parsed);
                            return;
                        }
                    } catch { }
                }
                setProjects([]);
                return;
            }

            if (!projRows || projRows.length === 0) {
                setProjects([]);
                return;
            }

            // Charger les business plans
            const projectIds = projRows.map((r: any) => r.id);
            const { data: bpRows } = await supabase
                .from("business_plans")
                .select("project_id, data")
                .in("project_id", projectIds);

            const bpMap = new Map<string, string>();
            if (bpRows) {
                bpRows.forEach((bp: any) => {
                    bpMap.set(bp.project_id, JSON.stringify(bp.data));
                });
            }

            const loadedProjects = projRows.map((row: any) => {
                const project = rowToProject(row);
                project.businessPlan = bpMap.get(row.id) || null;
                return project;
            });

            setProjects(loadedProjects);
        } catch (err) {
            console.error("Load error:", err);
            // Fallback localStorage
            const saved = localStorage.getItem("baara-projects");
            if (saved) {
                try { setProjects(JSON.parse(saved)); return; } catch { }
            }
            setProjects([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    // Sauvegarder un projet (créer ou mettre à jour)
    const saveProject = useCallback(async (project: Project) => {
        try {
            const row = projectToRow(project);

            // Upsert le projet
            const { data, error } = await supabase
                .from("projects")
                .upsert({ id: project.id, ...row, updated_at: new Date().toISOString() }, { onConflict: "id" })
                .select();

            if (error) throw error;

            // Sauvegarder le business plan si présent
            if (project.businessPlan) {
                try {
                    const bpData = JSON.parse(project.businessPlan);
                    await supabase
                        .from("business_plans")
                        .upsert(
                            { project_id: project.id, data: bpData, updated_at: new Date().toISOString() },
                            { onConflict: "project_id" }
                        );
                } catch (e) {
                    console.error("BP save error:", e);
                }
            } else {
                // Supprimer le business plan si null
                await supabase.from("business_plans").delete().eq("project_id", project.id);
            }
        } catch (err) {
            console.error("Save error, falling back to localStorage:", err);
        }

        // Toujours sauvegarder en localStorage comme backup
        setProjects((prev) => {
            const existing = prev.findIndex((p) => p.id === project.id);
            let updated;
            if (existing >= 0) {
                updated = [...prev];
                updated[existing] = project;
            } else {
                updated = [...prev, project];
            }
            localStorage.setItem("baara-projects", JSON.stringify(updated));
            return updated;
        });
    }, []);

    // Supprimer un projet
    const deleteProject = useCallback(async (projectId: string) => {
        try {
            await supabase.from("business_plans").delete().eq("project_id", projectId);
            await supabase.from("projects").delete().eq("id", projectId);
        } catch (err) {
            console.error("Delete error:", err);
        }

        setProjects((prev) => {
            const updated = prev.filter((p) => p.id !== projectId);
            if (updated.length > 0) localStorage.setItem("baara-projects", JSON.stringify(updated));
            else localStorage.removeItem("baara-projects");
            return updated;
        });
    }, []);

    // Mettre à jour le business plan
    const saveBusinessPlan = useCallback(async (projectId: string, bpData: any) => {
        const bpJson = JSON.stringify(bpData);
        try {
            await supabase
                .from("business_plans")
                .upsert(
                    { project_id: projectId, data: bpData, updated_at: new Date().toISOString() },
                    { onConflict: "project_id" }
                );
        } catch (err) {
            console.error("BP save error:", err);
        }

        setProjects((prev) => {
            const updated = prev.map((p) => p.id === projectId ? { ...p, businessPlan: bpJson } : p);
            localStorage.setItem("baara-projects", JSON.stringify(updated));
            return updated;
        });
    }, []);

    return { projects, loading, saveProject, deleteProject, saveBusinessPlan, reload: loadProjects };
}