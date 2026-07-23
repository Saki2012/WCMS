import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";

// #region Property
type WebResourceFormModel = components["schemas"]["WebResource"];
// #endregion

// #region Public
export class WebResourceService extends ApiDataService<WebResourceFormModel>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.WebResource, apiInstance);
    }
    // #endregion
}
export class WebResourceAdapterImpl extends ApiDataAdapter<WebResourceFormModel, WebResourceService>
{}
export const WebResourceAdapter = (apiInstance?: AxiosInstance) =>
    new WebResourceAdapterImpl((api?: AxiosInstance) => new WebResourceService(api ?? apiInstance));
// #endregion
