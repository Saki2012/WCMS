using Microsoft.AspNetCore.Mvc;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore;

namespace WCMS.Features.SysSetting.FileManagement
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class FileManagementController(IBizService<FileManagementSet> service) : ApiDataController<FileManagementSet>(service)
    {
        /// <summary>
        /// 新增檔案
        /// </summary>
        /// <param name="set"></param>
        /// <returns></returns>
        [HttpPost(nameof(Create))]
        public new async Task<IActionResult> Create()
        {
            //return Ok(await _service.CreateSetAsync(set));
        }
        /// <summary>
        /// 
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

        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="label"></param>
        /// <param name="zipFile"></param>
        /// <returns></returns>
        [HttpPost(nameof(ImportInitialFiles))] public async Task<IActionResult> ImportInitialFiles(string label, object zipFile)
        {
            /**/
            FileManagementSet set = new FileManagementSet();
            set.FileManagement.ImportLabel = label;
        }
    }

}
