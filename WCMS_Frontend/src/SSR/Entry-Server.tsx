import type { IRouteModule } from "../SysCore/Interface/IBaseRouter";
import { SpecRouteModule } from "../SpecFetures/1810/SpecRouter";
import { createServerRouter } from "../SysCore/Utils/Routes";
import { renderToString } from "react-dom/server";
import * as HelmetAsync from "react-helmet-async";
import { createStaticHandler, StaticRouterProvider, type StaticHandlerContext } from "react-router-dom/server";
import type { Lang } from "../SysCore/i18n/lang";
import { MessageProvider } from "../SysCore/Components/Message/Dialog/Dialog_Comp";
import { HeaderMetaComp } from "../SysCore/Components/HeaderMeta/HeaderMeta_Comp";

const HelmetProvider = (HelmetAsync as any).HelmetProvider ?? (HelmetAsync as any).default?.HelmetProvider ??
  // 萬一還是取不到，就用 no-op provider 避免 SSR 直接當掉
  (({ children }: any) => <>{children}</>);

type RenderResult = { appHtml: string; headTags: string };

export const SSR_Render = async (url: string, lang: Lang): Promise<RenderResult> => {
  const module: IRouteModule = new SpecRouteModule();
  const handler = createStaticHandler(module.getRoutes());
  const request = new Request("http://localhost" + url, { method: "GET" });
  const context = (await handler.query(request)) as StaticHandlerContext;

  const router = createServerRouter({ lang: lang, module }, context);

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
  return { appHtml, headTags };
};

export const render = SSR_Render;
