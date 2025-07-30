import  type { components } from "../../../../../../types/api";
type PageManagementSet = components["schemas"]["PageManagementSet"]

export const emptyData:PageManagementSet={
    PageManagement:{},
    PageManagementDetail:[]
}