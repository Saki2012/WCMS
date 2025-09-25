export const GetFileInternalIds = (html: string): string[] =>
{
    if (!html) return [];
    const ids = new Set<string>();
    const re = /data-internalid\s*=\s*"([^"]+)"/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null)
    {
        const id = m[1].trim();
        if (id) ids.add(id);
    }
    return Array.from(ids);
};
