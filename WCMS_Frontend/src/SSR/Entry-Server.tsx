import { renderToString } from "react-dom/server";
import { type HelmetServerState } from "react-helmet-async";
import type { IRouteModule } from "../SysCore/Interface/IBaseRouter";
import { SpecRouteModule } from "../SpecFetures/1810/SpecRouter";
import { createServerRouter } from "../SysCore/Utils/Routes";
import helmetPkg from "react-helmet-async";
import { RouterProvider } from "react-router-dom";

const HelmetProvider = helmetPkg.HelmetProvider;

export const render = async (url: string, acceptLang?: string) => {
  const module: IRouteModule = new SpecRouteModule();
  const router = createServerRouter({ lang: acceptLang, module }, url);
  const helmetContext: { helmet?: HelmetServerState } = {};
  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <RouterProvider router={router} />
    </HelmetProvider>
  );
  const { helmet } = helmetContext;
  return { html, head: [helmet?.title?.toString() ?? "", helmet?.meta?.toString() ?? "", helmet?.link?.toString() ?? ""].join("") };
};