import { useEffect, useState } from "react";
import { apiGet } from "../api/client";

type RequestState<T> = { key: string | null; data: T | null; error: string | null; loading: boolean };
const initialState = <T,>(key: string | null): RequestState<T> => ({ key, data: null, error: null, loading: !!key });

export function useApi<T>(path: string | null) {
    const [state, setState] = useState(() => initialState<T>(path));
    // Reset during render when the request key changes. This also handles A → B → A
    // while B is still pending, without briefly exposing the previous A response.
    if (state.key !== path) setState(initialState<T>(path));
    useEffect(() => {
        if (!path) return;
        let active = true;
        const controller = new AbortController();
        apiGet<T>(path, controller.signal).then(data => {
            if (active) setState({ key: path, data, error: null, loading: false });
        }).catch((error: unknown) => {
            if (active) setState({ key: path, data: null, error: error instanceof Error ? error.message : "Request failed", loading: false });
        });
        return () => { active = false; controller.abort(); };
    }, [path]);
    return state.key === path ? state : initialState<T>(path);
}
