import { ServerModuleRoutes } from "@/Features/Pages/Server/Scaffold/Routes/ServerModuleRoutesData";
import type { RouteHandleMeta } from "@/Features/Pages/Server/Scaffold/Routes/ServerRouter";
import type { IActionHandle, IActionMeta, IModuleMeta, IProgMeta, IServerElementFactoryCtx } from "@/Features/Pages/Server/Scaffold/Routes/ServerModuleRoutesData";
import type { RouteObject, IndexRouteObject, NonIndexRouteObject } from "react-router-dom";
import { AutoRedirect } from "@/SysCore/Utils/Route/AutoRedirect";


type ActionKey = `${string}/${string}/${string}`; // module/prog/action

let cached:
  | {
    modules: Map<string, IModuleMeta>;
    progs: Map<string, IProgMeta>; // module/prog
    actions: Map<ActionKey, IActionMeta>;
  }
  | undefined;

const progKey = (moduleCode: string, progId: string) => `${moduleCode}/${progId}` as const;
const actionKey = (moduleCode: string, progId: string, actionCode: string) =>
  `${moduleCode}/${progId}/${actionCode}` as ActionKey;

export const getServerMenuIndex = () => {
  if (cached) return cached;

  const modules = new Map<string, IModuleMeta>();
  const progs = new Map<string, IProgMeta>();
  const actions = new Map<ActionKey, IActionMeta>();

  const list = ServerModuleRoutes; // ✅ 含 spec ext
  for (const m of list) {
    modules.set(m.ModuleCode, m);
    for (const p of m.Progs ?? []) {
      progs.set(progKey(m.ModuleCode, p.ProgId), p);
      for (const a of p.Actions ?? []) {
        actions.set(actionKey(m.ModuleCode, p.ProgId, a.ActionCode), a);
      }
    }
  }

  cached = { modules, progs, actions };
  return cached;
};

export const findModuleMeta = (moduleCode: string) => getServerMenuIndex().modules.get(moduleCode);
export const findProgMeta = (moduleCode: string, progId: string) =>
  getServerMenuIndex().progs.get(`${moduleCode}/${progId}`);
export const findActionMeta = (moduleCode: string, progId: string, actionCode: string) =>
  getServerMenuIndex().actions.get(`${moduleCode}/${progId}/${actionCode}` as ActionKey);

/** 若你在 dev 會熱更新 menu data，可在必要時呼叫它刷新 */
export const resetServerMenuIndexCache = () => {
  cached = undefined;
};

export const buildModuleHandle = (moduleCode: string): RouteHandleMeta => {
  const m = findModuleMeta(moduleCode);
  return { moduleCode, title: m?.Title ?? moduleCode };
};
export const buildProgHandle = (moduleCode: string, progId: string): RouteHandleMeta => {
  const p = findProgMeta(moduleCode, progId);
  return { moduleCode, progId, title: p?.Title ?? progId };
};
export const buildActionHandle = (moduleCode: string, progId: string, actionCode: string): RouteHandleMeta => {
  const a = findActionMeta(moduleCode, progId, actionCode);
  return { moduleCode, progId, actionCode, title: a?.Title ?? actionCode };
};

/** 取得 action 的路由片段（優先 RoutePath，否則用 ActionCode） */
const getActionPath = (a: IActionMeta): string => (a.RoutePath ?? a.ActionCode).replace(/^\//, "");

/** 建 action route（支援 index action：RoutePath === ""） */
const buildActionRoute = (a: IActionMeta, ctx: IServerElementFactoryCtx): RouteObject => {
  const path = getActionPath(a);
  const element = a.elementFactory ? a.elementFactory(ctx) : <div>Missing elementFactory</div>;
  const handle = { ActionCode: a.ActionCode, Title: a.Title } as IActionHandle
  // ✅ RoutePath === "" 視為 index route（不能有 children / path）
  if (path === "") return { index: true, handle, element } as IndexRouteObject;
  // ✅ 一般 route
  return { path, handle, element } as NonIndexRouteObject;
};

/** 建 prog route（含 default action redirect + actions） */
const buildProgRoute = (moduleCode: string, p: IProgMeta, ctx: IServerElementFactoryCtx): NonIndexRouteObject => {
  const defaultAction = p.Actions?.find(a => a.ActionCode === p.DefaultActionCode);
  const defaultPath = defaultAction ? getActionPath(defaultAction) : "List";
  const hasIndexAction = defaultPath === "";

  return {
    path: p.ProgId,
    handle: buildProgHandle(moduleCode, p.ProgId),
    children: [
      // 如果有 index action，就不用 redirect
      ...(hasIndexAction ? [] : [{ index: true, element: <AutoRedirect to={defaultPath} replace /> }]),
      ...(p.Actions ?? []).map(a => buildActionRoute(a, ctx)),
    ],
  };
};

/** 建 module route（只產生有 progs 的 module；像 Logout 這種沒 progs 的先別生成） */
const buildModuleRoute = (m: IModuleMeta, ctx: IServerElementFactoryCtx): NonIndexRouteObject => ({
  path: m.ModuleCode,
  handle: buildModuleHandle(m.ModuleCode),
  children: (m.Progs ?? []).map(p => buildProgRoute(m.ModuleCode, p, ctx)),
});

/** 從 Data 產生 /Server 的 children routes */
export const buildServerChildrenFromData = (modules: IModuleMeta[], ctx: IServerElementFactoryCtx): RouteObject[] => {
  return (modules ?? [])
    .filter(m => (m.Progs?.length ?? 0) > 0) // ✅ 避免把 Logout 這種空 module 生成進 /Server children
    .map(m => buildModuleRoute(m, ctx));
};
