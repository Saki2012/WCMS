import { Server_CategoryListFormComp } from "@/Features/Pages/Server/BizFunc/COMM/Category/Server_Category_ListForm_Comp";
import { BannerSliderFormComp } from "@/Features/Pages/Server/BizFunc/WEB/Banner/Server_BannerSlider_Form_Comp";
import type { IModuleMeta, IProgMeta } from "@/Features/Pages/Server/Scaffold/Routes/ServerModuleRoutesData";
import { PGID } from "@/types/SchemaFields";
import { spec1817BannerDetailInfoExtension } from "../BizFunc/WEB/Banner/Server_BannerSlider_Extension";
import { Server_SpecMusical_Form_Comp } from "../BizFunc/WEB/SpecMusical/Server_SpecMusical_Form_Comp";
import { Server_SpecMusical_List_Comp } from "../BizFunc/WEB/SpecMusical/Server_SpecMusical_List_Comp";

// #region Public
/** 套用 Spec1817 後台路由擴充。 */
export const extendServerModuleRoutes = (modules: IModuleMeta[]): IModuleMeta[] =>
{
    const web = modules.find(m => m.ModuleCode === "WebManagement");
    if (!web) return modules;

    applyBannerSliderExtension(web);
    appendSpecMusical(web);
    return modules;
};
// #endregion

// #region Private
/** 將 Spec1817 Banner 語系客製欄位注入 Feature Banner Form。 */
const applyBannerSliderExtension = (web: IModuleMeta): void =>
{
    const banner = web.Progs.find(p => p.ProgId === "BannerSlider");
    const form = banner?.Actions.find(action => action.ActionCode === "Form");
    if (!form) return;

    form.elementFactory = ctx => <BannerSliderFormComp theme={ctx.theme} lang={ctx.lang} detailInfoExtension={spec1817BannerDetailInfoExtension} />;
};

/** 加入 Spec1817 琵琶介紹後台功能。 */
const appendSpecMusical = (web: IModuleMeta): void =>
{
    const exists = web.Progs.some(p => p.ProgId === PGID.SpecMusical);
    if (exists) return;

    const prog: IProgMeta = {
        ProgId: PGID.SpecMusical,
        Title: "琵琶介紹",
        DefaultActionCode: "List",
        IconClassName: "fas fa-music",
        Actions: [{
            ActionCode: "List",
            Title: "琵琶列表",
            RoutePath: "List",
            elementFactory: ctx => <Server_SpecMusical_List_Comp title="琵琶介紹列表" theme={ctx.theme} lang={ctx.lang} />,
        }, {
            ActionCode: "Form",
            Title: "新增資料",
            RoutePath: "Form/:internalId?",
            elementFactory: ctx => <Server_SpecMusical_Form_Comp theme={ctx.theme} lang={ctx.lang} />,
        }, {
            ActionCode: "Category",
            Title: "類別",
            RoutePath: "Category/:internalId?",
            elementFactory: ctx => <Server_CategoryListFormComp progId={PGID.SpecMusical} title="類別" theme={ctx.theme} lang={ctx.lang} />,
        }],
    };

    web.Progs.push(prog);
};
// #endregion
