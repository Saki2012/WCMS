import type { BreadCrumbData } from '../../../../../../SysCore/Components/BreadCrumb/BreadCrumb_Data';
import { IApiProvider, IDataProvider } from '../../../../../../SysCore/Interface/IApiProvider'
import { Link } from 'react-router-dom';
import type { ApiResponse } from '../../../../../../SysCore/Interface/IApiProvider';
import type { ModelDisplaySchema } from '../../../../../../types/IApiSchema';
import type { components } from '../../../../../../types/api';
type QueryListParam = components["schemas"]["QueryListParam"];

abstract class IBreadCrumbProvider extends IDataProvider<BreadCrumbData> {
}

/** 假資料-路徑導覽 */
class MockProvider extends IBreadCrumbProvider {
  protected doCreateData(set?: BreadCrumbData | undefined): Promise<ApiResponse<BreadCrumbData>> {
    throw new Error('Method not implemented.');
  }
  protected doUpdateData(internaId: string, set: BreadCrumbData): Promise<ApiResponse<BreadCrumbData>> {
    throw new Error('Method not implemented.');
  }
  protected doDelete(internaId: string): Promise<ApiResponse<BreadCrumbData>> {
    throw new Error('Method not implemented.');
  }
  protected doInvalid(internaId: string, isInvalid: boolean): Promise<ApiResponse<BreadCrumbData>> {
    throw new Error('Method not implemented.');
  }
  protected doFetchData(internaId?: string): Promise<ApiResponse<BreadCrumbData>> {
    throw new Error('Method not implemented.');
  }
  protected doFetchList(condition?: QueryListParam): Promise<ApiResponse<BreadCrumbData[]>> {
    throw new Error('Method not implemented.');
  }
  protected doFetchListCount(condition?: QueryListParam): Promise<ApiResponse<number>> {
    throw new Error('Method not implemented.');
  }
  protected doGetModelDisplayName(): Promise<ModelDisplaySchema> {
    throw new Error('Method not implemented.');
  }

}

/** api資料-路徑導覽 */
class APIProvider extends IBreadCrumbProvider {
  protected doCreateData(set?: BreadCrumbData | undefined): Promise<ApiResponse<BreadCrumbData>> {
    throw new Error('Method not implemented.');
  }
  protected doUpdateData(internaId: string, set: BreadCrumbData): Promise<ApiResponse<BreadCrumbData>> {
    throw new Error('Method not implemented.');
  }
  protected doDelete(internaId: string): Promise<ApiResponse<BreadCrumbData>> {
    throw new Error('Method not implemented.');
  }
  protected doInvalid(internaId: string, isInvalid: boolean): Promise<ApiResponse<BreadCrumbData>> {
    throw new Error('Method not implemented.');
  }
  protected doFetchData(internaId?: string): Promise<ApiResponse<BreadCrumbData>> {
    throw new Error('Method not implemented.');
  }
  protected doFetchList(condition?: QueryListParam): Promise<ApiResponse<BreadCrumbData[]>> {
    const data: BreadCrumbData[] = [
    ]
    return Promise.resolve({ IsSuccess: true, SysMessage: [], Data: data, });
  }
  protected doFetchListCount(condition?: QueryListParam): Promise<ApiResponse<number>> {
    throw new Error('Method not implemented.');
  }
  protected doGetModelDisplayName(): Promise<ModelDisplaySchema> {
    throw new Error('Method not implemented.');
  }

}

const getBreadCrumbProvider = (): IBreadCrumbProvider => IApiProvider<IBreadCrumbProvider>(APIProvider, MockProvider);
export default getBreadCrumbProvider
