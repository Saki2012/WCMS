using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
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
            return Ok(response);
        }

        [HttpPost(nameof(MoveToPermanent))]
        public async Task<IActionResult> MoveToPermanent(string[] internalIds)
        {
            await ((FileManagementBiz)Service).MoveToPermanent(internalIds);
            var response = new ApiResponse<string>() { Data = internalIds };
            return Ok(response);
        }

        [HttpPost(nameof(CancelUploadFiles))]
        public async Task<IActionResult> CancelUploadFiles(string[] internalIds)
        {
            await ((FileManagementBiz)Service).CancelUploadFiles(internalIds);
            var response = new ApiResponse<string>() { Data = internalIds };
            return Ok(response);
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

        [HttpGet($@"{nameof(Preview)}/{{internalId}}")]
        public async Task<IActionResult> Preview(string internalId, CancellationToken ct)
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
            var fileQuery = await Service.QueryListAsync(param.Fields,param.Condition,param.PageNumber,param.PageSize);
            var file = fileQuery.FirstOrDefault().FileManage;
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
    public class FileManageSet_DTO
    {
        public FileManageModel_DTO FileManage { get; set; } = new();
        public List<FileManage_DownloadInfoModel_DTO> FileManage_DownloadInfo { get; set; } = [];
        public List<FileManage_SyncInfoModel_DTO> FileManage_SyncInfo { get; set; } = [];
    }
    /// <summary>
    /// 檔案管理
    /// </summary>
    public class FileManageModel_DTO
    {
        /// <summary>
        /// 檔案識別碼
        /// </summary>
        [LibDesc, Key] public new string InternalId { get; set; } = new Guid().ToString();
        /// <summary>
        /// 路徑
        /// </summary>
        [LibDesc] public string Path { get; set; }
        /// <summary>
        /// 檔案名稱
        /// </summary>
        [LibDesc, MaxLength(255)] public string FileName { get; set; }
        /// <summary>
        /// 副檔名
        /// </summary>
        [LibDesc, MaxLength(15)] public string FileExtension { get; set; }
        /// <summary>
        /// 檔案描述
        /// (後續可透過帶出，其他表可修改對應的顯示說明)
        /// </summary>
        [LibDesc] public string FileDescription { get; set; } = string.Empty;
        /// <summary>
        /// 網際網路媒體型式
        /// </summary>
        [LibDesc] public string MimeType { get; set; } = string.Empty;
        /// <summary>
        /// 檔案SHA256值 
        /// 用來檢查Server是否已有該檔案，若有就不用再次上傳，但是要更新其他欄位
        /// </summary>
        [LibDesc, MaxLength(64)] public string FileSHA256 { get; set; }
        /// <summary>
        /// 檔案大小
        /// </summary>
        [LibDesc] public long FileSize { get; set; }
        /// <summary>
        /// 功能Id
        /// </summary>
        [LibDesc] public string ProgId { get; set; }
        /// <summary>
        /// 匯入標籤(
        /// (供初始化的，例如1810專案的檔案匯入，資料夾就為1810(ImportLabel名就為1810)，底下結構不變的紀錄至Path)
        /// </summary>
        [LibDesc] public string ImportLabel { get; set; } = string.Empty;
        /// <summary>
        /// 檔案狀態
        /// </summary>
        [LibDesc] public FileStatus FileStatus { get; set; }
        /// <summary>
        /// 下載次數
        /// </summary>
        [LibDesc, NotMapped] public int DownloadCount { get; } 
    }
    /// <summary>
    /// 檔案被下載資訊
    /// </summary>
    public class FileManage_DownloadInfoModel_DTO
    {
        /// <summary>
        /// 檔案識別碼
        /// </summary>
        [LibDesc, Key] public string InternalId { get; set; }
        /// <summary>
        /// 行代碼
        /// </summary>
        [LibDesc, Key] public int? RowId { get; set; }
        /// <summary>
        /// 下載者IP
        /// </summary>
        [LibDesc] public string DownloadUserIP { get; set; }
        /// <summary>
        /// 使用裝置
        /// </summary>
        [LibDesc] public string UserAgent { get; set; }
        /// <summary>
        /// 下載來源
        /// </summary>
        [LibDesc] public string RefererURL { get; set; }
        /// <summary>
        /// 下載狀態 (成功/失敗)
        /// </summary>
        [LibDesc] public string DownloadStatus { get; set; }
        /// <summary>
        /// 下載時間
        /// </summary>
        [LibDesc] public DateTime DownloadTime { get; set; }
    }
    /// <summary>
    /// 檔案同步資訊
    /// </summary>
    public class FileManage_SyncInfoModel_DTO
    {
        /// <summary>
        /// 檔案識別碼
        /// </summary>
        [LibDesc, Key] public string InternalId { get; set; }
        /// <summary>
        /// 行代碼
        /// </summary>
        [LibDesc, Key] public int? RowId { get; set; }
        /// <summary>
        /// 同步狀態
        /// </summary>
        public FileStatus FileStatus { get; set; } = FileStatus.None;
        /// <summary>
        /// 來源IP
        /// </summary>
        public string SrcIP { get; set; } = string.Empty;
        /// <summary>
        /// 來源機器
        /// </summary>
        public string SrcNode { get; set; } = string.Empty;
        /// <summary>
        /// 來源完整路徑
        /// </summary>
        public string SrcFullPath { get; set; } = string.Empty;
        /// <summary>
        /// 目的地IP
        /// </summary>
        public string DestIP { get; set; } = string.Empty;
        /// <summary>
        /// 目的地機器
        /// </summary>
        public string DestNode { get; set; } = string.Empty;
        /// <summary>
        /// 目的地完整路徑
        /// </summary>
        public string DestFullPath { get; set; } = string.Empty;
        /// <summary>
        /// 錯誤訊息碼
        /// </summary>
        public string? ErrorCode { get; set; } = string.Empty;
        /// <summary>
        /// 錯誤訊息
        /// </summary>
        public string? ErrorMessage { get; set; } = string.Empty;
        /// <summary>
        /// 執行時間
        /// </summary>
        public DateTime ExecuteTime { get; set; } = DateTime.UtcNow;
    }
    /// <summary>
    /// 檔案被用表 (之後再來做邏輯，先開表)
    /// </summary>
    public class FileManage_UsedModel_DTO
    {
        /// <summary>
        /// 檔案識別碼
        /// </summary>
        [LibDesc, Key] public string InternalId { get; set; }
        /// <summary>
        /// 行代碼
        /// </summary>
        [LibDesc, Key] public int? RowId { get; set; }
        /// <summary>
        /// 使用的功能表名
        /// </summary>
        [LibDesc] public string TableName { get; set; }
        /// <summary>
        /// 使用的功能欄位名稱
        /// </summary>
        [LibDesc] public string ColumnName { get; set; }
        /// <summary>
        /// 對應資料主鍵
        /// </summary>
        public string CompositeKey { get; set; }
    }
}
