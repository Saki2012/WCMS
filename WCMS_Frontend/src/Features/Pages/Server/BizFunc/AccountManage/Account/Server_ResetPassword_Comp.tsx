import { FormComp } from '@/Features/Pages/Server/Scaffold/Content/Form_Comp';
import type { FormCompProp } from '@/Features/Pages/Server/Scaffold/Content/Content_Data';
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibDropList } from "@/SysCore/Components/FormField/LibFormField";
import { useCallback, useMemo, useState } from 'react';
import { useMatches } from 'react-router';
import type { IActionHandle } from '@/Features/Pages/Server/Scaffold/Routes/ServerModuleRoutesData';
import LibPwdTextBox from '@/SysCore/Components/FormField/FieldComponets/LibPwdTextBox_Comp';
import { useToast } from '@/Features/Hooks/Common/useToastCenter';
import { IDataProvider, MessageStatus } from '@/SysCore/Interface/IApiProvider';
import type { UseActionsResult } from '@/Features/Hooks/Common/useActions';
import { useLocation, useNavigate } from 'react-router-dom';
import AccountProvider from '@/Features/Hooks/BizFunc/AccountManage/Account/Account_Api';
import type { components } from "@/types/api";
import { useFetchGridListData } from '@/SysCore/Utils/API/FetchGridListData';
import { AccountFields } from '@/types/SchemaFields';

type AccountSet = components["schemas"]["AccountSet_DTO"]
type ResetPassword = components["schemas"]["ResetPassword"];

/** 重置密碼 */
export const Server_ResetPassword_Comp = (props: { theme: IBETheme }) => {
    // 宣告變數
    const { publish } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const isLoading: boolean[] = [];
    const errors: (string | null | undefined)[] = [];
    const handle = useMatches().at(-1)?.handle as IActionHandle | undefined;
    const provider = useMemo(() => AccountProvider(), []);
    const [userInternalId, setUserInternalId] = useState<string>("");
    const [newPwd, setNewPwd] = useState<string>("");
    const [confirmPwd, setConfirmPwd] = useState<string>("");
    const [isExecuting, setIsExecuting] = useState(false);
    const useAccountList = useAccountListData(provider);

    const accountDict: Record<string, string> = useMemo(() => {
        const dict: Record<string, string> = {};
        for (const item of useAccountList.rawData ?? []) {
            const id = String(item?.Account?.InternalId ?? "").trim();
            if (!id) continue;
            dict[id] = `${item?.Account?.AccountId}, ${item?.Account?.AccountName}`;
        }
        return dict;
    }, [useAccountList.rawData]);

    const validateBeforeSave = useCallback((): boolean => {
        if (!userInternalId) {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: "請選擇帳號" });
            return false;
        }
        if (newPwd !== confirmPwd) {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: "兩次新密碼不一致" });
            return false;
        }
        return true;
    }, [newPwd, confirmPwd, publish]);

    const handleCancelBack = useCallback(() => {
        // 回到同模組 List（沿用你專案既有規則）
        navigate(location.pathname.replace(/\/ResetPassword(\/[^\/]*)?$/, "/List"));
    }, [navigate, location.pathname]);

    const handleSave = useCallback(async (): Promise<boolean> => {
        // 打 API：AccountProvider.ChangePassword({ OldPassword, NewPassword })
        const ok = validateBeforeSave();
        if (!ok) return false;
        try {
            setIsExecuting(true);
            const payload: ResetPassword = {
                UserInternalId: userInternalId,
                NewPassword: newPwd,
            };
            const res = await provider.ResetPassword(payload);
            if (res.IsSuccess) {
                (res.SysMessage ?? []).forEach(item => { publish({ level: item.Status, code: item.MessageCode, title: item.Message }); });
                handleCancelBack();
                publish({ level: MessageStatus.Green, title: "重置成功", text: "", });
                return true;
            }
            (res.SysMessage ?? []).forEach(item => { publish({ level: item.Status, code: item.MessageCode, title: "保存失敗", text: item.Message }); });
            return false;
        } catch (err: any) {
            const data = err?.response?.data;
            publish({ level: MessageStatus.Error, title: "保存失敗", text: typeof data === "string" ? data : JSON.stringify(data ?? err, null, 2), });
            return false;
        } finally {
            setIsExecuting(false);
        }
    }, [validateBeforeSave, provider, userInternalId, newPwd, publish, handleCancelBack]);

    const actions: UseActionsResult = useMemo(() => {
        // 提供給 Form_Toolbar 使用（其餘方法這頁用不到，先放 no-op）
        return { isExecuting, onSave: handleSave, onCancelBack: handleCancelBack, onAddNew: () => { }, onEdit: () => { }, onDelete: async () => { }, onInvalid: () => { }, onPreview: () => { }, };
    }, [isExecuting, handleSave, handleCancelBack]);

    const prop: FormCompProp = { Title: handle?.Title ?? "重置密碼", Theme: props.theme, LoadingList: [...isLoading, isExecuting], ErrorList: errors, Actions: actions, };

    // return xxx
    return (
        <FormComp prop={prop}>
            <div className="row">
                <div className="col-sm-12">
                    <div className="panel">
                        <div className="panel-body">
                            <div className="form">
                                <div className="row mx-0">
                                    <div className="col form-group">
                                        <div className="row mx-0">
                                            <LibDropList Style={props.theme.DropList2} ColumnDisplayName="帳號" AutoDefaultFirst={false} Options={accountDict} InputValue={userInternalId} onChange={(v) => setUserInternalId(v)} />
                                        </div>
                                    </div>
                                </div>

                                <div className="row mx-0">
                                    <div className="col form-group">
                                        <div className="row mx-0">
                                            <LibPwdTextBox Style={props.theme.TextBox3} ColumnDisplayName="新密碼" DefaultInputDisplay="請輸入" InputValue={newPwd} OnChange={(v) => setNewPwd(v)} />
                                        </div>
                                    </div>
                                </div>

                                <div className="row mx-0">
                                    <div className="col form-group">
                                        <div className="row mx-0">
                                            <LibPwdTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" ColumnDisplayName="再次輸入密碼" InputValue={confirmPwd} OnChange={(v) => setConfirmPwd(v)} />
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FormComp>
    );
};


const useAccountListData = (provider: IDataProvider<AccountSet>) => {
    var condition: string = ``;
    return useFetchGridListData<AccountSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition: () => ({
            Fields: [AccountFields.InternalId, AccountFields.AccountId, AccountFields.AccountName,],
            Condition: condition, OrderBy: [{ Col: AccountFields.AccountId, Desc: false },],
            PageNumber: 0, PageSize: 0,
        }),
        enabled: true,
        deps: [],
    });
};