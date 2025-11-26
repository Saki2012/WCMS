import { useParams } from 'react-router-dom';
import { FormComp } from '@/Features/Pages/Server/Scaffold/Content/Form_Comp';
import type { FormCompProp } from '@/Features/Pages/Server/Scaffold/Content/Content_Data';
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibTextBox, LibSwitch, LibDropList, LibUserCard, type ILibSwitchItemProp } from "@/SysCore/Components/FormField/LibFormField"
import TabContentComp from '@/SysCore/Components/TabContent/TabContent';
import type { components } from "@/types/api";
import { useFetchFormData } from '@/SysCore/Utils/API/FetchFormData';
import UserProvider from '@/Features/Pages/Server/BizFunc/UserDTs/UserManage_Api';
import { useActions } from '@/Features/Hooks/Common/useActions';
import { useMemo } from 'react';
type AccountSet = components["schemas"]["AccountSet_DTO"]

const emptyData: AccountSet = {}

export const Server_ResetPassword_Comp = ({ theme }: { theme: IBETheme }) => {
    const { internalId } = useParams();
    const isLoading: boolean[] = []
    const errors: (string | null | undefined)[] = []
    const prop: FormCompProp = { Title: "修改密碼", Theme: theme, LoadingList: isLoading, ErrorList: errors, Actions: {} }
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
                                            <LibTextBox Style={theme.TextBox} ColumnDisplayName="帳號" DefaultInputDisplay="請輸入"></LibTextBox>
                                        </div>
                                    </div>
                                </div>
                                <div className="row mx-0">
                                    <div className="col form-group">
                                        <div className="row mx-0">
                                            <LibTextBox Style={theme.TextBox} ColumnDisplayName="舊密碼" DefaultInputDisplay="請輸入"></LibTextBox>
                                        </div>
                                    </div>
                                </div>
                                <div className="row mx-0">
                                    <div className="col form-group">
                                        <div className="row mx-0">
                                            <LibTextBox Style={theme.TextBox} ColumnDisplayName="新密碼" DefaultInputDisplay="請輸入"></LibTextBox>
                                        </div>
                                    </div>
                                </div>
                                <div className="row mx-0">
                                    <div className="col form-group">
                                        <div className="row mx-0">
                                            <LibTextBox Style={theme.TextBox} ColumnDisplayName="確認新密碼" DefaultInputDisplay="請輸入"></LibTextBox>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FormComp>
    )
}



