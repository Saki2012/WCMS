import type { IRouteModule } from "@/SysCore/Interface/IBaseRouter";
import { SpecRouteModule } from "@/SpecFetures/1810/SpecRouter";
import { createServerRouter } from "@/SysCore/Utils/Route/Routes";
import { renderToString } from "react-dom/server";
import * as HelmetAsync from "react-helmet-async";
import { StaticRouterProvider } from "react-router-dom/server";
import { MessageProvider } from "@/SysCore/Components/Message/Dialog/Dialog_Comp";
import { HeaderMetaComp } from "@/SysCore/Components/HeaderMeta/HeaderMeta_Comp";

const HelmetProvider = (HelmetAsync as any).HelmetProvider ?? (HelmetAsync as any).default?.HelmetProvider ??
  // 萬一還是取不到，就用 no-op provider 避免 SSR 直接當掉
  (({ children }: any) => <>{children}</>);

type RenderResult = { appHtml: string; headTags: string, initialState: string };

export const SSR_Render = async (url: string, headers: Record<string, string> = {}): Promise<RenderResult> => {

  const lowerUrl = url.toLowerCase();
  if (lowerUrl.startsWith("/server")) {
    await import("@/Features/Assets/LoadFeaturesCss.ts");
    await import("SpecFeature/Assets/LoadSpecCss_Server.ts");
  } else {
    await import("SpecFeature/Assets/LoadSpecCss.ts");
  }


  const boot = {
    module: new SpecRouteModule() as IRouteModule,
    lang: headers["accept-language"] ?? "",
    cookieLang: headers["cookie"] ?? "",
  };
  const request = new Request("http://localhost" + url, { method: "GET", headers });
  const { router, context } = await createServerRouter(boot as any, request);

  const helmetContext: any = {};

  const appHtml = renderToString(
    <MessageProvider>
      <HelmetProvider context={helmetContext}>
        <HeaderMetaComp
          title={"國立臺灣藝術大學_研究發展處"}
          description={"國立臺灣藝術大學_研究發展處 / 國立臺灣藝術大學_研究發展處 / 國立臺灣藝術大學_研究發展處"}
          keywords={"國立臺灣藝術大學_研究發展處"}
        />
        <StaticRouterProvider router={router} context={context} />
      </HelmetProvider>
    </MessageProvider>
  );

  const headTags = [
    helmetContext.helmet?.title?.toString() ?? "",
    helmetContext.helmet?.meta?.toString() ?? "",
  ].join("");
  return { appHtml, headTags, initialState: boot.lang };
};

export const render = SSR_Render;
