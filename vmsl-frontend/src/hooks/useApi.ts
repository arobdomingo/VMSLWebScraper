import { useEffect, useState } from "react";
import { apiGet } from "../api/client";

/** The request key prevents old data appearing while a new selection loads. */
export function useApi<T>(path: string | null) {
    const [state, setState] = useState<{ key: string | null; data: T | null; error: string | null }>({ key: null, data: null, error: null });
    useEffect(() => {
        if (!path) return;
        let active = true;
        apiGet<T>(path).then(data => {
            if (active) setState({ key: path, data, error: null });
        }).catch((error: unknown) => {
            if (active) setState({ key: path, data: null, error: error instanceof Error ? error.message : "Request failed" });
        });
        return () => { active = false; };
    }, [path]);
    if (!path) return { data: null, error: null, loading: false };
    if (state.key !== path) return { data: null, error: null, loading: true };
    return { ...state, loading: false };
}
