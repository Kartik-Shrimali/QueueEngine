export function formatDateTime(iso: string | null): string {
    if (iso === null) return "unknown";

    const date = new Date(iso);
    if (isNaN(date.getTime())) return "unknown";

    return date.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

export function shortId(id: string): string {
    return id.slice(0, 8);
}