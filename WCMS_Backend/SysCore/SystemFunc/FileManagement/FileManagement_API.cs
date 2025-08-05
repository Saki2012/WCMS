using Microsoft.AspNetCore.Mvc;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore;

namespace WCMS.SysCore.SystemFunc.FileManagement
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class FileManagementController(IBizService<FileManagementSet> service) : ApiDataController<FileManagementSet>(service)
    {

        /*
            幾個待做的重要流程:
            1. 產生一個比對格式的資料:UID<->FullPath，避免db出狀況或是要直接機器查找時可以用
            2. 副檔名白名單與MIME type檢查
            3. 資料夾結構規劃
            4. 同步資料
            5. 上傳檔案流程:先存至後端暫存區，確定後再移動至正式資料夾
         */


        [HttpPost(nameof(UploadTemp))]
        public async Task<IActionResult> UploadTemp(IFormFile file)
        {
            await ((FileManagementBiz)_service).UploadTemp(file);
            return Ok();
        }

        [HttpPost(nameof(MoveToPermanent))]
        public async Task<IActionResult> MoveToPermanent(string[] internalIds)
        {
            await ((FileManagementBiz)_service).MoveToPermanent(internalIds);
            return Ok();
        }

        [HttpPost(nameof(CancelUploadFiles))]
        public async Task<IActionResult> CancelUploadFiles(string[] internalIds)
        {
            await ((FileManagementBiz)_service).CancelUploadFiles(internalIds);
            return Ok();
        }

        /// <summary>
        /// 下載檔案
        /// </summary>
        /// <param name="internalId"></param>
        /// <returns></returns>
        [HttpGet($"{nameof(Download)}/internalId")] public async Task<IActionResult> Download(string internalId)
        {
            //var info = await _fileService.GetFileInfoAsync(internalId);
            //if (info == null || info.IsDeleted) return NotFound();

            //var path = Path.Combine(_uploadRoot, info.Path);
            //if (!System.IO.File.Exists(path)) return NotFound();

            //var stream = new FileStream(path, FileMode.Open, FileAccess.Read);
            //return File(stream, info.MimeType, info.FileName);
            return Ok();

        }
        /// <summary>
        /// 匯入初始檔案資料
        /// </summary>
        /// <param name="label"></param>
        /// <param name="zipFile"></param>
        /// <returns></returns>
        [DisableRequestSizeLimit]
        [RequestSizeLimit(1024L * 1024 * 1024)] // 1GB
        [HttpPost(nameof(ImportInitialFiles))] public async Task<IActionResult> ImportInitialFiles(string label)
        {
            await ((FileManagementBiz)_service).ImportZip(label);
            return Ok();
        }
    }

}
