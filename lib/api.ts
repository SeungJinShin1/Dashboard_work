const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
// Fallback to "/api" allows Vercel rewrites to work automatically if hosted on same domain.
// Locally, you can set NEXT_PUBLIC_API_URL="http://127.0.0.1:8000" in .env.local


export async function analyzeTask(text: string) {
    const res = await fetch(`${API_URL}/tasks/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error("Failed to analyze task");
    return res.json();
}

export async function createTask(taskData: any) {
    const res = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
    });
    if (!res.ok) throw new Error("Failed to create task");
    return res.json();
}

export async function getTasks() {
    const res = await fetch(`${API_URL}/tasks`);
    if (!res.ok) throw new Error("Failed to fetch tasks");
    return res.json();
}

export async function updateTask(taskId: string, updates: any) {
    const res = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update task");
    return res.json();
}

export async function getBriefing(forceRefresh: boolean = false) {
    const url = forceRefresh ? `${API_URL}/briefing?force_refresh=true` : `${API_URL}/briefing`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch briefing");
    return res.json();
}

export async function uploadSchedule(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_URL}/schedule/upload`, {
        method: "POST",
        body: formData,
    });
    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to upload schedule");
    }
    return res.json();
}

export async function getEvents() {
    const res = await fetch(`${API_URL}/schedule`);
    if (!res.ok) throw new Error("Failed to fetch events");
    return res.json();
}
