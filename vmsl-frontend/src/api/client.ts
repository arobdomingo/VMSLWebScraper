export const API_BASE = ((import.meta.env.VITE_API_BASE_URL as string) || "http://127.0.0.1:8000").replace(/\/$/, "");

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
    try {
        const res = await fetch(`${API_BASE}${path}`, { signal: signal ?? AbortSignal.timeout(45000) });
        if (!res.ok) {
            const message = res.status === 404 ? "No league data is available for this selection."
                : res.status === 422 ? "Please choose a valid season and division."
                : "League data is temporarily unavailable. Please try again shortly.";
            throw new Error(message);
        }
        return await res.json() as T;
    } catch (error) {
        if (error instanceof TypeError) throw new Error("Unable to connect. Check your connection and try again.");
        throw error;
    }
}
