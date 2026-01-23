import { useLocation, useParams } from 'react-router-dom';
import { FormComp } from '@/Features/Pages/Server/Scaffold/Content/Form_Comp';
import type { FormCompProp } from '@/Features/Pages/Server/Scaffold/Content/Content_Data';
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibCheckBox, LibTextBox, LibUserCard } from "@/SysCore/Components/FormField/LibFormField"
import type { components } from "@/types/api";
import { useFetchFormData, type UseFetchFormDataResult } from '@/SysCore/Utils/API/FetchFormData';
import { useActions } from '@/Features/Hooks/Common/useActions';
import { useCallback, useMemo } from 'react';
import pic from "@/Features/Assets/Server/images/avatar/avatar_M_480x480.jpg"
import { FileManagementAPI } from '@/SysCore/Utils/API/APIClient';
import PersonProvider from '@/Features/Hooks/BizFunc/AccountManage/Person/Person_Api';
import { useSetTableField } from '@/SysCore/Components/FormField/useSetTableField';
import { PersonModelFields, PersonSetFields } from '@/types/SchemaFields';
import { useFetchEnumOptions } from '@/SysCore/Utils/API/SystemAPI_Hook';
type PersonSet = components["schemas"]["PersonSet_DTO"]
const emptyData: PersonSet = {}

export const Server_Person_Form_Comp = (props: { theme: IBETheme }) => {
    const { internalId } = useParams();
    const dirUrl = useLocation().pathname.replace(/\/Form$/, `/Form`);
    const provider = useMemo(() => PersonProvider(), []);
    const formData = useFetchFormData<PersonSet>(provider, internalId, emptyData)
    const actions = useActions(dirUrl, provider, formData.data, internalId as string, undefined, undefined)
    const useGender = useFetchEnumOptions("Gender");
    const isLoading: boolean[] = [formData.isLoading, useGender.isLoading]
    const errors: (string | null | undefined)[] = [formData.error, useGender.error]
    const prop: FormCompProp = { Title: "管理者帳號資料修改", Theme: props.theme, LoadingList: isLoading, ErrorList: errors, Actions: actions }
    return (
        <FormComp prop={prop}>
            <Person_Comp theme={props.theme} formData={formData} genderOpt={useGender.data} />
        </FormComp>
    )
}

const Person_Comp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<PersonSet>; genderOpt: Record<string, string> }) => {
    const setField = useSetTableField<PersonSet>(props.formData);
    const userPic = props.formData.data?.Person?.PersonImgId ? `${FileManagementAPI.PREVIEW_URL}/${props.formData.data?.Person?.PersonImgId}` : pic
    const setPersonImgId = useCallback((id: string) => {
        props.formData.setFormData(prev => ({
            ...(prev as any),
            Person: { ...(prev as any)?.Person, PersonImgId: id },
        }));
    }, [props.formData]);
    return (
        <div className="row">
            <div className="col-xl-3 col-lg-4 col-md-4 col-sm-4 col-12">
                <LibUserCard DisplayNameEN={props.formData.data?.Person?.PersonId ?? ""}
                    DisplayNameTW={props.formData.data?.Person?.PersonName ?? ""}
                    DisplayRole={""} PicSrc={userPic} Style={props.theme.UserImageUploadCard} onUploadedTempId={setPersonImgId} />
            </div>
            <div className="col-xl-9 col-lg-8 col-md-8 col-sm-8 col-12 ms-auto">
                <div className="panel">
                    <div className="panel-body">
                        <div className="row mx-0">
                            <div className="col form-group">
                                <div className="row mx-0">
                                    <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(PersonSetFields.Person, PersonModelFields.PersonId, "string")} />
                                    <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(PersonSetFields.Person, PersonModelFields.PersonName, "string")} />
                                </div>
                            </div>
                        </div>
                        <div className="row mx-0">
                            <div className="col form-group">
                                <div className="row mx-0">
                                    <LibCheckBox Style={props.theme.RadioBox} options={props.genderOpt}{...setField(PersonSetFields.Person, PersonModelFields.Gender, "number")} />
                                </div>
                            </div>
                        </div>
                        <div className="row mx-0">
                            <div className="col form-group">
                                <div className="row mx-0">
                                    <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(PersonSetFields.Person, PersonModelFields.Email, "string")} />
                                </div>
                            </div>
                        </div>
                        <div className="row mx-0">
                            <div className="col form-group">
                                <div className="row mx-0">
                                    <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(PersonSetFields.Person, PersonModelFields.MobilePhone, "string")} />
                                    <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(PersonSetFields.Person, PersonModelFields.HomePhone, "string")} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

