export const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://127.0.0.1:8000";

export async function apiGet<T>(path: string): Promise<T> {

    const res = await fetch(`${API_BASE}${path}`);

    console.log("API_BASE =", API_BASE);
    console.log("GET", `${API_BASE}${path}`);

    if(!res.ok){
        const text = await res.text().catch(() => "");
        throw new Error(`GET ${path} failed: ${res.status} ${res.statusText} ${text}`);
    }

    return (await res.json()) as T;

}