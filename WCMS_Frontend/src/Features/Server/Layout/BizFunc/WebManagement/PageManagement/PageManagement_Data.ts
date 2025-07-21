import  type { components } from "../../../../../../types/api";
type PageManagementSet = components["schemas"]["PageManagementSet"]

export const emptyData:PageManagementSet={
    PageManagement:{
        CreateTime: null,
        CreateUserId: "string",
        ModifyTime: null,
        ModifyUserId: "string",
        FormStatus: 0,
        DataStatus: 0,
        InvalidTime: null,
        InvalidUserId: "",
        InternalId: "",
        OrgLvId: "",
        PageId: "ggc",
        CategoryId: "string",
        ViewCount: 0
    },
    PageManagementDetail:[{
        RowState: 0,
        PageId: "ggc",
        RowId: 1,
        Lang: "zh-TW",
        Title: "",
        Content: "string"
    }]
}