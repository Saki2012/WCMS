// SysCore/Components/File/useResolveInternalIds.ts
import { useEffect, useMemo, useState } from "react";
import { fetchFileMetaMap } from "./fetchFileMeta";
import { GetFileInternalIds } from "./LibFileParser";
import { transformHtmlWithMeta } from "./transformHtml";

export interface UseResolveOptions
{
    locale?: string;
}
export interface UseResolveResult
{
    html: string;
    loading: boolean;
    error?: unknown;
}

const buildFileUrlById = (id: string) => `/Service/FileManagement/Preview/${encodeURIComponent(id)}`;

export const useResolveInternalIds = (rawHtml: string, opt?: UseResolveOptions): UseResolveResult =>
{
    const [resolvedHtml, setResolvedHtml] = useState<string>(rawHtml ?? "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<unknown>();
    const ids = useMemo(() => GetFileInternalIds(rawHtml ?? ""), [rawHtml]);

    useEffect(() =>
    {
        let alive = true;
        // 先把預設值設為原字串（任何情況都不會掉成空）
        setResolvedHtml(rawHtml ?? "");

        if (!rawHtml || ids.length === 0)
        {
            setLoading(false);
            setError(undefined);
            return; // ★ 直接返回原字串
        }

        const run = async () =>
        {
            try
            {
                setLoading(true);
                setError(undefined);
                const metaMap = await fetchFileMetaMap(ids, opt?.locale).catch(() => ({}));
                const out = transformHtmlWithMeta(rawHtml, metaMap, { urlBuilder: buildFileUrlById });
                if (!alive) return;
                setResolvedHtml(out ?? rawHtml);
            } catch (e)
            {
                if (alive)
                {
                    setError(e);
                    setResolvedHtml(rawHtml); // ★ 失敗也回原字串
                }
            } finally
            {
                if (alive) setLoading(false);
            }
        };
        run();
        return () =>
        {
            alive = false;
        };
    }, [rawHtml, opt?.locale, ids]);

    return { html: resolvedHtml, loading, error };
};
