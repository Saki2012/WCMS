import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";

// #region Property
type BannerFormModel = components["schemas"]["Banner"];
// #endregion

// #region Public
export class BannerSliderService extends ApiDataService<BannerFormModel>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Banner, apiInstance);
    }
    // #endregion
}
export class BannerSliderAdapterImpl extends ApiDataAdapter<BannerFormModel, BannerSliderService>
{}
export const BannerSliderAdapter = (apiInstance?: AxiosInstance) =>
    new BannerSliderAdapterImpl((api?: AxiosInstance) => new BannerSliderService(api ?? apiInstance));
// #endregion
