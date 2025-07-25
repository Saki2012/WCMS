import { number } from "zod";

/** 資料注入方式，決定真資料或是假資料
 * 
 * @param real API打的資料
 * @param mock 自製假資料
 * @returns 
 */
export const IApiProvider = <T>(real: new () => T,mock: new () => T): T => {
  return import.meta.env.VITE_USE_MOCK === 'true' ? new mock() : new real();
};

/** 獲取資料抽象類 */
export abstract class IDataProvider<T> {
  //#region Public
  public async createData(set?: T): Promise<ApiResponse<T>> {
    return await this.doCreateData(set);
  }
  public async updateData(internaId:string, set:T):Promise<ApiResponse<T>>{
    return await this.doUpdateData(internaId,set);
  }
  public async deleteData(internaId:string):Promise<ApiResponse<T>>{
    return await this.doDelete(internaId);
  }
  public async invalidData(internaId:string,isInvalid:boolean):Promise<ApiResponse<T>>{
    return await this.doInvalid(internaId,isInvalid);
  }
  public async fetchData(param?: any): Promise<ApiResponse<T>>{
    return await this.doFetchData(param);
  }
  public async fetchList(condition?: QueryListCondition): Promise<ApiResponse<T>>{
    return await this.doFetchList(condition);
  }

  public async fetchListCount(condition?: QueryListCondition): Promise<ApiResponse<number>>{
    return await this.doFetchListCount(condition);
  }

  public async getModelDisplayName(): Promise<T[]>{
    return await this.doGetModelDisplayName();
  }
  //#endregion

  //#region Protected
  protected abstract doCreateData(set?: T): Promise<ApiResponse<T>>;
  protected abstract doUpdateData(internaId:string,set:T): Promise<ApiResponse<T>>;
  protected abstract doDelete(internaId:string): Promise<ApiResponse<T>>;
  protected abstract doInvalid(internaId:string,isInvalid:boolean): Promise<ApiResponse<T>>;
  protected abstract doFetchData(internaId?: string): Promise<ApiResponse<T>>;
  protected abstract doFetchList(condition?: QueryListCondition): Promise<ApiResponse<T>>;
  protected abstract doFetchListCount(condition?: QueryListCondition): Promise<ApiResponse<number>>;
  protected abstract doGetModelDisplayName(): Promise<T[]>;
  //#endregion
}


/** 後端提供訊息包 */
export interface SysMessageModel {
  Status: number;
  MessageCode: string;
  Message: string;
}
/** API回傳資訊包 */
export interface ApiResponse<T> {
  IsSuccess: boolean;
  SysMessage: SysMessageModel[];
  Data: T[] | null;
}
/** API查詢條件 */
export interface QueryListCondition {
  Fields:string[];
  Condition: string;
  PageNumber: number;
  PageSize:number;
}