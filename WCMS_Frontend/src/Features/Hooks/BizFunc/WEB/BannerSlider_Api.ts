import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";

// #region Property
type BannerSliderSet = components["schemas"]["BannerSet_DTO"];
// #endregion

// #region Public
export class BannerSliderService extends ApiDataService<BannerSliderSet>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Banner, apiInstance);
    }
    // #endregion
}
export class BannerSliderAdapterImpl extends ApiDataAdapter<BannerSliderSet, BannerSliderService>
{}
export const BannerSliderAdapter = (apiInstance?: AxiosInstance) =>
    new BannerSliderAdapterImpl((api?: AxiosInstance) => new BannerSliderService(api ?? apiInstance));
// #endregion
