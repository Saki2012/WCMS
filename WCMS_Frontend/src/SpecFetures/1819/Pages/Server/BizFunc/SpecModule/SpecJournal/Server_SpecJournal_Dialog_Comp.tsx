import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import {
    type PublishJournalReq,
    SpecJournalAdapter,
} from "@/SpecFetures/1819/Hooks/BizFunc/SpecModule/SpecJournal/SpecJournal_Api";
import { type ApiResponse, MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { useCallback, useEffect, useMemo, useState } from "react";

type SpecJournalAdapterType = ReturnType<typeof SpecJournalAdapter>;

export type SpecJournalDialogActionType = "publish" | "revert";

export interface ISpecJournalDialogConfirmPayload
{
    actionType: SpecJournalDialogActionType;
    journalIndexId: string | null;
    journalIndexRowId: number | null;
}

export interface IServerSpecJournalDialogCompProps
{
    theme: IBETheme;
    open: boolean;
    actionType: SpecJournalDialogActionType;
    adapter: SpecJournalAdapterType;
    internalId: string;
    indexOptions: Record<string, string>;
    indexRowOptionsByIndexId: Record<string, Record<string, string>>;
    initialIndexId?: string | null;
    initialIndexRowId: number | null;
    onClose: () => void;
    onConfirm?: (payload: ISpecJournalDialogConfirmPayload) => void;
}

/** SpecJournal 共用 Dialog：發布 / 退回 */
export const Server_SpecJournal_Dialog_Comp = (props: IServerSpecJournalDialogCompProps) =>
{
    const { publish } = useToast();
    const [journalIndexId, setJournalIndexId] = useState<string>("");
    const [journalIndexRowId, setJournalIndexRowId] = useState<number | null>(null);

    const title = useDialogTitle(props.actionType);
    const confirmText = useDialogConfirmText(props.actionType);
    const rowOptions = useRowOptions(props.indexRowOptionsByIndexId, journalIndexId);
    const isPublish = props.actionType === "publish";

    const publishAction = props.adapter.hooks.usePublishJournal();
    const unpublishAction = props.adapter.hooks.useUnpublishJournal();

    const isSubmitting = publishAction.isLoading || unpublishAction.isLoading;

    useSyncDialogState(
        props.open,
        props.initialIndexId,
        props.initialIndexRowId,
        setJournalIndexId,
        setJournalIndexRowId,
    );

    const handleClose = useCallback((): void =>
    {
        if (isSubmitting) return;
        props.onClose();
    }, [isSubmitting, props]);

    const handleIndexChange = useCallback((value: string): void =>
    {
        setJournalIndexId(value);
        setJournalIndexRowId(null);
    }, []);

    const handleRowChange = useCallback((value: number | null): void =>
    {
        setJournalIndexRowId(value);
    }, []);

    const confirmPayload = useMemo<ISpecJournalDialogConfirmPayload>(() =>
    {
        return {
            actionType: props.actionType,
            journalIndexId: isPublish ? toNullable(journalIndexId) : null,
            journalIndexRowId: isPublish ? journalIndexRowId : null,
        };
    }, [props.actionType, isPublish, journalIndexId, journalIndexRowId]);

    const canConfirm = useMemo(() =>
    {
        if (isSubmitting) return false;
        if (!isPublish) return true;
        return Boolean(confirmPayload.journalIndexId && confirmPayload.journalIndexRowId != null);
    }, [isSubmitting, isPublish, confirmPayload]);

    const handleConfirm = useCallback(async (): Promise<void> =>
    {
        if (!props.internalId)
        {
            publish({ level: MessageStatus.Error, title: "執行失敗", text: "查無 InternalId" });
            return;
        }

        if (isPublish && (!confirmPayload.journalIndexId || confirmPayload.journalIndexRowId == null))
        {
            publish({ level: MessageStatus.Error, title: "執行失敗", text: "請先選擇期刊目次與卷期" });
            return;
        }

        const res = isPublish
            ? await executePublishAsync(
                publishAction.execute,
                props.internalId,
                confirmPayload.journalIndexId,
                confirmPayload.journalIndexRowId,
            )
            : await unpublishAction.execute(props.internalId);

        (res.SysMessage ?? []).forEach(item =>
        {
            publish({ level: item.Status, code: item.MessageCode, title: item.Message });
        });

        if (!res.IsSuccess) return;

        props.onConfirm?.(confirmPayload);
        props.onClose();
    }, [
        props.internalId,
        props.onConfirm,
        props.onClose,
        isPublish,
        confirmPayload,
        publish,
        publishAction.execute,
        unpublishAction.execute,
    ]);

    if (!props.open) return null;

    return (
        <>
            <div
                className="modal fade show"
                style={{ display: "block", backgroundColor: "rgba(0,0,0,.35)" }}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby="spec-journal-dialog-title"
            >
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <DialogHeader title={title} onClose={handleClose} />
                        <div className="modal-body">
                            {isPublish
                                ? (
                                    <PublishDialogBodyComp
                                        theme={props.theme}
                                        indexOptions={props.indexOptions}
                                        rowOptions={rowOptions}
                                        journalIndexId={journalIndexId}
                                        journalIndexRowId={journalIndexRowId}
                                        onIndexChange={handleIndexChange}
                                        onRowChange={handleRowChange}
                                    />
                                )
                                : <RevertDialogBodyComp />}
                        </div>

                        <DialogFooter
                            confirmText={isSubmitting ? "執行中..." : confirmText}
                            disabled={!canConfirm}
                            onClose={handleClose}
                            onConfirm={() => void handleConfirm()}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

/** 執行發布期刊 API */
const executePublishAsync = async (
    execute: (dto: PublishJournalReq) => Promise<ApiResponse<object>>,
    internalId: string,
    journalIndexId: string | null,
    journalIndexRowId: number | null,
): Promise<ApiResponse<object>> =>
{
    const req: PublishJournalReq = {
        InternalId: internalId,
        JournalIndexId: journalIndexId,
        JournalIndexRowId: journalIndexRowId,
    };
    return await execute(req);
};

/** Dialog 標題 */
const useDialogTitle = (actionType: SpecJournalDialogActionType): string =>
{
    return useMemo(() =>
    {
        return actionType === "publish" ? "發布期刊" : "退回預刊";
    }, [actionType]);
};

/** Dialog 確認按鈕文字 */
const useDialogConfirmText = (actionType: SpecJournalDialogActionType): string =>
{
    return useMemo(() =>
    {
        return actionType === "publish" ? "確定出刊" : "確定退回";
    }, [actionType]);
};

/** 依期刊目次取得卷期 options */
const useRowOptions = (
    indexRowOptionsByIndexId: Record<string, Record<string, string>>,
    journalIndexId: string,
): Record<string, string> =>
{
    return useMemo(() =>
    {
        return indexRowOptionsByIndexId[journalIndexId] ?? {};
    }, [indexRowOptionsByIndexId, journalIndexId]);
};

/** Dialog 開啟時同步預設值 */
const useSyncDialogState = (
    open: boolean,
    initialIndexId: string | null | undefined,
    initialIndexRowId: number | null,
    setJournalIndexId: (value: string) => void,
    setJournalIndexRowId: (value: number | null) => void,
): void =>
{
    useEffect(() =>
    {
        if (!open) return;
        setJournalIndexId(String(initialIndexId ?? ""));
        setJournalIndexRowId(initialIndexRowId);
    }, [open, initialIndexId, initialIndexRowId, setJournalIndexId, setJournalIndexRowId]);
};

/** Header */
const DialogHeader = (props: { title: string; onClose: () => void; }) =>
{
    return (
        <div className="modal-header">
            <h5 id="spec-journal-dialog-title" className="modal-title">
                {props.title}
            </h5>
            <button type="button" className="btn-close" aria-label="關閉視窗" onClick={props.onClose} />
        </div>
    );
};

/** Footer */
const DialogFooter = (
    props: {
        confirmText: string;
        disabled?: boolean;
        onClose: () => void;
        onConfirm: () => void;
    },
) =>
{
    return (
        <div className="modal-footer">
            <button
                type="button"
                className="btn btn-secondary"
                onClick={props.onClose}
                aria-label="取消返回"
                disabled={props.disabled}
            >
                取消返回
            </button>
            <button
                type="button"
                className="btn btn-primary"
                onClick={props.onConfirm}
                aria-label={props.confirmText}
                disabled={props.disabled}
            >
                {props.confirmText}
            </button>
        </div>
    );
};

/** 退回預刊 body */
const RevertDialogBodyComp = () =>
{
    return (
        <div className="py-2">
            <p className="mb-0">是否退回預刊？</p>
        </div>
    );
};

/** 發布期刊 body */
const PublishDialogBodyComp = (
    props: {
        theme: IBETheme;
        indexOptions: Record<string, string>;
        rowOptions: Record<string, string>;
        journalIndexId: string;
        journalIndexRowId: number | null;
        onIndexChange: (value: string) => void;
        onRowChange: (value: number | null) => void;
    },
) =>
{
    return (
        <div className="row">
            <div className="col-12 form-group">
                <label htmlFor="spec-journal-dialog-index" className="form-label fw-bold">
                    期刊目次
                </label>
                <select
                    id="spec-journal-dialog-index"
                    className="form-select"
                    value={props.journalIndexId}
                    onChange={(e) => props.onIndexChange(e.target.value)}
                    aria-label="選擇期刊目次"
                >
                    <option value="">請選擇</option>
                    {Object.entries(props.indexOptions).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="col-12 form-group mt-3">
                <label htmlFor="spec-journal-dialog-row" className="form-label fw-bold">
                    卷期
                </label>
                <select
                    id="spec-journal-dialog-row"
                    className="form-select"
                    value={props.journalIndexRowId == null ? "" : String(props.journalIndexRowId)}
                    onChange={(e) => props.onRowChange(toNullableNumber(e.target.value))}
                    aria-label="選擇卷期"
                >
                    <option value="">請選擇</option>
                    {Object.entries(props.rowOptions).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

/** 空字串轉 null */
const toNullable = (value: string): string | null =>
{
    return value.trim() ? value : null;
};

const toNullableNumber = (value: string): number | null =>
{
    const raw = value.trim();
    if (!raw) return null;
    const num = Number(raw);
    return Number.isNaN(num) ? null : num;
};
