import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { DividerComp } from "@/SysCore/Components/Divider/Divider_Comp";
import { LoadingErrorHandler } from "@/SysCore/Components/LoadingErrorHandler";
import type React from "react";

// #region Property
export interface FormShellToolbarButton
{
    title: string;
    action: () => void | Promise<void>;
    disabled?: boolean;
    className?: string;
}
interface FormShellCompProps
{
    prop: FormCompProp;
    basicToolbarButtons?: FormShellToolbarButton[];
    actionToolbarButtons?: FormShellToolbarButton[];
    children: React.ReactNode;
}
// #endregion

// #region Public
/** 後台表單與功能頁的共用外框，負責標題、工具列、Loading 與內容區塊。 */
export const FormShellComp = (props: FormShellCompProps) =>
{
    return (
        <div className="Form-Main-Content">
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <FormShellHeader prop={props.prop} buttons={props.basicToolbarButtons ?? []} />
                        <FormShellBody {...props} />
                    </div>
                </div>
            </div>
        </div>
    );
};
// #endregion

// #region Section
/** 固定在畫面上方的標題與基礎工具列區塊。 */
const FormShellHeader = (props: { prop: FormCompProp; buttons: FormShellToolbarButton[]; }) =>
{
    return (
        <div className="card-header" style={formShellHeaderStyle}>
            <h3 style={formShellTitleStyle}>
                <i className="fas fa-braille me-2"></i>
                {props.prop.Title}
            </h3>
            <FormShellToolbar buttons={props.buttons} ariaLabel="基礎工具列" />
        </div>
    );
};

const FormShellBody = (props: FormShellCompProps) =>
{
    const hasActionToolbar = Boolean(props.actionToolbarButtons?.length);
    return (
        <div className="card-body">
            <div className="row">
                <div className="col-12">
                    <LoadingErrorHandler isLoading={props.prop.IsLoading} errorList={props.prop.ErrorList}>
                        {props.children}
                        {hasActionToolbar && (
                            <>
                                <DividerComp />
                                <FormShellToolbar buttons={props.actionToolbarButtons ?? []} ariaLabel="功能工具列" />
                            </>
                        )}
                    </LoadingErrorHandler>
                </div>
            </div>
        </div>
    );
};

// #endregion

// #region EntityComp
/** 依照 button 設定渲染工具列按鈕。 */
const FormShellToolbar = (props: { buttons: FormShellToolbarButton[]; ariaLabel: string; }) =>
{
    if (!props.buttons.length) return null;
    return (
        <div className="row mx-0" role="toolbar" aria-label={props.ariaLabel}>
            <div className="col form-group mb-0 px-0">
                <div className="d-flex flex-wrap justify-content-start">
                    {props.buttons.map((button) => (
                        <button key={button.title} type="button" className={button.className ?? defaultButtonClassName} title={button.title} disabled={button.disabled} onClick={button.action}>
                            {button.title}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
// #endregion

// #region Private
const defaultButtonClassName = "btn btn-custom btn-rounded btn-sm mr-2 mb-2";
const formShellHeaderStyle: React.CSSProperties = {
    position: "sticky",
    top: "72px",
    zIndex: 20,
    backgroundColor: "#fff",
};
const formShellTitleStyle: React.CSSProperties = {
    marginBottom: "0.75rem",
};
// #endregion
