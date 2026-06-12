import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import type {
    ApiAdapterError,
    ApiDataHookGroup,
    ApiFormInitial,
    ApiFormMode,
    EffectDeps,
    ServerActionMode,
    ServerFormActions,
    UseServerActionsOptions,
    UseServerActionsResult,
} from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { useCallback, useEffect, useMemo, useState } from "react";

// #region Property
export type ServerFormBinding<TSet> = UseFetchFormDataResult<TSet>;

export type ServerFormRefetch = () => Promise<void>;

export interface ServerFormBaseActionOptions
{
    /** 返回 List 頁或上一層頁面 */
    onBackToList: () => void;

    /** 可選的預覽行為 */
    onPreview?: () => void;
}

export interface ServerFormDataAdapter<TSet>
{
    /** 後台表單標準查詢 Hook */
    hooks: Pick<ApiDataHookGroup<TSet>, "useQueryFormData">;

    /** 後台表單標準 CUD 行為 */
    useServerActions: (opt?: UseServerActionsOptions) => UseServerActionsResult<TSet>;
}

export interface ServerFormModeContext<TSet, TActionOpt>
{
    /** 目前資料 internalId，空值代表新增 */
    internalId: string;

    /** 新增模式的預設資料 */
    emptyData: TSet;

    /** 外部傳入的表單動作設定 */
    actionsOpt: TActionOpt;
}

export interface ServerFormTitleContext<TSet, TActionOpt> extends ServerFormModeContext<TSet, TActionOpt>
{
    /** 表單模式，給 Feature / Spec 判斷標題 */
    mode: ApiFormMode;

    /** 後端 ModelDisplayName，給 Feature / Spec 建立標題 */
    displayName: ModelDisplaySchema;
}

export interface ServerFormDataSourceContext<TSet, TAdapter, TActionOpt> extends ServerFormModeContext<TSet, TActionOpt>
{
    /** Feature 或 Spec 建立出的完整 Adapter */
    adapter: TAdapter;

    /** 實際負責主資料查詢的 Adapter */
    dataAdapter: ServerFormDataAdapter<TSet>;

    /** 表單模式 */
    mode: ApiFormMode;
}

export interface ServerFormReferenceContext<TSet, TAdapter, TActionOpt, TRefs> extends ServerFormDataSourceContext<TSet, TAdapter, TActionOpt>
{
    /** 表單可編輯 Binding */
    binding: ServerFormBinding<TSet>;

    /** Feature 已建立出的參照資料，Spec 可用來追加或覆寫 */
    featureRefs?: TRefs;
}

export interface ServerFormReferenceResult<TRefs>
{
    /** Header / Detail 會使用的參照資料 */
    refs: TRefs;

    /** 參照資料是否載入中 */
    isLoading?: boolean;

    /** 參照資料錯誤訊息 */
    errors?: (string | null | undefined)[];

    /** 重新查詢參照資料 */
    refetchRefData?: () => Promise<void> | void;
}

export interface ServerFormActionContext<TSet, TAdapter, TRefs, TRawData, TActionOpt> extends ServerFormReferenceContext<TSet, TAdapter, TActionOpt, TRefs>
{
    /** Header / Detail 最終使用的參照資料 */
    refs: TRefs;

    /** 後台標準 CUD Actions */
    serverActions: UseServerActionsResult<TSet>;

    /** Template 依標準規則建立出的預設 Actions */
    defaultActions: ServerFormActions;

    /** 目前已建立出的原始資料 */
    rawData?: TRawData;
}

export interface ServerFormRawDataContext<TSet, TAdapter, TRefs, TActionOpt> extends ServerFormReferenceContext<TSet, TAdapter, TActionOpt, TRefs>
{
    /** Header / Detail 最終使用的參照資料 */
    refs: TRefs;

    /** 後台 Form Toolbar 使用的動作 */
    actions: ServerFormActions;
}

export interface ServerFormPropContext<TSet, TAdapter, TRefs, TRawData, TActionOpt> extends ServerFormRawDataContext<TSet, TAdapter, TRefs, TActionOpt>
{
    /** 最終 rawData */
    rawData: TRawData;

    /** 主資料與參照資料彙整後的 loading */
    isLoading: boolean;

    /** 主資料與參照資料彙整後的錯誤 */
    errors: string[];
}

export interface ServerFormDefaultRawData<TSet, TRefs>
{
    /** 給 Header / Detail 使用的表單 Binding */
    formData: ServerFormBinding<TSet>;

    /** 給 Header / Detail 使用的參照資料 */
    refs: TRefs;

    /** 給 Form Toolbar 使用的標準行為 */
    actions: ServerFormActions;
}

export interface ServerFormFeatureTiming<TSet, TAdapter, TRefs, TRawData, TActionOpt>
{
    /** 建立 Feature 預設 Adapter */
    buildAdapter: () => TAdapter;

    /** 從 Adapter 中取出主資料使用的 ApiDataAdapter */
    selectDataAdapter?: (adapter: TAdapter) => ServerFormDataAdapter<TSet>;

    /** 判斷新增或編輯模式 */
    resolveMode?: (ctx: ServerFormModeContext<TSet, TActionOpt>) => ApiFormMode;

    /** 建立後台卡片標題 */
    buildTitle: (ctx: ServerFormTitleContext<TSet, TActionOpt>) => string;

    /** 建立 useQueryFormData 的 initial 資料 */
    buildInitialData: (ctx: ServerFormDataSourceContext<TSet, TAdapter, TActionOpt>) => ApiFormInitial<TSet> | undefined;

    /** 建立 Feature 參照資料，例如 categoryMap、tagMap、enum */
    useReferenceData?: (ctx: ServerFormReferenceContext<TSet, TAdapter, TActionOpt, TRefs>) => ServerFormReferenceResult<TRefs>;

    /** 建立儲存成功後的 callback */
    buildSuccessActions?: (ctx: ServerFormReferenceContext<TSet, TAdapter, TActionOpt, TRefs>) => Partial<Record<ServerActionMode, () => void | Promise<void>>>;

    /** 建立或覆寫 Form Toolbar Actions */
    buildActions?: (ctx: ServerFormActionContext<TSet, TAdapter, TRefs, TRawData, TActionOpt>, featureActions: ServerFormActions) => ServerFormActions;

    /** 建立 rawData，給舊式或特殊 Form 保留擴充空間 */
    buildRawData?: (ctx: ServerFormRawDataContext<TSet, TAdapter, TRefs, TActionOpt>) => TRawData;

    /** 建立 FormCompProp，通常由 Template 產生預設值即可 */
    buildFormProp?: (ctx: ServerFormPropContext<TSet, TAdapter, TRefs, TRawData, TActionOpt>, featureProp: FormCompProp) => FormCompProp;
}

export interface ServerFormSpecTiming<TSet, TAdapter, TRefs, TRawData, TActionOpt>
{
    /** F 無 S 有時，由 Spec 建立完整 Adapter */
    buildAdapter?: () => TAdapter;

    /** F 有 S 有時，允許 Spec 追加或替換 Feature Adapter */
    extendAdapter?: (adapter: TAdapter) => TAdapter;

    /** 從 Adapter 中取出 Spec 要使用的主資料 Adapter */
    selectDataAdapter?: (adapter: TAdapter, featureAdapter?: ServerFormDataAdapter<TSet>) => ServerFormDataAdapter<TSet>;

    /** Spec 追加或覆寫新增 / 編輯模式 */
    resolveMode?: (ctx: ServerFormModeContext<TSet, TActionOpt>, baseMode: ApiFormMode) => ApiFormMode;

    /** Spec 建立或覆寫後台卡片標題；Spec-only 時不會有 baseTitle */
    buildTitle?: (ctx: ServerFormTitleContext<TSet, TActionOpt>, baseTitle?: string) => string;

    /** Spec 建立或覆寫 initial 資料；Spec-only 時不會有 baseInitial */
    buildInitialData?: (ctx: ServerFormDataSourceContext<TSet, TAdapter, TActionOpt>, baseInitial?: ApiFormInitial<TSet>) => ApiFormInitial<TSet> | undefined;

    /** Spec 追加或覆寫參照資料 */
    useReferenceData?: (ctx: ServerFormReferenceContext<TSet, TAdapter, TActionOpt, TRefs>) => ServerFormReferenceResult<TRefs>;

    /** Spec 追加或覆寫儲存成功後的 callback */
    buildSuccessActions?: (
        ctx: ServerFormReferenceContext<TSet, TAdapter, TActionOpt, TRefs>,
        baseActions: Partial<Record<ServerActionMode, () => void | Promise<void>>>,
    ) => Partial<Record<ServerActionMode, () => void | Promise<void>>>;

    /** Spec 追加或覆寫 Form Toolbar Actions */
    buildActions?: (ctx: ServerFormActionContext<TSet, TAdapter, TRefs, TRawData, TActionOpt>, baseActions: ServerFormActions) => ServerFormActions;

    /** Spec 追加或覆寫 rawData */
    buildRawData?: (ctx: ServerFormRawDataContext<TSet, TAdapter, TRefs, TActionOpt>, baseRawData: TRawData) => TRawData;

    /** Spec 追加或覆寫 FormCompProp */
    buildFormProp?: (ctx: ServerFormPropContext<TSet, TAdapter, TRefs, TRawData, TActionOpt>, baseProp: FormCompProp) => FormCompProp;
}

export interface ServerFormTemplateBase<TSet, TActionOpt>
{
    /** 功能識別碼 */
    featureKey: string;

    /** 後台主題設定 */
    theme: IBETheme;

    /** 當前語系，給參照資料或 Spec 擴充使用 */
    lang?: Lang;

    /** 資料 internalId，空值代表新增 */
    internalId?: string;

    /** 新增模式使用的預設資料 */
    emptyData: TSet;

    /** 外部表單動作設定 */
    actionsOpt: TActionOpt;

    /** 主資料查詢依賴 */
    deps?: EffectDeps;

    /** ModelDisplayName 查詢依賴 */
    modelDeps?: EffectDeps;
}

export interface ServerFormTemplate<TSet, TAdapter, TRefs = unknown, TRawData = ServerFormDefaultRawData<TSet, TRefs>, TActionOpt = ServerFormBaseActionOptions> extends ServerFormTemplateBase<TSet, TActionOpt>
{
    /** Feature 基礎流程，可用於一般後台 Form 或 F 有 S 有情境 */
    feature?: ServerFormFeatureTiming<TSet, TAdapter, TRefs, TRawData, TActionOpt>;

    /** Spec 客製流程，可用於 F 有 S 有、F 沒有 S 有情境 */
    spec?: ServerFormSpecTiming<TSet, TAdapter, TRefs, TRawData, TActionOpt>;
}

export interface ServerFormTemplateViewModel<
    TSet,
    TAdapter,
    TRefs = unknown,
    TRawData = ServerFormDefaultRawData<TSet, TRefs>,
    TActionOpt = ServerFormBaseActionOptions,
>
{
    /** 功能識別碼 */
    featureKey: string;

    /** 後台卡片標題 */
    title: string;

    /** 新增或編輯模式 */
    mode: ApiFormMode;

    /** 資料 internalId */
    internalId: string;

    /** Feature 或 Spec 建立出的完整 Adapter */
    adapter: TAdapter;

    /** 實際負責主資料查詢的 Adapter */
    dataAdapter: ServerFormDataAdapter<TSet>;

    /** 給 Header / Detail 使用的表單 Binding */
    binding: ServerFormBinding<TSet>;

    /** 給 Header / Detail 使用的參照資料 */
    refs: TRefs;

    /** 給特殊 Form 使用的原始資料 */
    rawData: TRawData;

    /** 給 FormTemplate_Comp 使用的外框資料 */
    formProp: FormCompProp;

    /** Form Toolbar 動作 */
    actions: ServerFormActions;

    /** 主資料與參照資料彙整後的 loading */
    isLoading: boolean;

    /** 主資料與參照資料彙整後的錯誤 */
    errors: string[];

    /** 重新查詢主資料 */
    refetchData: ServerFormRefetch;

    /** 重新查詢參照資料 */
    refetchRefData: ServerFormRefetch;

    /** 外部動作設定，保留給特殊 Header / Detail 使用 */
    actionsOpt: TActionOpt;
}

const emptyDisplayName: ModelDisplaySchema = { ModelId: "", ModelDisplayName: "", Tables: [] } as ModelDisplaySchema;

const emptyRefs = {} as unknown;
// #endregion

// #region Public
/** 後台 Form 共用流程：支援 F 有 S 沒有、F 有 S 有、F 沒有 S 有三種情境 */
export const useServerFormTemplate = <
    TSet,
    TAdapter,
    TRefs = unknown,
    TRawData = ServerFormDefaultRawData<TSet, TRefs>,
    TActionOpt = ServerFormBaseActionOptions,
>(template: ServerFormTemplate<TSet, TAdapter, TRefs, TRawData, TActionOpt>): ServerFormTemplateViewModel<TSet, TAdapter, TRefs, TRawData, TActionOpt> =>
{
    const { publish } = useToast();
    const internalId = template.internalId ?? "";
    const onError = useCallback((err: ApiAdapterError) =>
    {
        publish({ level: MessageStatus.Error, title: err.messageText });
    }, [publish]);

    const adapter = useMemo(() => buildTemplateAdapter(template), [template]);
    const dataAdapter = useMemo(() => selectTemplateDataAdapter(template, adapter), [template, adapter]);
    const modeCtx: ServerFormModeContext<TSet, TActionOpt> = { internalId, emptyData: template.emptyData, actionsOpt: template.actionsOpt };
    const mode = useMemo(() => resolveTemplateMode(template, modeCtx), [template, modeCtx]);
    const dataCtx: ServerFormDataSourceContext<TSet, TAdapter, TActionOpt> = { ...modeCtx, adapter, dataAdapter, mode };
    const initial = useMemo(() => buildTemplateInitial(template, dataCtx), [template, dataCtx]);
    const mainData = dataAdapter.hooks.useQueryFormData({
        mode,
        internalId,
        empty: template.emptyData,
        deps: template.deps ?? [internalId, mode],
        modelDeps: template.modelDeps ?? [],
        initial,
        onError,
    });
    const binding = useEditableFormBinding({ source: mainData, emptyData: template.emptyData, mode });
    const titleCtx: ServerFormTitleContext<TSet, TActionOpt> = { ...modeCtx, mode, displayName: mainData.modelDisplayName ?? emptyDisplayName };
    const title = useMemo(() => buildTemplateTitle(template, titleCtx), [template, titleCtx]);
    const refBaseCtx: ServerFormReferenceContext<TSet, TAdapter, TActionOpt, TRefs> = { ...dataCtx, binding };
    const featureRefs = useFeatureReferenceData(template, refBaseCtx);
    const specRefs = useSpecReferenceData(template, { ...refBaseCtx, featureRefs: featureRefs.refs });
    const refs = specRefs?.refs ?? featureRefs.refs;
    const refCtx: ServerFormReferenceContext<TSet, TAdapter, TActionOpt, TRefs> = { ...refBaseCtx, featureRefs: featureRefs.refs };
    const successByMode = useMemo(
        () => ({ ...buildDefaultSuccessActions(template.actionsOpt), ...buildTemplateSuccessActions(template, { ...refCtx, featureRefs: refs }) }),
        [template, refCtx, refs],
    );
    const serverActions = dataAdapter.useServerActions({ onSuccessByMode: successByMode });
    const defaultActions = useDefaultFormActions({ mode, internalId, binding, serverActions, actionsOpt: template.actionsOpt });
    const actionCtx: ServerFormActionContext<TSet, TAdapter, TRefs, TRawData, TActionOpt> = { ...refCtx, refs, serverActions, defaultActions };
    const actions = useMemo(() => buildTemplateActions(template, actionCtx), [template, actionCtx]);
    const rawCtx: ServerFormRawDataContext<TSet, TAdapter, TRefs, TActionOpt> = { ...refCtx, refs, actions };
    const rawData = useMemo(() => buildTemplateRawData(template, rawCtx), [template, rawCtx]);
    const refetchData = useCallback(async () => await mainData.refetchData(), [mainData]);
    const refetchRefData = useReferenceRefetch(featureRefs, specRefs);
    const errors = useMemo(() => normalizeErrors([...mainData.errors, ...(featureRefs.errors ?? []), ...(specRefs?.errors ?? [])]), [
        mainData.errors,
        featureRefs.errors,
        specRefs?.errors,
    ]);
    const isLoading = Boolean(mainData.isLoading || featureRefs.isLoading || specRefs?.isLoading);
    const propCtx: ServerFormPropContext<TSet, TAdapter, TRefs, TRawData, TActionOpt> & { title: string; } = { ...rawCtx, rawData, isLoading, errors, title };
    const formProp = useMemo(() => buildTemplateFormProp(template, propCtx), [template, propCtx]);

    return {
        featureKey: template.featureKey,
        title,
        mode,
        internalId,
        adapter,
        dataAdapter,
        binding,
        refs,
        rawData,
        formProp,
        actions,
        isLoading,
        errors,
        refetchData,
        refetchRefData,
        actionsOpt: template.actionsOpt,
    };
};
// #endregion

// #region Private
/** 確認 Template 至少提供 Feature 或 Spec 流程，避免回到舊式 top-level 入口 */
const assertTemplateTiming = <TSet, TAdapter, TRefs, TRawData, TActionOpt>(template: ServerFormTemplate<TSet, TAdapter, TRefs, TRawData, TActionOpt>): void =>
{
    if (template.feature || template.spec) return;
    throw new Error(`Server_FormTemplate(${template.featureKey}) 需要提供 feature 或 spec timing。`);
};

/** 建立缺少必要 timing 的錯誤訊息，讓規格問題能快速定位 */
const buildMissingTimingError = (featureKey: string, timingName: string): Error =>
{
    return new Error(`Server_FormTemplate(${featureKey}) 需要提供 ${timingName}。`);
};

/** 建立目前 Form 使用的 Adapter，支援 Feature 基礎流程與 Spec-only 流程 */
const buildTemplateAdapter = <TSet, TAdapter, TRefs, TRawData, TActionOpt>(
    template: ServerFormTemplate<TSet, TAdapter, TRefs, TRawData, TActionOpt>,
): TAdapter =>
{
    assertTemplateTiming(template);
    if (template.feature)
    {
        const featureAdapter = template.feature.buildAdapter();
        return template.spec?.extendAdapter?.(featureAdapter) ?? featureAdapter;
    }

    const specAdapter = template.spec?.buildAdapter?.();
    if (specAdapter !== undefined) return specAdapter;
    throw buildMissingTimingError(template.featureKey, "feature.buildAdapter 或 spec.buildAdapter");
};

/** 取得主資料 Adapter，Spec 可覆寫 Feature 的結果，也可獨立提供 Spec-only Adapter */
const selectTemplateDataAdapter = <TSet, TAdapter, TRefs, TRawData, TActionOpt>(
    template: ServerFormTemplate<TSet, TAdapter, TRefs, TRawData, TActionOpt>,
    adapter: TAdapter,
): ServerFormDataAdapter<TSet> =>
{
    const featureAdapter = template.feature
        ? template.feature.selectDataAdapter?.(adapter) ?? (adapter as ServerFormDataAdapter<TSet>)
        : undefined;
    return template.spec?.selectDataAdapter?.(adapter, featureAdapter) ?? featureAdapter ?? (adapter as ServerFormDataAdapter<TSet>);
};

/** 建立表單模式，Feature 先建立基準，Spec 可在後續覆寫 */
const resolveTemplateMode = <TSet, TAdapter, TRefs, TRawData, TActionOpt>(
    template: ServerFormTemplate<TSet, TAdapter, TRefs, TRawData, TActionOpt>,
    ctx: ServerFormModeContext<TSet, TActionOpt>,
): ApiFormMode =>
{
    const defaultMode: ApiFormMode = ctx.internalId ? "edit" : "new";
    const featureMode = template.feature?.resolveMode?.(ctx) ?? defaultMode;
    return template.spec?.resolveMode?.(ctx, featureMode) ?? featureMode;
};

/** 建立後台卡片標題，必須由 Feature 或 Spec 的 timing 明確提供 */
const buildTemplateTitle = <TSet, TAdapter, TRefs, TRawData, TActionOpt>(
    template: ServerFormTemplate<TSet, TAdapter, TRefs, TRawData, TActionOpt>,
    ctx: ServerFormTitleContext<TSet, TActionOpt>,
): string =>
{
    const featureTitle = template.feature?.buildTitle(ctx);
    const specTitle = template.spec?.buildTitle?.(ctx, featureTitle);
    const title = specTitle ?? featureTitle;
    if (title !== undefined) return title;
    throw buildMissingTimingError(template.featureKey, "feature.buildTitle 或 spec.buildTitle");
};

/** 建立 QueryForm initial，必須由 Feature 或 Spec 的 timing 明確提供 */
const buildTemplateInitial = <TSet, TAdapter, TRefs, TRawData, TActionOpt>(
    template: ServerFormTemplate<TSet, TAdapter, TRefs, TRawData, TActionOpt>,
    ctx: ServerFormDataSourceContext<TSet, TAdapter, TActionOpt>,
): ApiFormInitial<TSet> | undefined =>
{
    const hasSpecInitial = Boolean(template.spec?.buildInitialData);
    if (!template.feature && !hasSpecInitial) throw buildMissingTimingError(template.featureKey, "feature.buildInitialData 或 spec.buildInitialData");

    const featureInitial = template.feature?.buildInitialData(ctx);
    return hasSpecInitial ? template.spec?.buildInitialData?.(ctx, featureInitial) : featureInitial;
};

/** 將 QueryFormData 結果同步成可編輯 Binding */
const useEditableFormBinding = <TSet>(
    opt: { source: ReturnType<ApiDataHookGroup<TSet>["useQueryFormData"]>; emptyData: TSet; mode: ApiFormMode; },
): ServerFormBinding<TSet> =>
{
    const [data, setFormData] = useState<TSet>(opt.emptyData);
    useEffect(() =>
    {
        if (opt.source.data) setFormData(opt.source.data);
        else if (opt.mode === "new") setFormData(opt.emptyData);
    }, [opt.source.data, opt.mode, opt.emptyData]);

    return {
        data,
        setFormData,
        isLoading: opt.source.isLoading,
        error: opt.source.errorText,
        refetch: () => void opt.source.refetchData(),
        displayName: opt.source.modelDisplayName ?? emptyDisplayName,
    };
};

/** 建立預設參照資料結果，避免沒有 refs 時 Header / Detail 取值爆掉 */
const buildEmptyReferenceResult = <TRefs>(): ServerFormReferenceResult<TRefs> =>
{
    return { refs: emptyRefs as TRefs, isLoading: false, errors: [], refetchRefData: undefined };
};

/** 建立 Feature 參照資料，沒有 Feature 時回傳空參照 */
const useFeatureReferenceData = <TSet, TAdapter, TRefs, TRawData, TActionOpt>(
    template: ServerFormTemplate<TSet, TAdapter, TRefs, TRawData, TActionOpt>,
    ctx: ServerFormReferenceContext<TSet, TAdapter, TActionOpt, TRefs>,
): ServerFormReferenceResult<TRefs> =>
{
    return template.feature?.useReferenceData?.(ctx) ?? buildEmptyReferenceResult<TRefs>();
};

/** 建立 Spec 參照資料，Feature + Spec 時可取得 featureRefs */
const useSpecReferenceData = <TSet, TAdapter, TRefs, TRawData, TActionOpt>(
    template: ServerFormTemplate<TSet, TAdapter, TRefs, TRawData, TActionOpt>,
    ctx: ServerFormReferenceContext<TSet, TAdapter, TActionOpt, TRefs>,
): ServerFormReferenceResult<TRefs> | null =>
{
    return template.spec?.useReferenceData?.(ctx) ?? null;
};

/** 建立儲存成功後的 callback，執行順序固定為 Feature 先、Spec 後 */
const buildTemplateSuccessActions = <TSet, TAdapter, TRefs, TRawData, TActionOpt>(
    template: ServerFormTemplate<TSet, TAdapter, TRefs, TRawData, TActionOpt>,
    ctx: ServerFormReferenceContext<TSet, TAdapter, TActionOpt, TRefs>,
): Partial<Record<ServerActionMode, () => void | Promise<void>>> =>
{
    const featureActions = template.feature?.buildSuccessActions?.(ctx) ?? {};
    return template.spec?.buildSuccessActions?.(ctx, featureActions) ?? featureActions;
};

/** 建立預設成功 callback，若未客製則 CUD 成功後返回清單 */
const buildDefaultSuccessActions = <TActionOpt>(actionsOpt: TActionOpt): Partial<Record<ServerActionMode, () => void | Promise<void>>> =>
{
    const back = (actionsOpt as ServerFormBaseActionOptions | undefined)?.onBackToList;
    if (!back) return {};
    return { create: back, update: back, delete: back };
};

/** 建立預設 Form Toolbar Actions */
const useDefaultFormActions = <TSet, TActionOpt>(
    opt: { mode: ApiFormMode; internalId: string; binding: ServerFormBinding<TSet>; serverActions: UseServerActionsResult<TSet>; actionsOpt: TActionOpt; },
): ServerFormActions =>
{
    const save = useCallback(async () =>
    {
        if (opt.mode === "new") await opt.serverActions.createAsync(opt.binding.data);
        else await opt.serverActions.updateAsync(opt.internalId, opt.binding.data);
    }, [opt.mode, opt.internalId, opt.binding.data, opt.serverActions]);

    const deleteData = useCallback(async () =>
    {
        if (!opt.internalId) return;
        await opt.serverActions.deleteAsync(opt.internalId);
    }, [opt.internalId, opt.serverActions]);

    return {
        Save: save,
        Delete: deleteData,
        Back: (opt.actionsOpt as ServerFormBaseActionOptions).onBackToList,
        Preview: (opt.actionsOpt as ServerFormBaseActionOptions).onPreview,
        IsSaving: opt.serverActions.isSaving,
    };
};

/** 建立最終 Actions，執行順序固定為 Feature 先、Spec 後 */
const buildTemplateActions = <TSet, TAdapter, TRefs, TRawData, TActionOpt>(
    template: ServerFormTemplate<TSet, TAdapter, TRefs, TRawData, TActionOpt>,
    ctx: ServerFormActionContext<TSet, TAdapter, TRefs, TRawData, TActionOpt>,
): ServerFormActions =>
{
    const featureActions = template.feature?.buildActions?.(ctx, ctx.defaultActions) ?? ctx.defaultActions;
    return template.spec?.buildActions?.(ctx, featureActions) ?? featureActions;
};

/** 建立預設 rawData，讓新模板與舊 Form 寫法都能銜接 */
const buildDefaultRawData = <TSet, TRefs, TRawData>(ctx: ServerFormRawDataContext<TSet, unknown, TRefs, unknown>): TRawData =>
{
    return { formData: ctx.binding, refs: ctx.refs, actions: ctx.actions } as TRawData;
};

/** 建立最終 rawData，執行順序固定為 Feature 先、Spec 後 */
const buildTemplateRawData = <TSet, TAdapter, TRefs, TRawData, TActionOpt>(
    template: ServerFormTemplate<TSet, TAdapter, TRefs, TRawData, TActionOpt>,
    ctx: ServerFormRawDataContext<TSet, TAdapter, TRefs, TActionOpt>,
): TRawData =>
{
    const featureRaw = template.feature?.buildRawData?.(ctx) ?? buildDefaultRawData<TSet, TRefs, TRawData>(ctx);
    return template.spec?.buildRawData?.(ctx, featureRaw) ?? featureRaw;
};

/** 建立預設 FormCompProp */
const buildDefaultFormProp = <TSet, TActionOpt>(
    template: ServerFormTemplateBase<TSet, TActionOpt>,
    ctx: { title: string; isLoading: boolean; errors: string[]; actions: ServerFormActions; },
): FormCompProp =>
{
    return { Title: ctx.title, Theme: template.theme, IsLoading: ctx.isLoading, ErrorList: ctx.errors, Actions: ctx.actions };
};

/** 建立最終 FormCompProp，執行順序固定為 Feature 先、Spec 後 */
const buildTemplateFormProp = <TSet, TAdapter, TRefs, TRawData, TActionOpt>(
    template: ServerFormTemplate<TSet, TAdapter, TRefs, TRawData, TActionOpt>,
    ctx: ServerFormPropContext<TSet, TAdapter, TRefs, TRawData, TActionOpt> & { title: string; },
): FormCompProp =>
{
    const baseProp = buildDefaultFormProp(template, { title: ctx.title, isLoading: ctx.isLoading, errors: ctx.errors, actions: ctx.actions });
    const featureProp = template.feature?.buildFormProp?.(ctx, baseProp) ?? baseProp;
    return template.spec?.buildFormProp?.(ctx, featureProp) ?? featureProp;
};

/** 正規化錯誤訊息，移除空字串與 null */
const normalizeErrors = (errors: (string | null | undefined)[]): string[] =>
{
    return errors.filter((item): item is string => Boolean(item));
};

/** 建立重新查詢參照資料的固定動作 */
const useReferenceRefetch = <TRefs>(featureRefs: ServerFormReferenceResult<TRefs>, specRefs: ServerFormReferenceResult<TRefs> | null): ServerFormRefetch =>
{
    return useCallback(async () =>
    {
        await featureRefs.refetchRefData?.();
        await specRefs?.refetchRefData?.();
    }, [featureRefs, specRefs]);
};
// #endregion
