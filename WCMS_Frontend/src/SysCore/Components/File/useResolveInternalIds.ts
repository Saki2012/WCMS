import { useEffect, useMemo, useState } from "react";
import { GetFileInternalIds } from "./LibFileParser";
import { transformHtmlWithMeta } from "./transformHtml";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";

const buildFileUrlById = (id: string) => FileManagementAPI.get_Public_Preview_Url(id)

export const useResolveInternalIds = (rawHtml: string, opt?: { locale?: string }) => {
  // 宣告變數：先做 SSR 可用的 fallback（至少補 src）
  const fallbackHtml = useMemo(() => {
    const html = rawHtml ?? "";
    if (!html) return "";
    return transformHtmlWithMeta(html, {}, { urlBuilder: buildFileUrlById });
  }, [rawHtml]);

  // 宣告變數：初始就用 fallback，SSR 首屏就不會破圖
  const [resolvedHtml, setResolvedHtml] = useState<string>(fallbackHtml);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>();

  const ids = useMemo(() => GetFileInternalIds(rawHtml ?? ""), [rawHtml]);

  useEffect(() => {
    let alive = true;

    // 執行：先回到 fallback（避免 CSR 初次也先破圖）
    setResolvedHtml(fallbackHtml);

    if (!rawHtml || ids.length === 0) {
      setLoading(false);
      setError(undefined);
      return;
    }

    const run = async () => {
      try {
        setLoading(true);
        setError(undefined);
        //metaMap原本是要做一次先撈所有的資源回來再做mapping的，但整體流程尚未實踐，暫時先這樣挖空
        const metaMap = {};
        const out = transformHtmlWithMeta(rawHtml, metaMap, { urlBuilder: buildFileUrlById });

        if (!alive) return;
        setResolvedHtml(out ?? fallbackHtml);
      } catch (e) {
        if (alive) {
          setError(e);
          setResolvedHtml(fallbackHtml);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [rawHtml, opt?.locale, ids, fallbackHtml]);

  return { html: resolvedHtml, loading, error };
};