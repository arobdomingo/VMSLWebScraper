import { validateResponse } from "./responseValidation";

export const API_BASE = ((import.meta.env.VITE_API_BASE_URL as string) || "http://127.0.0.1:8000").replace(/\/$/, "");

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
    try {
        const res = await fetch(`${API_BASE}${path}`, { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(45000)]) : AbortSignal.timeout(45000) });
        if (!res.ok) {
            const message = res.status === 404 ? "No league data is available for this selection."
                : res.status === 422 ? "Please choose a valid season and division."
                : "League data is temporarily unavailable. Please try again shortly.";
            throw new Error(message);
        }
        const data: unknown = await res.json();
        validateResponse(path, data);
        return data as T;
    } catch (error) {
        if (error instanceof SyntaxError) throw new Error("The server returned invalid league data. Please try again later.");
        if (error instanceof DOMException && error.name === "TimeoutError") throw new Error("The request timed out. Please try again.");
        if (error instanceof TypeError) throw new Error("Unable to connect. Check your connection and try again.");
        throw error;
    }
}
