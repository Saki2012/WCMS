import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
type PageManagementSet = components["schemas"]["PageManagementSet_DTO"];
class PageManagementService extends ApiDataService<PageManagementSet>
{
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.PageManagement, apiInstance);
    }
}
export const PageManagementAdapter = (apiInstance?: AxiosInstance) =>
    new ApiDataAdapter<PageManagementSet, PageManagementService>(
        (api?: AxiosInstance) => new PageManagementService(api ?? apiInstance),
    );
