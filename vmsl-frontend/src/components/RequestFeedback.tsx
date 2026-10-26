export function LoadingMessage({ children }: { children: React.ReactNode }) {
    return <div role="status" className="rounded-lg border bg-white p-4">{children}</div>;
}

export function ErrorMessage({ message }: { message: string }) {
    return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <div className="font-medium">Request failed</div><div className="mt-1 text-sm">{message}</div>
    </div>;
}
