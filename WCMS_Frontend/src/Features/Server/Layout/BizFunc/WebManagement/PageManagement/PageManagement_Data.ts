import  type { components } from "../../../../../../types/api";
type PageManagementSet = components["schemas"]["PageManagementSet"]

export const emptyData:PageManagementSet={
    PageManagement:{
        CreateTime: null,
        CreateUserId: "",
        ModifyTime: null,
        ModifyUserId: "",
        FormStatus: 0,
        DataStatus: 0,
        InvalidTime: null,
        InvalidUserId: "",
        InternalId: "",
        OrgLvId: "",
        PageId: "",
        CategoryId: "",
        ViewCount: 0
    },
    PageManagementDetail:[]
}