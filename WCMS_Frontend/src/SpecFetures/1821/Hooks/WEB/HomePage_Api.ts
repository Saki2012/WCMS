import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import type { SpecHomePage1821Set } from "./HomePage_Types";

// #region Property
const SPEC_HOME_PAGE_1821_API = PGID.SpecHomePage1821Api;
// #endregion

// #region Public
export class SpecHomePage1821Service extends ApiDataService<SpecHomePage1821Set>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(SPEC_HOME_PAGE_1821_API, apiInstance);
    }
    // #endregion
}

export class SpecHomePage1821AdapterImpl extends ApiDataAdapter<
    SpecHomePage1821Set,
    SpecHomePage1821Service
>
{}

export const SpecHomePage1821Adapter = (apiInstance?: AxiosInstance) =>
{
    return new SpecHomePage1821AdapterImpl(
        (api?: AxiosInstance) => new SpecHomePage1821Service(api ?? apiInstance),
    );
};
// #endregion
