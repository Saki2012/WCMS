using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.IO.Compression;
using System.Text.RegularExpressions;
using WCMS.SysCore.Enum;
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
        [HttpPost(nameof(UploadTemp)), AllowAnonymous, IgnoreAntiforgeryToken]
        [RequestSizeLimit(200L * 1024 * 1024)] // 200 MB
        public async Task<IActionResult> UploadTemp(IFormFile file)
        {
            OperateLogModel followInfo = OperateLog.AddMoveFollow($"{Service.ProgId}/{nameof(UploadTemp)}", OperateUser.UserId, JsonConvert.SerializeObject(file), Request.Headers["HTTP_CLIENT_IP"].ToString());
            var internalId = await ((FileManagementBiz)Service).UploadTemp(file);
            var response = new ApiResponse<string>() { Data = [internalId], SysMessage = Message.Messages };
            return Ok(response);
        }
        [HttpPost(nameof(MoveToPermanent)), AllowAnonymous, IgnoreAntiforgeryToken]
        public async Task<IActionResult> MoveToPermanent(string[] internalIds)
        {
            OperateLogModel followInfo = OperateLog.AddMoveFollow($"{Service.ProgId}/{nameof(MoveToPermanent)}", OperateUser.UserId, JsonConvert.SerializeObject(internalIds),Request.Headers["HTTP_CLIENT_IP"].ToString());
            await ((FileManagementBiz)Service).MoveToPermanent(internalIds);
            var response = new ApiResponse<string>() { Data = internalIds, SysMessage = Message.Messages };
            return Ok(response);
        }
        [HttpPost(nameof(CancelUploadFiles)), AllowAnonymous, IgnoreAntiforgeryToken]
        public async Task<IActionResult> CancelUploadFiles(string[] internalIds)
        {
            OperateLogModel followInfo = OperateLog.AddMoveFollow($"{Service.ProgId}/{nameof(CancelUploadFiles)}", OperateUser.UserId, JsonConvert.SerializeObject(internalIds), Request.Headers["HTTP_CLIENT_IP"].ToString());
            await ((FileManagementBiz)Service).CancelUploadFiles(internalIds);
            var response = new ApiResponse<string>() { Data = internalIds,SysMessage = Message.Messages };
            return Ok(response);
        }
        /// <summary>
        /// 下載檔案
        /// </summary>
        /// <param name="internalId"></param>
        /// <returns></returns>
        [HttpGet($"{nameof(Download)}/{{internalId}}"), AllowAnonymous, IgnoreAntiforgeryToken] public async Task<IActionResult> Download(string internalId, CancellationToken ct)
        {
            OperateLogModel followInfo = OperateLog.AddMoveFollow($"{Service.ProgId}/{nameof(Download)}", OperateUser.UserId, JsonConvert.SerializeObject(internalId), Request.Headers["HTTP_CLIENT_IP"].ToString());
            var result = await ((FileManagementBiz)Service).GetDownloadFileInfo([internalId]);
            if (result.Count == 0) return NotFound();
            else if (result.Count == 1) 
            {
                string path = Path.Combine(Env.ContentRootPath,result[0].Path,$"{result[0].InternalId}.{result[0].FileExtension}");
                if (string.Equals(result[0].FileExtension, FileExtensions.PDF, StringComparison.OrdinalIgnoreCase)) return PhysicalFile(path, result[0].MimeType);
                else 
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
        [HttpGet($@"{nameof(Preview)}/{{internalId}}"), AllowAnonymous, IgnoreAntiforgeryToken] public async Task<IActionResult> Preview(string internalId, CancellationToken ct)
        {
            // === 1) 取檔案 ===
            QueryListParam param = new()
            {
                Fields = [nameof(FileManageModel.InternalId),nameof(FileManageModel.FileSHA256),nameof(FileManageModel.Path),nameof(FileManageModel.FileExtension),nameof(FileManageModel.FileName),nameof(FileManageModel.MimeType),nameof(FileManageModel.ModifyTime)],
                Condition = $"{nameof(FileManageModel.InternalId)} = {internalId}",
                PageSize = 1,
                PageNumber = 1,
            };
            var fileQuery = await Service.BizQueryListAsync(param.Fields, param.Condition, default, param.PageNumber, param.PageSize);
            var file = fileQuery.FirstOrDefault()?.FileManage;
            if (file is null) return NotFound();
            // === 2) 檔案實體路徑 ===
            var ext = (file.FileExtension ?? "").Trim().TrimStart('.'); // ← 乾淨的副檔名
            var physicalPath = Path.Combine(Env.ContentRootPath, file.Path ?? "", $"{file.InternalId}.{ext}");
            if (!System.IO.File.Exists(physicalPath)) return NotFound();
            // === 3) Last-Modified / ETag 快取 ===
            DateTime utc = (DateTime)file.ModifyTime;
            var lastModified = new DateTimeOffset(utc).AddTicks(-(utc.Ticks % TimeSpan.TicksPerSecond));
            if (lastModified > DateTimeOffset.UtcNow) lastModified = DateTimeOffset.UtcNow;
            Response.Headers.ETag = $"W/\"{file.FileSHA256}\"";
            Response.Headers.LastModified = lastModified.ToString("R");
            Response.Headers.CacheControl = "public, max-age=31536000, immutable";
            // === 4) 正確檔名（含副檔名） ===
            var baseName = string.IsNullOrWhiteSpace(file.FileName) ? $"{file.InternalId}" : file.FileName.Trim();
            var safeFileName = string.IsNullOrWhiteSpace(ext) ? baseName : $"{baseName}.{ext}";
            // === 5) 正確 Content-Type（DB 沒存或存錯就用副檔名推斷） ===
            var contentType = file.MimeType;
            if (string.IsNullOrWhiteSpace(contentType) || contentType.Equals("application/octet-stream", StringComparison.OrdinalIgnoreCase))
            {
                var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
                if (!provider.TryGetContentType(safeFileName, out contentType))
                    contentType = "application/octet-stream";
            }
            // === 6) inline + 同時提供 filename / filename*（處理中文/相容性） ===
            var asciiFallback = Regex.Replace(safeFileName, @"[^\x20-\x7E]", "_").Replace("\"", "'");
            Response.Headers.ContentDisposition = $"inline; filename=\"{asciiFallback}\"; filename*=UTF-8''{Uri.EscapeDataString(safeFileName)}";
            Response.Headers.XContentTypeOptions = "nosniff";
            // 不必手動寫 Response.Headers.ContentType；讓 File(...) 幫你設定即可
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
