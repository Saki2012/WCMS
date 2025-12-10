import { PGID } from "@/Features/Hooks/Common/ProgId";
import { IApiProvider, IDataProvider } from "@/SysCore/Interface/IApiProvider";
import type { ApiResponse } from "@/SysCore/Interface/IApiProvider";
import api from "@/SysCore/Utils/API/APIBase";
import { BaseApiService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";

type CalendarSet = components["schemas"]["CalendarSet_DTO"];
type CurrentOpenTime = components["schemas"]["SpecCurrentOpenTime_DTO"];

type QueryListParam = components["schemas"]["QueryListParam"];

abstract class ICalendarProvider extends IDataProvider<CalendarSet>
{
    public async fetchCurrentOpenTime(): Promise<ApiResponse<CurrentOpenTime[]>>
    {
        return await this.doFetchCurrentOpenTime();
    }
    protected abstract doFetchCurrentOpenTime(): Promise<ApiResponse<CurrentOpenTime[]>>;
}
class MockProvider extends ICalendarProvider
{
    protected doFetchListCount(condition?: QueryListParam): Promise<ApiResponse<number>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doCreateData(set: CalendarSet): Promise<ApiResponse<CalendarSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doUpdateData(
        internaId: string,
        set: CalendarSet,
    ): Promise<ApiResponse<CalendarSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doDelete(internaId: string): Promise<ApiResponse<CalendarSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doInvalid(internaId: string, isInvalid: boolean): Promise<ApiResponse<CalendarSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doFetchData(internaId?: string): Promise<ApiResponse<CalendarSet>>
    {
        throw new Error("Method not implemented.");
    }
    protected async doFetchList(condition: QueryListParam): Promise<ApiResponse<CalendarSet[]>>
    {
        throw new Error("Method not implemented.");
    }
    protected doGetModelDisplayName(): Promise<ModelDisplaySchema>
    {
        throw new Error("Method not implemented.");
    }
}
class APIProvider extends ICalendarProvider
{
    private readonly ModuleName = PGID.Calendar;
    private readonly API = new BaseApiService<CalendarSet>(this.ModuleName);

    protected async doCreateData(set: CalendarSet): Promise<ApiResponse<CalendarSet>>
    {
        const res = await this.API.create(set);
        return res.data;
    }
    protected async doUpdateData(
        internaId: string,
        set: CalendarSet,
    ): Promise<ApiResponse<CalendarSet>>
    {
        const res = await this.API.update(internaId, set);
        return res.data;
    }
    protected async doDelete(internaId: string): Promise<ApiResponse<CalendarSet>>
    {
        const res = await this.API.delete(internaId);
        return res.data;
    }
    protected async doInvalid(internaId: string, isInvalid: boolean): Promise<ApiResponse<CalendarSet>>
    {
        const res = await this.API.invalid(internaId, isInvalid);
        return res.data;
    }
    protected async doFetchData(internaId: string): Promise<ApiResponse<CalendarSet>>
    {
        const res = await this.API.queryData(internaId);
        return res.data;
    }
    protected async doFetchList(condition: QueryListParam): Promise<ApiResponse<CalendarSet[]>>
    {
        const res = await this.API.queryList(condition);
        return res.data;
    }
    protected async doFetchListCount(condition: QueryListParam): Promise<ApiResponse<number>>
    {
        const res = await this.API.queryCount(condition);
        return res.data;
    }
    protected async doGetModelDisplayName(): Promise<ModelDisplaySchema>
    {
        const res = await this.API.getModelDisplayName();
        return res;
    }

    protected async doFetchCurrentOpenTime(): Promise<ApiResponse<CurrentOpenTime[]>>
    {
        const res = await api.get<ApiResponse<CurrentOpenTime[]>>(`${this.ModuleName}/Spec_GetCurrentOpenTime`);
        return res.data;
    }
}
const CalendarProvider = (): ICalendarProvider => IApiProvider<ICalendarProvider>(APIProvider, MockProvider);
export default CalendarProvider;
