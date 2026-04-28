import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];
class WebResourceService extends ApiDataService<WebResourceSet>
{
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.WebResource, apiInstance);
    }
}
export const WebResourceAdapter = (apiInstance?: AxiosInstance) =>
    new ApiDataAdapter<WebResourceSet, WebResourceService>((api?: AxiosInstance) => new WebResourceService(api ?? apiInstance));
