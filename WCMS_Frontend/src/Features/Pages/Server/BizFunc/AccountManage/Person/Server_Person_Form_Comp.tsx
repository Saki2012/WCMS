import { useCallback } from "react";

import type { components } from "@/types/api";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";

import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { LibCheckBox, LibTextBox, LibUserCard } from "@/SysCore/Components/FormField/LibFormField";

import pic from "@/Features/Assets/Server/images/avatar/avatar_M_480x480.jpg";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { PersonModelFields, PersonSetFields } from "@/types/SchemaFields";

import { useServerPersonForm } from "./Server_Person_Form_Hook";

type PersonSet = components["schemas"]["PersonSet_DTO"];

export const Server_Person_Form_Comp = (props: { theme: IBETheme }) => {
    // 宣告變數
    const vm = useServerPersonForm(props.theme);

    // return（DOM 不動）
    return (
        <FormComp prop={vm.prop}>
            <Person_Comp
                theme={props.theme}
                formData={vm.formData}
                genderOpt={vm.genderOpt}
            />
        </FormComp>
    );
};

const updatePersonImgId = (prev: PersonSet, id: string): PersonSet => {
    // 宣告變數
    const cur = prev ?? {};
    const nextPerson = {
        ...(cur.Person ?? {}),
        PersonImgId: id,
    };

    // return
    return {
        ...cur,
        Person: nextPerson,
    };
};

const Person_Comp = (props: {theme: IBETheme; formData: UseFetchFormDataResult<PersonSet>; genderOpt: Record<string, string>;}) => {
    const setField = useSetTableField<PersonSet>(props.formData);
    const userPic = FileManagementAPI.get_Server_Preview_Url(props.formData.data?.Person?.PersonImgId) ?? pic;
    const setPersonImgId = useCallback((id: string) => { props.formData.setFormData((prev) => updatePersonImgId(prev, id)); }, [props.formData]);
    return (
        <div className="row">
            <div className="col-xl-3 col-lg-4 col-md-4 col-sm-4 col-12">
                <LibUserCard
                    DisplayNameEN={props.formData.data?.Person?.PersonId ?? ""}
                    DisplayNameTW={props.formData.data?.Person?.PersonName ?? ""}
                    DisplayRole={""}
                    PicSrc={userPic}
                    Style={props.theme.UserImageUploadCard}
                    onUploadedTempId={setPersonImgId}
                />
            </div>

            <div className="col-xl-9 col-lg-8 col-md-8 col-sm-8 col-12 ms-auto">
                <div className="panel">
                    <div className="panel-body">
                        <div className="row mx-0">
                            <div className="col form-group">
                                <div className="row mx-0">
                                    <LibTextBox
                                        Style={props.theme.TextBox3}
                                        DefaultInputDisplay="請輸入"
                                        {...setField(PersonSetFields.Person, PersonModelFields.PersonId, "string")}
                                    />
                                    <LibTextBox
                                        Style={props.theme.TextBox3}
                                        DefaultInputDisplay="請輸入"
                                        {...setField(PersonSetFields.Person, PersonModelFields.PersonName, "string")}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="row mx-0">
                            <div className="col form-group">
                                <div className="row mx-0">
                                    <LibCheckBox
                                        Style={props.theme.RadioBox}
                                        options={props.genderOpt}
                                        {...setField(PersonSetFields.Person, PersonModelFields.Gender, "number")}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="row mx-0">
                            <div className="col form-group">
                                <div className="row mx-0">
                                    <LibTextBox
                                        Style={props.theme.TextBox}
                                        DefaultInputDisplay="請輸入"
                                        {...setField(PersonSetFields.Person, PersonModelFields.Email, "string")}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="row mx-0">
                            <div className="col form-group">
                                <div className="row mx-0">
                                    <LibTextBox
                                        Style={props.theme.TextBox3}
                                        DefaultInputDisplay="請輸入"
                                        {...setField(PersonSetFields.Person, PersonModelFields.MobilePhone, "string")}
                                    />
                                    <LibTextBox
                                        Style={props.theme.TextBox3}
                                        DefaultInputDisplay="請輸入"
                                        {...setField(PersonSetFields.Person, PersonModelFields.HomePhone, "string")}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};