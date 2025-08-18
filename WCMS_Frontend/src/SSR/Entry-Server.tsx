import type { IRouteModule } from "../SysCore/Interface/IBaseRouter";
import { SpecRouteModule } from "../SpecFetures/1810/SpecRouter";
import { createServerRouter } from "../SysCore/Utils/Routes";
import { renderToString } from "react-dom/server";
import * as HelmetAsync from "react-helmet-async";
import { createStaticHandler, StaticRouterProvider, type StaticHandlerContext } from "react-router-dom/server";
import type { Lang } from "../SysCore/i18n/lang";

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
    <>測試:這是SSR
      <HelmetProvider context={helmetContext}>
        <StaticRouterProvider router={router} context={context} />
      </HelmetProvider>
    </>
  );

  const headTags = [
    helmetContext.helmet?.title?.toString() ?? "",
    helmetContext.helmet?.meta?.toString() ?? "",
  ].join("");
  return { appHtml, headTags };
};

export const render = SSR_Render;
