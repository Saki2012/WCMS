/** 資料注入方式，決定真資料或是假資料
 * 
 * @param real API打的資料
 * @param mock 自製假資料
 * @returns 
 */
export const IApiProvider = <T>(real: new () => T,mock: new () => T): T => {
  console.log('VITE_USE_MOCK', import.meta.env.VITE_USE_MOCK)/**再繼續測試看看是否重複呼叫 */
  return import.meta.env.VITE_USE_MOCK === 'true' ? new mock() : new real();
};

/** 獲取資料抽象類 */
export abstract class IDataProvider<T> {
  //#region Public
  public async createData(param?: any): Promise<T> {
    const raw = await this.doCreateData(param);
    return raw;
  }
  public async updateData(param?: any):Promise<T>{
    const raw = await this.doUpdateData(param);
    return raw;
  }
  public async deleteData(param?: any):Promise<T>{
    const raw = await this.doDelete(param);
    return raw;
  }
  public async invalidData(param?: any):Promise<T>{
    const raw = await this.doInvalid(param);
    return raw;
  }
  public async fetchData(param?: any): Promise<T>{
    const raw = await this.doFetchData(param);
    return raw;
  }
  public async fetchList(param?: any): Promise<T[]>{
    const raw = await this.doFetchList(param);
    return raw;
  }
  public async getModelDisplayName(): Promise<T[]>{
    return await this.doGetModelDisplayName();
  }
  //#endregion

  //#region Protected
  protected abstract doCreateData(param?: any): Promise<T>;
  protected abstract doUpdateData(param?: any): Promise<T>;
  protected abstract doDelete(param?: any): Promise<T>;
  protected abstract doInvalid(param?: any): Promise<T>;
  protected abstract doFetchData(param?: any): Promise<T>;
  protected abstract doFetchList(param?: any): Promise<T[]>;
  protected abstract doGetModelDisplayName(): Promise<T[]>;
  //#endregion
}