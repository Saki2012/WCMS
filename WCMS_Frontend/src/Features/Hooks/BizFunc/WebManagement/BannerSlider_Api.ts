import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
type BannerSliderSet = components["schemas"]["BannerSet_DTO"];
class BannerSliderService extends ApiDataService<BannerSliderSet>
{
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Banner, apiInstance);
    }
}
export const BannerSliderAdapter = (apiInstance?: AxiosInstance) =>
    new ApiDataAdapter<BannerSliderSet, BannerSliderService>((api?: AxiosInstance) =>
        new BannerSliderService(api ?? apiInstance)
    );
