import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { getClientSlotPath } from "@/Features/Pages/Client/Scaffold/Slot/Client_SlotPath";
import { ModuleContent, type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import { PGID } from "@/types/SchemaFields";
import type { FormEvent } from "react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { Client_Survey_Input_Comp } from "./Client_Survey_Input_Comp";
import "./Client_Survey_Form.css";
import { Captcha_Comp } from "@/Features/Hooks/BizFunc/SYS/Captcha/Captcha_Comp";
import { useCaptchaController } from "@/Features/Hooks/BizFunc/SYS/Captcha/Captcha_Hook";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import { LibText, LibValidation } from "@/SysCore/Utils/Library/LibData";
import { resolveSpecComponent } from "@/SysCore/Utils/Library/SlotResolver";
import type { components } from "@/types/api";
import { SurveySubmissionsFields } from "@/types/SchemaFields";
import { type ISurveyOptions, type SurveySubmitActions, useSurveyFormData } from "./Client_Survey_Form_Loader";
import { getSurveyFieldKey, getSurveyScalarValue, normalizeSurveyInputType, SURVEY_INPUT_TYPE, type SurveyInputItem, type SurveyInputLangItem, type SurveyInputValue, type SurveyInputValueMap } from "./Client_Survey_Input_Lib";

// #region Property
type SurveySubmissionRequest = components["schemas"]["SurveySubmissionRequest_DTO"];
export interface ISurveyProps
{
    site: INormSite;
    node: INormNode;
    lang: Lang;
    theme?: IFETheme;
    options?: ISurveyOptions;
}
type SurveyFormVm = ReturnType<typeof useSurveyFormData>;
export interface SurveyFormViewProps extends ISurveyProps
{
    /** 問卷 InternalId，供瀏覽次數、送出後重置與 Spec View 使用。 */
    surveyInternalId: string;
    /** Feature Hook 整理後的問卷資料與送出動作。 */
    vm: SurveyFormVm;
    /** 問卷動態題目資料。 */
    surveyItems: SurveyInputItem[];
    /** 問卷動態題目語系資料。 */
    surveyItemLangs: SurveyInputLangItem[];
    /** 前台瀏覽次數設定。 */
    viewCountConfig: ModuleViewCountConfig;
}
interface SurveySubmitText
{
    submit: string;
    reset: string;
    formTitle: string;
    baseTitle: string;
    dynamicTitle: string;
    requiredError: string;
    emailError: string;
    phoneError: string;
    numberError: string;
    dateError: string;
    submitting: string;
    submitOk: string;
    submitFail: string;
    captchaTitle: string;
    captchaHint: string;
    captchaRequired: string;
    captchaRequiredError: string;
    captchaExpiredError: string;
    captchaError: string;
    captchaConfigInvalidError: string;
}
interface SurveySubmitResult
{
    type: "success" | "danger";
    text: string;
}
type SurveySubmissionDraft = SurveySubmissionRequest & {
    SurveyId: string;
    Lang: Lang;
    UserName: string;
    Email: string;
    ContactPhone: string;
    FormDataJson: string;
    TimeZone?: string;
    CaptchaToken?: string | null;
};
type SurveyBaseFieldKey = "UserName" | "Email" | "ContactPhone";
interface SurveyBaseValues
{
    UserName: string;
    Email: string;
    ContactPhone: string;
}
interface SurveyBaseFieldSetting
{
    key: SurveyBaseFieldKey;
    label: string;
    inputType: "text" | "email" | "tel";
    autoComplete: string;
    inputMode?: "text" | "email" | "tel";
    isRequired: boolean;
}
interface SurveyBaseFieldOverride
{
    hidden?: SurveyBaseFieldKey[];
    required?: Partial<Record<SurveyBaseFieldKey, boolean>>;
}
/** 問卷固定欄位預設設定 */
const SURVEY_BASE_FIELD_DEFAULTS: Omit<SurveyBaseFieldSetting, "label">[] = [
    { key: SurveySubmissionsFields.UserName, inputType: "text", autoComplete: "name", inputMode: "text", isRequired: true },
    { key: SurveySubmissionsFields.Email, inputType: "email", autoComplete: "email", inputMode: "email", isRequired: true },
    { key: SurveySubmissionsFields.ContactPhone, inputType: "tel", autoComplete: "tel", inputMode: "tel", isRequired: false },
];
/** 依問卷 ID 調整固定欄位，之後要隱藏可從這裡開始收斂 */
const SURVEY_BASE_FIELD_OVERRIDE_MAP: Partial<Record<string, SurveyBaseFieldOverride>> = {};
const SURVEY_BASE_FIELD_TEXT_MAP: Record<string, Record<SurveyBaseFieldKey, string>> = {
    "zh-tw": { [SurveySubmissionsFields.UserName]: "姓名", [SurveySubmissionsFields.Email]: "Email", [SurveySubmissionsFields.ContactPhone]: "聯絡電話" },
    "en": { [SurveySubmissionsFields.UserName]: "Name", [SurveySubmissionsFields.Email]: "Email", [SurveySubmissionsFields.ContactPhone]: "Phone" },
};

const SURVEY_SUBMIT_TEXT_FALLBACK: SurveySubmitText = {
    submit: "送出",
    submitting: "送出中...",
    reset: "清除重填",
    formTitle: "問卷表單",
    baseTitle: "基本資料",
    dynamicTitle: "問卷內容",
    requiredError: "此欄位為必填",
    emailError: "請輸入正確的 Email 格式",
    phoneError: "請輸入正確的電話格式",
    numberError: "請輸入正確的數值格式",
    dateError: "請輸入正確的日期格式",
    submitOk: "問卷已成功送出。",
    submitFail: "請確認表單欄位是否填寫正確。",
    captchaTitle: "我不是機器人",
    captchaHint: "請完成驗證後再送出問卷。",
    captchaRequired: "必填",
    captchaRequiredError: "請先勾選我不是機器人。",
    captchaExpiredError: "驗證碼已逾時，請重新驗證。",
    captchaError: "驗證碼載入或驗證發生錯誤，請重新驗證。",
    captchaConfigInvalidError: "驗證碼設定異常，暫時無法送出。",
};
const SURVEY_SUBMIT_TEXT_MAP: Partial<Record<Lang, SurveySubmitText>> = {
    "zh-tw": SURVEY_SUBMIT_TEXT_FALLBACK,
    "en": {
        submit: "Submit",
        submitting: "Submitting...",
        reset: "Reset",
        formTitle: "Survey form",
        baseTitle: "Basic information",
        dynamicTitle: "Survey questions",
        requiredError: "This field is required.",
        emailError: "Please enter a valid email address.",
        phoneError: "Please enter a valid phone number.",
        numberError: "Please enter a valid number.",
        dateError: "Please enter a valid date.",
        submitOk: "The survey has been submitted successfully.",
        submitFail: "Please check the form fields.",
        captchaTitle: "I'm not a robot",
        captchaHint: "Please complete the verification before submitting the survey.",
        captchaRequired: "Required",
        captchaRequiredError: "Please complete the verification first.",
        captchaExpiredError: "The verification has expired. Please verify again.",
        captchaError: "The verification failed to load or verify. Please try again.",
        captchaConfigInvalidError: "The verification service is not configured correctly.",
    },
};
// #endregion

// #region Variable
/** Survey Form View 快取，避免每次 render 重複解析 Spec View。 */
let surveyFormViewCache: typeof Client_Survey_Form_FeatureView | null = null;
// #endregion

// #region Public
/** Survey 表單完整 Comp，負責取得 Feature Hook 資料，再交給 Form Entry。 */
export const Client_Survey_Form_Comp = (props: ISurveyProps) =>
{
    const surveyInternalId = LibText.safeTrim(props.options?.SurveyId);
    const vm = useSurveyFormData({ lang: props.lang, surveyId: surveyInternalId });
    const viewCountConfig = useViewCountConfig({ siteIndex: props.site.siteIndex, surveyId: surveyInternalId });
    const surveyItems = useMemo(() => buildSurveyItems(vm.data._SurveyItem ?? []), [vm.data._SurveyItem]);
    const surveyItemLangs = useMemo(() => buildSurveyItemLangs(surveyItems), [surveyItems]);
    return <Client_Survey_Form {...props} surveyInternalId={surveyInternalId} vm={vm} surveyItems={surveyItems} surveyItemLangs={surveyItemLangs} viewCountConfig={viewCountConfig} />;
};

/** Survey FormView Entry，正式前台與 Preview 都從這裡進入。 */
export const Client_Survey_Form = (props: SurveyFormViewProps) =>
{
    const FormView = getSurveyFormView();
    return <FormView {...props} />;
};

/** Survey Feature 預設 View，只負責輸出 DOM。 */
const Client_Survey_Form_FeatureView = (props: SurveyFormViewProps) =>
{
    const hasContentHtml = LibText.safeTrim(props.vm.contentHtml).length > 0;
    const hasSuccessContentHtml = LibText.safeTrim(props.vm.successContentHtml).length > 0;
    const content = hasContentHtml ? <CmsHtml_Comp html={props.vm.contentHtml} lang={props.lang} /> : null;
    const successContent = hasSuccessContentHtml ? <CmsHtml_Comp html={props.vm.successContentHtml} lang={props.lang} /> : null;
    const [isSubmitSuccess, setIsSubmitSuccess] = useState<boolean>(false);
    const shouldShowSuccessContent = isSubmitSuccess && hasSuccessContentHtml;
    useEffect(() =>
    {
        setIsSubmitSuccess(false);
    }, [props.surveyInternalId]);
    return (
        <ModuleContent nodeTitle={props.node.title} title={props.vm.data.SurveyName ?? ""} isLoading={props.vm.isLoading} errorList={props.vm.errorList} viewCountConfig={props.viewCountConfig}>
            {shouldShowSuccessContent
                ? <section className="survey-submit-success-custom" role="status" aria-live="polite">{successContent}</section>
                : (
                    <>
                        {content}
                        {hasContentHtml && props.surveyItems.length > 0 && <hr className="hr-my-4" />}
                        {props.surveyItems.length > 0 && (
                            <SurveyInputForm_Comp
                                lang={props.lang}
                                surveyId={props.vm.data.SurveyId ?? ""}
                                items={props.surveyItems}
                                itemLangs={props.surveyItemLangs}
                                disabled={props.vm.isLoading || props.vm.submitActions.isSubmitting}
                                submitActions={props.vm.submitActions}
                                onSubmitted={() => setIsSubmitSuccess(true)}
                            />
                        )}
                    </>
                )}
        </ModuleContent>
    );
};
// #endregion

// #region Section
/** Survey 動態表單區塊 */
const SurveyInputForm_Comp = (props: { lang: Lang; surveyId: string; items: SurveyInputItem[]; itemLangs: SurveyInputLangItem[]; disabled: boolean; submitActions: SurveySubmitActions; onSubmitted?: () => void; }) =>
{
    const text = getSurveySubmitText(props.lang);
    const formId = useId().replaceAll(":", "");
    const baseFields = useMemo(() => getSurveyBaseFields({ surveyId: props.surveyId, lang: props.lang }), [props.surveyId, props.lang]);
    const [baseValues, setBaseValues] = useState<SurveyBaseValues>(createDefaultSurveyBaseValues());
    const [baseErrorMap, setBaseErrorMap] = useState<Partial<Record<SurveyBaseFieldKey, string>>>({});
    const [values, setValues] = useState<SurveyInputValueMap>({});
    const [errorMap, setErrorMap] = useState<Record<string, string>>({});
    const [submitResult, setSubmitResult] = useState<SurveySubmitResult | null>(null);
    const captchaMessages = useMemo(() => ({ requiredText: text.captchaRequiredError, expiredText: text.captchaExpiredError, errorText: text.captchaError, configInvalidText: text.captchaConfigInvalidError }), [text]);
    const captcha = useCaptchaController({ deps: [props.surveyId, props.lang], messages: captchaMessages });
    const { captchaToken, isLoading: isCaptchaLoading, resetCaptcha, validateCaptcha } = captcha;
    const handleBaseChange = useCallback((key: SurveyBaseFieldKey, value: string) =>
    {
        // 更新固定欄位值
        setBaseValues((prev) => ({ ...prev, [key]: value }));
        // 清除該固定欄位錯誤
        setBaseErrorMap((prev) =>
        {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
        // 清除送出狀態
        setSubmitResult(null);
    }, []);
    const handleChange = useCallback((fieldId: string, value: SurveyInputValue) =>
    {
        // 更新動態欄位值
        setValues((prev) => ({ ...prev, [fieldId]: value }));
        // 清除該動態欄位錯誤
        setErrorMap((prev) =>
        {
            if (!prev[fieldId]) return prev;
            const next = { ...prev };
            delete next[fieldId];
            return next;
        });
        // 清除送出狀態
        setSubmitResult(null);
    }, []);
    const handleReset = useCallback(() =>
    {
        // 清空固定欄位
        setBaseValues(createDefaultSurveyBaseValues());
        // 清空動態欄位
        setValues({});
        // 清空錯誤
        setBaseErrorMap({});
        setErrorMap({});
        // 清空送出狀態
        setSubmitResult(null);
        // 重置驗證碼
        resetCaptcha();
    }, [resetCaptcha]);
    const { items, lang, onSubmitted, submitActions, surveyId } = props;
    const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) =>
    {
        e.preventDefault();
        // 驗證固定欄位
        const nextBaseErrorMap = validateSurveyBaseValues({ fields: baseFields, values: baseValues, text });
        // 驗證動態欄位
        const nextErrorMap = validateSurveyValues({ items, values, text });
        setBaseErrorMap(nextBaseErrorMap);
        setErrorMap(nextErrorMap);
        if (Object.keys(nextBaseErrorMap).length > 0 || Object.keys(nextErrorMap).length > 0)
        {
            setSubmitResult({ type: "danger", text: text.submitFail });
            return;
        }
        if (!validateCaptcha())
        {
            setSubmitResult({ type: "danger", text: text.submitFail });
            return;
        }
        // 建立送出資料
        const draft = buildSurveySubmissionDraft({ surveyId, lang, items, baseValues, values, captchaToken });
        // 呼叫前台匿名提交 API
        const apiRes = await submitActions.publicSubmitAsync(draft);
        if (!apiRes.IsSuccess)
        {
            resetCaptcha();
            setSubmitResult({ type: "danger", text: text.submitFail });
            return;
        }
        // 送出成功後清空表單
        setBaseValues(createDefaultSurveyBaseValues());
        setValues({});
        setBaseErrorMap({});
        setErrorMap({});
        resetCaptcha();
        setSubmitResult({ type: "success", text: text.submitOk });
        onSubmitted?.();
    }, [baseFields, baseValues, captchaToken, items, lang, onSubmitted, resetCaptcha, submitActions, surveyId, text, validateCaptcha, values]);

    return (
        <form className="survey-form" aria-label={text.formTitle} noValidate onSubmit={handleSubmit}>
            <section className="survey-form-section" aria-labelledby={`${formId}_base_title`}>
                <h3 id={`${formId}_base_title`} className="survey-form-section-title">{text.baseTitle}</h3>
                <SurveyBaseFields_Comp fields={baseFields} values={baseValues} errorMap={baseErrorMap} disabled={props.disabled} onChange={handleBaseChange} />
            </section>
            {props.items.length > 0 && (
                <section className="survey-form-section" aria-labelledby={`${formId}_dynamic_title`}>
                    <h3 id={`${formId}_dynamic_title`} className="survey-form-section-title">{text.dynamicTitle}</h3>
                    <Client_Survey_Input_Comp lang={props.lang} items={props.items} itemLangs={props.itemLangs} values={values} errorMap={errorMap} disabled={props.disabled} onChange={handleChange} />
                </section>
            )}
            <Captcha_Comp
                className="survey-form-section mt-3"
                captcha={captcha}
                titleText={text.captchaTitle}
                hintText={text.captchaHint}
                requiredText={text.captchaRequired}
                turnstile={{ action: "survey_submit", cData: props.surveyId || undefined, language: toTurnstileLanguage(props.lang) }}
            />
            <div className="Standard_btnDiv mt-4">
                <button type="button" className="client-survey__button client-survey__button--reset" disabled={props.disabled || props.submitActions.isSubmitting} onClick={handleReset}>{text.reset}</button>
                <button type="submit" className="client-survey__button client-survey__button--submit" disabled={props.disabled || props.submitActions.isSubmitting || isCaptchaLoading}>
                    {props.submitActions.isSubmitting ? text.submitting : text.submit}
                </button>
            </div>
            {submitResult && <div className={`alert alert-${submitResult.type} mt-3`} role="status" aria-live="polite">{submitResult.text}</div>}
        </form>
    );
};
/** Survey 固定欄位 */
const SurveyBaseFields_Comp = (props: { fields: SurveyBaseFieldSetting[]; values: SurveyBaseValues; errorMap: Partial<Record<SurveyBaseFieldKey, string>>; disabled: boolean; onChange: (key: SurveyBaseFieldKey, value: string) => void; }) =>
{
    const reactId = useId().replaceAll(":", "");
    return (
        <div className="survey-input-list survey-base-field-list">
            {props.fields.map((field) =>
            {
                const inputId = `survey_base_${reactId}_${field.key}`;
                const errorText = props.errorMap[field.key] ?? "";
                const errorId = errorText ? `${inputId}_error` : undefined;
                return (
                    <div key={field.key} className="survey-input-field">
                        <label className="form-label" htmlFor={inputId}>
                            {field.label}
                            <RequiredMark isRequired={field.isRequired} />
                        </label>
                        <input
                            id={inputId}
                            name={field.key}
                            type={field.inputType}
                            className={`form-control${errorText ? " is-invalid" : ""}`}
                            value={props.values[field.key]}
                            required={field.isRequired}
                            aria-required={field.isRequired}
                            aria-invalid={Boolean(errorText)}
                            aria-describedby={errorId}
                            autoComplete={field.autoComplete}
                            inputMode={field.inputMode}
                            disabled={props.disabled}
                            onChange={(e) => props.onChange(field.key, e.target.value)}
                        />
                        {errorText && <div id={errorId} className="invalid-feedback d-block">{errorText}</div>}
                    </div>
                );
            })}
        </div>
    );
};
// #endregion

// #region Protected
/** 取得 Survey Form View，有 Spec View 時使用 Spec，否則使用 Feature View。 */
const getSurveyFormView = (): typeof Client_Survey_Form_FeatureView =>
{
    if (surveyFormViewCache !== null)
    {
        return surveyFormViewCache;
    }
    surveyFormViewCache = resolveSpecComponent(getClientSlotPath("Slot_Survey_Form_Comp"), Client_Survey_Form_FeatureView, ["Client_Survey_Form"]);
    return surveyFormViewCache;
};
// #endregion

// #region Private
/** 依 RowNo 排序問卷題目，避免 Graph 回傳順序影響前台顯示。 */
const buildSurveyItems = (items: SurveyInputItem[]): SurveyInputItem[] =>
{
    return [...items].sort((a, b) => Number(a.RowNo ?? a.RowId ?? 0) - Number(b.RowNo ?? b.RowId ?? 0));
};

/** 將各題目的語系子明細攤平，供問卷輸入元件依 ParentRowId 查找。 */
const buildSurveyItemLangs = (items: SurveyInputItem[]): SurveyInputLangItem[] =>
{
    return items.flatMap(item => item._SurveyItemLang ?? []);
};

/** 建立送出草稿，送給 Public_Submit API */
const buildSurveySubmissionDraft = (p: { surveyId: string; lang: Lang; items: SurveyInputItem[]; baseValues: SurveyBaseValues; values: SurveyInputValueMap; captchaToken: string | null; }): SurveySubmissionDraft =>
{
    const formData = p.items.reduce<Record<string, SurveyInputValue>>((map, item) =>
    {
        const fieldId = getSurveyFieldKey(item);
        map[fieldId] = p.values[fieldId] ?? "";
        return map;
    }, {});
    return {
        SurveyId: p.surveyId,
        Lang: p.lang,
        UserName: p.baseValues.UserName.trim(),
        Email: p.baseValues.Email.trim(),
        ContactPhone: p.baseValues.ContactPhone.trim(),
        FormDataJson: JSON.stringify(formData),
        TimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
        CaptchaToken: p.captchaToken,
    };
};
/** 建立瀏覽次數設定 */
const useViewCountConfig = (p: { siteIndex: string; surveyId: string; }): ModuleViewCountConfig =>
{
    return useMemo<ModuleViewCountConfig>(() => ({ mode: "form", contentKey: p.surveyId, request: { SiteIndex: p.siteIndex, ProgId: PGID.Survey, InternalId: p.surveyId } }), [p.siteIndex, p.surveyId]);
};
/** 建立固定欄位預設值 */
const createDefaultSurveyBaseValues = (): SurveyBaseValues =>
{
    return { UserName: "", Email: "", ContactPhone: "" };
};
/** 取得固定欄位 */
const getSurveyBaseFields = (p: { surveyId: string; lang: Lang; }): SurveyBaseFieldSetting[] =>
{
    const override = SURVEY_BASE_FIELD_OVERRIDE_MAP[p.surveyId] ?? {};
    const hiddenSet = new Set<SurveyBaseFieldKey>(override.hidden ?? []);
    return SURVEY_BASE_FIELD_DEFAULTS.filter((field) => !hiddenSet.has(field.key)).map((field) => ({ ...field, label: getSurveyBaseFieldLabel({ key: field.key, lang: p.lang }), isRequired: override.required?.[field.key] ?? field.isRequired }));
};
/** 固定欄位顯示名稱 */
const getSurveyBaseFieldLabel = (p: { key: SurveyBaseFieldKey; lang: Lang; }): string =>
{
    const textMap = SURVEY_BASE_FIELD_TEXT_MAP[p.lang] ?? SURVEY_BASE_FIELD_TEXT_MAP[DefaultLang] ?? SURVEY_BASE_FIELD_TEXT_MAP["zh-tw"];
    return textMap[p.key];
};
/** 驗證固定欄位 */
const validateSurveyBaseValues = (p: { fields: SurveyBaseFieldSetting[]; values: SurveyBaseValues; text: SurveySubmitText; }): Partial<Record<SurveyBaseFieldKey, string>> =>
{
    const errorMap: Partial<Record<SurveyBaseFieldKey, string>> = {};
    p.fields.forEach((field) =>
    {
        const value = p.values[field.key].trim();
        if (field.isRequired && !value)
        {
            errorMap[field.key] = p.text.requiredError;
            return;
        }
        if (!value) return;
        if (field.key === SurveySubmissionsFields.Email && !LibValidation.isEmailValid(value)) errorMap[field.key] = p.text.emailError;
        if (field.key === SurveySubmissionsFields.ContactPhone && !LibValidation.isPhoneValid(value)) errorMap[field.key] = p.text.phoneError;
    });
    return errorMap;
};
/** 必填符號 */
const RequiredMark = (props: { isRequired: boolean; }) =>
{
    if (!props.isRequired) return null;
    return <span className="text-danger ms-1" aria-hidden="true">*</span>;
};
/** 驗證 Survey 欄位 */
const validateSurveyValues = (p: { items: SurveyInputItem[]; values: SurveyInputValueMap; text: SurveySubmitText; }): Record<string, string> =>
{
    const errorMap: Record<string, string> = {};
    p.items.forEach((item) =>
    {
        const fieldId = getSurveyFieldKey(item);
        const value = p.values[fieldId] ?? "";
        const inputType = normalizeSurveyInputType(item.InputType);
        const requiredError = validateRequired({ item, value, text: p.text });
        if (requiredError)
        {
            errorMap[fieldId] = requiredError;
            return;
        }
        const formatError = validateFormat({ inputType, value, text: p.text });
        if (formatError) errorMap[fieldId] = formatError;
    });
    return errorMap;
};
/** 驗證必填 */
const validateRequired = (p: { item: SurveyInputItem; value: SurveyInputValue; text: SurveySubmitText; }): string =>
{
    if (p.item.IsRequired !== true) return "";
    return LibValidation.isRequiredValid(p.value) ? "" : p.text.requiredError;
};
/** 驗證格式 */
const validateFormat = (p: { inputType: number; value: SurveyInputValue; text: SurveySubmitText; }): string =>
{
    const value = getSurveyScalarValue(p.value);
    if (!value) return "";
    if (p.inputType === SURVEY_INPUT_TYPE.Email && !LibValidation.isEmailValid(value)) return p.text.emailError;
    if (p.inputType === SURVEY_INPUT_TYPE.Phone && !LibValidation.isPhoneValid(value)) return p.text.phoneError;
    if (p.inputType === SURVEY_INPUT_TYPE.Number && !LibValidation.isNumberValid(value)) return p.text.numberError;
    if (p.inputType === SURVEY_INPUT_TYPE.Date && !LibValidation.isDateValid(value)) return p.text.dateError;
    return "";
};
/** 轉換 Turnstile 語系代碼 */
const toTurnstileLanguage = (lang: Lang): string =>
{
    const value = `${lang}`.toLowerCase();
    if (value === "zh-tw" || value === "zh-cn") return value;
    if (value.startsWith("en")) return "en";
    return "auto";
};
/** 取得送出文案 */
const getSurveySubmitText = (lang: Lang): SurveySubmitText =>
{
    return SURVEY_SUBMIT_TEXT_MAP[lang] ?? SURVEY_SUBMIT_TEXT_MAP[DefaultLang] ?? SURVEY_SUBMIT_TEXT_FALLBACK;
};
// #endregion
