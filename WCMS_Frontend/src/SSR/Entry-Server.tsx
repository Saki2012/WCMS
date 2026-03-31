import type { IRouteModule } from "@/SysCore/Interface/IBaseRouter";
import { createServerRouter } from "@/SysCore/Utils/Route/Routes";
import { renderToString } from "react-dom/server";
import * as HelmetAsync from "react-helmet-async";
import { SpecRouteModule, siteHeaderMeta } from "SpecFeature/SpecRouter";
import { StaticRouterProvider } from "react-router-dom/server";
import { MessageProvider } from "@/SysCore/Components/Message/Dialog/Dialog_Comp";
import { HeaderMetaComp } from "@/SysCore/Components/HeaderMeta/HeaderMeta_Comp";

const HelmetProvider = (HelmetAsync as any).HelmetProvider ?? (HelmetAsync as any).default?.HelmetProvider ??
  // 萬一還是取不到，就用 no-op provider 避免 SSR 直接當掉
  (({ children }: any) => <>{children}</>);
type RenderResult =
  | { kind: "html"; appHtml: string; headTags: string; initialState: any }
  | { kind: "response"; status: number; headers: Record<string, string> };

export const SSR_Render = async (url: string, headers: Record<string, string> = {}): Promise<RenderResult> => {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.startsWith("/server")) {
    await import("@/Features/Assets/LoadFeaturesCss.ts");
    await import("SpecFeature/Assets/LoadSpecCss_Server.ts");
  } else {
    await import("@/Features/Assets/LoadFeaturesCss_Client.ts"); //cara
    await import("SpecFeature/Assets/LoadSpecCss.ts");
  }

  const boot = {
    module: new SpecRouteModule() as IRouteModule,
    lang: headers["accept-language"] ?? "",
    cookieLang: headers["cookie"] ?? "",
  };
  const request = new Request("http://localhost" + url, { method: "GET", headers });
  const built = await createServerRouter(boot as any, request);

  if (built.kind === "response") return {kind: "response", status: built.response.status, headers: Object.fromEntries(built.response.headers.entries()),};

  const { router, context } = built;

  const helmetContext: any = {};

  const initialState = {
    lang: (headers["accept-language"] ?? "zh-tw"),
    hydrationData: {
      loaderData: context.loaderData,
      actionData: context.actionData,
      errors: context.errors,
    },
  };

  const appHtml = renderToString(
    <MessageProvider>
      <HelmetProvider context={helmetContext}>
        <HeaderMetaComp {...siteHeaderMeta} />
        <StaticRouterProvider router={router} context={context} />
      </HelmetProvider>
    </MessageProvider>
  );

  const headTags = [
    helmetContext.helmet?.title?.toString() ?? "",
    helmetContext.helmet?.meta?.toString() ?? "",
  ].join("");
  return { kind: "html", appHtml, headTags, initialState };
};

export const render = SSR_Render;
