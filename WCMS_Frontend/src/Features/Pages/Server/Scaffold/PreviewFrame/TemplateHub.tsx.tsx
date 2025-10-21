// src/Features/Scaffold/TemplateHub.tsx
import { SubPageShell } from "@/Features/Pages/Client/BizFunc/MainPage/SubPages";
import { Classic_FETheme } from "@/Features/Pages/Client/Theme/ClassicTheme_Clsx";
import { useEffect, useState } from "react";

type ModuleKey = "announcement" | "pagemanagement"; // 先列你會用到的模組
type Msg =
  | { type: "wcms:preview"; module: ModuleKey; payload: { kind: "dto"; lang?: string; dto: any } }
  | { type: "wcms:preview"; module: ModuleKey; payload: { kind: "internalId"; lang?: string; mode?: "db" | "public"; internalId: string } };

export default function TemplateHub(props: { site: any; defaultLang: string }) {
  const { defaultLang } = props;
  const [state, setState] = useState<{ module: ModuleKey; lang: string; vm: any } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = async (ev: MessageEvent) => {
      if (ev.origin !== window.location.origin) return;
      const msg = ev.data as Msg;
      if (msg?.type !== "wcms:preview") return;

      try {
        const lang = msg.payload.lang || defaultLang;

        // ⬇️ 先做最小分支：DTO 本地轉、或依 internalId 去取資料
        if (msg.payload.kind === "dto") {
          const vm = await adaptDto(msg.module, msg.payload.dto, lang);
          setState({ module: msg.module, lang, vm });
        } else {
          const vm = await fetchById(msg.module, msg.payload.internalId, lang, msg.payload.mode ?? "db");
          setState({ module: msg.module, lang, vm });
        }
      } catch (e: any) {
        setError(e?.message ?? "預覽失敗");
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [defaultLang]);

  // 最小 UI：先驗線路
  if (error) return <div role="alert">{error}</div>;
  if (!state) return <div role="status">等待預覽資料…（請從後台按預覽）</div>;

  // 之後把下面 switch 換成真正的 Content
  switch (state.module) {
    case "announcement":
      // 先暫時用最簡渲染；打通後再換成 <AnnouncementPublicView vm={state.vm} preview />
      return (
        <div className="p-4">PageManagement 預覽尚未接上 Content。</div>
        // <SubPageShell
        //   Style={Classic_FETheme}
        //   Lang={'zh-tw'}
        //   site={undefined}
        //   node={undefined}               // ← 找到要預覽的那個模組節點（對應該內容會出現在哪個子頁）
        // >
        //   <>測試</>
        //   {/* <AnnouncementPublicView vm={vm} preview /> */}
        // </SubPageShell>
      );
    case "pagemanagement":
      return <div className="p-4">PageManagement 預覽尚未接上 Content。</div>;
    default:
      return <div className="p-4">未知模組。</div>;
  }
}

/** —— 以下兩個函式暫時用假資料打通；等你接 adapter —— */
async function adaptDto(module: ModuleKey, dto: any, lang: string) {
  if (module === "announcement") {
    // 薄轉：挑出目前語系的內容
    const d = dto?.Details?.find((x: any) => x.Lang === (lang ?? dto.DefaultLang)) ?? dto?.Details?.[0];
    return {
      title: d?.Title ?? dto?.Title ?? "",
      contentHtml: d?.ContentHtml ?? "",
    };
  }
  return dto;
}

async function fetchById(module: ModuleKey, internalId: string, lang: string, mode: "db" | "public") {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "";
  if (module === "announcement") {
    if (mode === "db") {
      const r = await fetch(`${apiBase}/Feature/Preview/ById?type=announcement&internalId=${encodeURIComponent(internalId)}${lang ? `&lang=${lang}` : ""}`, { credentials: "include" });
      const j = await r.json();
      return j.data;
    } else {
      const r = await fetch(`${apiBase}/Public/Announcement/ById/${encodeURIComponent(internalId)}${lang ? `?lang=${lang}` : ""}`, { credentials: "include" });
      return await r.json();
    }
  }
  return {};
}
