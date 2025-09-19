using Azure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.IO.Compression;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore.SystemFunc.FileManagement
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class FileManagementController(IWebHostEnvironment env) : ApiDataController<FileManageSet,FileManageSet_DTO>
    {

        /*
            幾個待做的重要流程:
            1. 產生一個比對格式的資料:UID<->FullPath，避免db出狀況或是要直接機器查找時可以用
            4. 同步資料
         */
        private readonly IWebHostEnvironment Env = env;
        [HttpPost(nameof(UploadTemp))]
        [RequestSizeLimit(200L * 1024 * 1024)] // 200 MB
        public async Task<IActionResult> UploadTemp(IFormFile file)
        {
            var internalId = await ((FileManagementBiz)Service).UploadTemp(file);
            var response = new ApiResponse<string>() { Data = [internalId] };

            OperateLogModel followInfo = new OperateLogModel();
            followInfo.APIName = $"{Service.ProgId}/{nameof(UploadTemp)}";
            followInfo.UserId = "SysOperator";
            followInfo.followingDT = JsonConvert.SerializeObject(response);
            followInfo.IP = Request.Headers["HTTP_CLIENT_IP"].ToString();
            OperateLog.AddMoveFollow(followInfo);

            return Ok(response);
        }

        [HttpPost(nameof(MoveToPermanent))]
        public async Task<IActionResult> MoveToPermanent(string[] internalIds)
        {
            await ((FileManagementBiz)Service).MoveToPermanent(internalIds);
            var response = new ApiResponse<string>() { Data = internalIds };

            OperateLogModel followInfo = new OperateLogModel();
            followInfo.APIName = $"{Service.ProgId}/{nameof(MoveToPermanent)}";
            followInfo.UserId = "SysOperator";
            followInfo.followingDT = JsonConvert.SerializeObject(response);
            followInfo.IP = Request.Headers["HTTP_CLIENT_IP"].ToString();
            OperateLog.AddMoveFollow(followInfo);

            return Ok(response);
        }

        [HttpPost(nameof(CancelUploadFiles))]
        public async Task<IActionResult> CancelUploadFiles(string[] internalIds)
        {
            await ((FileManagementBiz)Service).CancelUploadFiles(internalIds);
            var response = new ApiResponse<string>() { Data = internalIds };

            OperateLogModel followInfo = new OperateLogModel();
            followInfo.APIName = $"{Service.ProgId}/{nameof(CancelUploadFiles)}";
            followInfo.UserId = "SysOperator";
            followInfo.followingDT = JsonConvert.SerializeObject(response);
            followInfo.IP = Request.Headers["HTTP_CLIENT_IP"].ToString();
            OperateLog.AddMoveFollow(followInfo);

            return Ok(response);
        }

        /// <summary>
        /// 下載檔案
        /// </summary>
        /// <param name="internalId"></param>
        /// <returns></returns>
        [HttpGet($"{nameof(Download)}/{{internalId}}")] public async Task<IActionResult> Download(string internalId, CancellationToken ct)
        {
            var result = await ((FileManagementBiz)Service).GetDownloadFileInfo([internalId]);

            OperateLogModel followInfo = new OperateLogModel();
            followInfo.APIName = $"{Service.ProgId}/{nameof(Download)}";
            followInfo.UserId = "SysOperator";
            followInfo.followingDT = JsonConvert.SerializeObject(result);
            followInfo.IP = Request.Headers["HTTP_CLIENT_IP"].ToString();
            OperateLog.AddMoveFollow(followInfo);
            if (result.Count == 0) return NotFound();
            else if (result.Count == 1) 
            {
                string path = Path.Combine(Env.ContentRootPath,result[0].Path,$"{result[0].InternalId}.{result[0].FileExtension}");
                //if (result[0].FileExtension.Equals(FileExtensions.PDF)) return PhysicalFile(path, result[0].MimeType);
                //else 
                return PhysicalFile(path, result[0].MimeType, fileDownloadName: $"{result[0].FileName}.{result[0].FileExtension}");
            }
            else
            {
                Response.ContentType = "application/zip";
                var zipFileName = $"download_{DateTime.UtcNow:yyyyMMddHHmmss}.zip";
                Response.Headers.ContentDisposition = $"attachment; filename*=UTF-8''{Uri.EscapeDataString(zipFileName)}";
                await using var zipStream = Response.BodyWriter.AsStream(true);
                using var zip = new ZipArchive(zipStream, ZipArchiveMode.Create, leaveOpen: false);
                foreach (var file in result)
                {
                    string path = Path.Combine(Env.ContentRootPath, file.Path,$"{file.InternalId}.{file.FileExtension}");
                    if (!System.IO.File.Exists(path)) continue;
                    var entryName = string.IsNullOrWhiteSpace(file.FileName)? $"{file.InternalId}.{file.FileExtension}": file.FileName;
                    var entry = zip.CreateEntry(entryName, CompressionLevel.Fastest);
                    await using var entryStream = entry.Open();
                    await using var fs = System.IO.File.OpenRead(path);
                    await fs.CopyToAsync(entryStream, HttpContext.RequestAborted);
                }
                return new EmptyResult();
            }
        }
        [HttpGet($@"{nameof(Preview)}/{{internalId}}")] public async Task<IActionResult> Preview(string internalId, CancellationToken ct)
        {
            // 1) 取檔案資訊（你自己的資料表）
            QueryListParam param = new()
            {
                Fields = [nameof(FileManageModel.InternalId), nameof(FileManageModel.FileSHA256),nameof(FileManageModel.Path),
                    nameof(FileManageModel.FileExtension),nameof(FileManageModel.FileName),nameof(FileManageModel.MimeType),nameof(FileManageModel.ModifyTime)],
                Condition = $"{nameof(FileManageModel.InternalId)} = {internalId}",
                PageSize = 1,
                PageNumber =1,
            };


            var fileQuery = await Service.BizQueryListAsync(param.Fields, param.Condition, default, param.PageNumber, param.PageSize);

            //OperateLogModel followInfo = new OperateLogModel();
            //followInfo.APIName = $"{Service.ProgId}/{nameof(Preview)}";
            //followInfo.UserId = "SysOperator";
            //followInfo.followingDT = JsonConvert.SerializeObject(param);
            //followInfo.IP = Request.Headers["HTTP_CLIENT_IP"].ToString();
            //OperateLog.AddMoveFollow(followInfo);
            var file = fileQuery.FirstOrDefault()?.FileManage;
            if (file is null) return NotFound();
            // 1) 包成 DateTimeOffset（UTC）並去掉毫秒
            DateTime utc = (DateTime)file.ModifyTime;
            var lastModified = new DateTimeOffset(utc).AddTicks(-(utc.Ticks % TimeSpan.TicksPerSecond));
            // 2) 不能是未來時間（保險）
            if (lastModified > DateTimeOffset.UtcNow) lastModified = DateTimeOffset.UtcNow;
            // 2) 轉為實體路徑（依你的儲存策略）
            var physicalPath = $"{Env.ContentRootPath}/{file.Path}/{file.InternalId}.{file.FileExtension}";
            
            if (!System.IO.File.Exists(physicalPath)) return NotFound();
            // 3) 設定快取與 ETag（若 internalId 不變，可設長快取）
            var etag = $"W/\"{file.FileSHA256}\""; // weak etag
            Response.Headers.ETag = etag;
            Response.Headers.LastModified = lastModified.ToString("R");
            Response.Headers.CacheControl = "public, max-age=31536000, immutable"; // 之後想短一點就改
            // 4) inline 顯示而非下載（AA/SEO 友善；下載另外做 /Download）
            Response.Headers.ContentDisposition = $"inline; filename*=UTF-8''{Uri.EscapeDataString(file.FileName ?? "file")}";
            var contentType = string.IsNullOrWhiteSpace(file.MimeType) ? "application/octet-stream" : file.MimeType;
            // 5) 串流回傳並允許 Range（影片/音訊可拖曳）
            return PhysicalFile(physicalPath, contentType, enableRangeProcessing: true);
        }
        /// <summary>
        /// 匯入初始檔案資料
        /// </summary>
        /// <param name="label"></param>
        /// <param name="zipFile"></param>
        /// <returns></returns>
        [DisableRequestSizeLimit]
        [RequestSizeLimit(1024L * 1024 * 1024 * 2)] // 2 GB
        [HttpPost(nameof(ImportInitialFiles))] public async Task<IActionResult> ImportInitialFiles(string label="1810")
        {
            await ((FileManagementBiz)Service).ImportZip(label);
            return Ok();
        }
    }
}
