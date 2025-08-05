using Microsoft.Extensions.Options;
using MimeDetective;
using MimeDetective.Storage;
using SharpCompress.Archives;
using System.Net;
using System.Runtime.CompilerServices;
using System.Security.Cryptography;
using System.Threading.Tasks;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore.SystemFunc.FileManagement
{
    public class FileManagementBiz(IRepositoryMapProvider repoMapProvider, IOptions<FilePathOptions> options) : BizService<FileManagementSet>(repoMapProvider), IBizService<FileManagementSet>
    {
        #region Property
        private readonly FilePathOptions FilePath=options.Value;
        #endregion

        #region Public
        /// <summary>
        /// 暫時上傳，放至暫存區
        /// </summary>
        /// <param name="file"></param>
        public async Task UploadTemp(IFormFile file)
        {
            string sha256 = GetFileSHA256(file);
            var (isNew, set) = await CheckSHA256Async(sha256,file);
            if (CheckFileLegal(file, set))
            {
                await DoStoreFileToSystem(file, set);
                set.FileManagement.FileStatus = FileStatus.Pending;
            }
            if (isNew) await CreateSetAsync(set);
            else await UpdateSetAsync(set.FileManagement.InternalId, set);
        }
        /// <summary>
        /// 確定保存，移至正式區
        /// </summary>
        /// <param name="internalIds"></param>
        public async Task MoveToPermanent(string[] internalIds)
        {
            if (internalIds.IsNullOrEmpty() || internalIds.Length == 0) return;
            List<FileManagementSet> sets = [];
            var list = await this.DoQueryListAsync(typeof(FileManagementModel),
                [nameof(FileManagementModel.InternalId), nameof(FileManagementModel.FileName)],
                $@"{nameof(FileManagementModel.InternalId)} in ({LibData.Merge(",", false, internalIds)}) And 
                    {nameof(FileManagementModel.FileStatus)} = {FileStatus.Pending}" , 0, 0);

            foreach (var item in list) sets.Add(await DoQuerySetAsync(((FileManagementModel)item).InternalId));
            await MoveFileFromTempToFinal(sets);
        }
        /// <summary>
        /// 取消上傳檔案
        /// </summary>
        /// <param name="internalIds"></param>
        /// <returns></returns>
        public async Task CancelUploadFiles(string[] internalIds)
        {
            if (internalIds.IsNullOrEmpty() || internalIds.Length == 0) return;
            List<FileManagementSet> sets = [];
            var list = await this.DoQueryListAsync(typeof(FileManagementModel),
                [nameof(FileManagementModel.InternalId), nameof(FileManagementModel.FileName)],
                $@"{nameof(FileManagementModel.InternalId)} in ({LibData.Merge(",", false, internalIds)}) And 
                    {nameof(FileManagementModel.FileStatus)} = {FileStatus.Pending}", 0, 0);

            foreach (var item in list) sets.Add(await DoQuerySetAsync(((FileManagementModel)item).InternalId));
            await DeleteFromTemp(sets);
        }
        /// <summary>
        /// 下載檔案
        /// </summary>
        /// <param name="internalIds"></param>
        public async Task DownloadFile(string[] internalIds)
        {
            if (internalIds.Length == 0) return;
            else 
            {
                List<FileManagementSet> sets = [];
                foreach(var internalId in internalIds)
                {
                    var set = await DoQuerySetAsync(internalId);
                    if(set!=null) sets.Add(set);
                }
                if (sets.Count == 0) return;

                Dictionary<string,string> files = [];
                foreach(var set in sets)
                {
                    set.FileInfoDownload.Add(new FileInfoDownloadModel());

                    files.Add(Path.Combine(set.FileManagement.Path, set.FileManagement.InternalId),
                        LibData.Merge(".", false, set.FileManagement.FileName, set.FileManagement.FileExtension));
                }
                if (files.Count == 1)
                {
                    //回傳資料
                }
                else
                {
                    //回傳zip
                }
                //更新FileInfoDownloadModel即可，用不著update更新所有資訊
            }
        }

        public async Task ImportZip(string label)
        {
            await Decompress(label);
        }


        /// <summary>
        /// 同步檔案至不同Service
        /// </summary>
        public async void SyncFiles()
        {

        }
        #endregion

        #region Private
        /// <summary>
        /// 創建暫存檔案資訊
        /// </summary>
        /// <param name="file"></param>
        /// <returns></returns>
        private FileManagementSet CreateNewFileInfo(IFormFile file, string sha256)
        {
            DateTime today = DateTime.UtcNow;
            string internalId = Guid.NewGuid().ToString();
            FileManagementSet set = new()
            {
                FileManagement = new()
                {
                    InternalId = internalId,
                    ProgId = "",
                    Path = LibData.Merge("/", false, FilePath.Root, FilePath.Pending, today.Year, today.Month, today.Day, ""),
                    FileName = Path.GetFileNameWithoutExtension(file.FileName),
                    FileDescription = file.FileName,
                    FileStatus = FileStatus.None,
                    FileSHA256 = sha256,
                    FileSize = file.Length
                }
            };
            return set;
        }
        /// <summary>
        /// 檢查檔案是否合法上傳
        /// </summary>
        /// <param name="file"></param>
        /// <param name="set"></param>
        /// <returns></returns>
        private static bool CheckFileLegal(IFormFile file, FileManagementSet set)
        {
            if (file == null || file.Length == 0) return false;
            if (CheckFileExist(set)) return false;
            if (!CheckFileExtension(file, set)) return false;
            if (!CheckFileSize(file, set)) return false;
            return true;
        }
        /// <summary>
        /// 獲取SHA256值
        /// </summary>
        /// <param name="file"></param>
        /// <returns></returns>
        private static string GetFileSHA256(IFormFile file)
        {
            using var ms = new MemoryStream();
            file.CopyTo(ms);
            var fileBytes = ms.ToArray();
            var hashBytes = SHA256.HashData(fileBytes);
            return BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
        }
        /// <summary>
        /// 檢查Sha256是否存在在系統之中
        /// </summary>
        /// <param name="data"></param>
        private async Task<(bool exists, FileManagementSet? set)> CheckSHA256Async(string sha256, IFormFile file)
        {
            var exist = await DoQueryListAsync(
                typeof(FileManagementModel),
                [nameof(FileManagementSet.FileManagement.InternalId), nameof(FileManagementSet.FileManagement.FileSHA256)],
                @$"{nameof(FileManagementSet.FileManagement.FileSHA256)} = {sha256}", 0, 0
            );
            FileManagementSet set = exist.Count == 0 ? CreateNewFileInfo(file, sha256) : await DoQuerySetAsync(((FileManagementModel)exist[0]).InternalId);
            set.FileInfoSync.Add(new FileInfoSyncModel()
            {
                InternalId = set.FileManagement.InternalId,
                FileStatus = FileStatus.Pending,
                SrcIP = "",
                SrcNode = "Guest",
                SrcFullPath = file.FileName,
                DestIP = Dns.GetHostName().ToString(),
                DestNode = Environment.MachineName,
                DestFullPath = "",
            });
            return (exist.Count == 0, set);
        }
        /// <summary>
        /// 存入系統
        /// </summary>
        /// <param name="file"></param>
        /// <param name="set"></param>
        private static async Task DoStoreFileToSystem(IFormFile file, FileManagementSet set)
        {
            if (file == null || file.Length == 0) return;
            if (!Directory.Exists(set.FileManagement.Path))Directory.CreateDirectory(set.FileManagement.Path);
            var fileName = $"{set.FileManagement.InternalId}.{set.FileManagement.FileExtension}";
            var fullPath = Path.Combine(set.FileManagement.Path, fileName);
            using var stream = new FileStream(fullPath, FileMode.Create);
            await file.CopyToAsync(stream);
        }
        /// <summary>
        /// 將檔案從暫存區移至正式區
        /// </summary>
        /// <param name="sets"></param>
        private async Task MoveFileFromTempToFinal(List<FileManagementSet> sets)
        {
            DateTime today = DateTime.UtcNow;
            string dstPath = LibData.Merge("/", false, FilePath.Root, FilePath.Permanent, today.Year, today.Month, today.Day, ProgId);
            if (!Directory.Exists(dstPath)) Directory.CreateDirectory(dstPath);
            foreach (var set in sets)
            {
                if (set.FileManagement.FileStatus != FileStatus.Pending) continue;
                var header = set.FileManagement;
                var curSyncInfo = new FileInfoSyncModel() { InternalId = set.FileManagement.InternalId, FileStatus = FileStatus.Success };
                set.FileInfoSync.Add(curSyncInfo);
                string srcPath = header.Path;
                string srcFullPath = LibData.Merge("/", false, header.Path, $"{header.InternalId}.{header.FileExtension}");
                string dstFullPath = LibData.Merge("/", false, dstPath, $"{header.InternalId}.{header.FileExtension}");
                header.FileStatus = FileStatus.Success;
                header.Path = dstPath;
                curSyncInfo.SrcFullPath = srcFullPath;
                curSyncInfo.DestFullPath = dstFullPath;
                curSyncInfo.FileStatus = FileStatus.Success;
                curSyncInfo.SrcIP = "";
                curSyncInfo.DestIP = "";
                curSyncInfo.DestNode = Environment.MachineName;
                curSyncInfo.SrcNode = Environment.MachineName;
                if (File.Exists(srcFullPath)) File.Move(srcFullPath, dstFullPath);
                else
                {
                    header.FileStatus = FileStatus.Pending;
                    header.Path = srcPath;
                    curSyncInfo.FileStatus = FileStatus.Failed;
                    curSyncInfo.ErrorMessage = "找不到檔案可移動。";
                }
                await this.UpdateSetAsync(header.InternalId, set);
            }
        }
        /// <summary>
        /// 將檔案從暫存區移至正式區
        /// </summary>
        /// <param name="sets"></param>
        private async Task DeleteFromTemp(List<FileManagementSet> sets)
        {
            foreach (var set in sets)
            {
                if (set.FileManagement.FileStatus != FileStatus.Pending) continue;
                var header = set.FileManagement;
                var curSyncInfo = new FileInfoSyncModel() { InternalId = set.FileManagement.InternalId, FileStatus = FileStatus.Canceled };
                set.FileInfoSync.Add(curSyncInfo);
                string srcPath = header.Path;
                string srcFullPath = LibData.Merge("/", false, header.Path, $"{header.InternalId}.{header.FileExtension}");
                string dstFullPath = string.Empty;
                header.FileStatus = FileStatus.Success;
                header.Path = string.Empty;
                curSyncInfo.SrcFullPath = srcFullPath;
                curSyncInfo.DestFullPath = dstFullPath;
                curSyncInfo.FileStatus = FileStatus.Success;
                curSyncInfo.SrcIP = "";
                curSyncInfo.DestIP = "";
                curSyncInfo.DestNode = Environment.MachineName;
                curSyncInfo.SrcNode = Environment.MachineName;
                if (File.Exists(srcFullPath)) File.Delete(srcFullPath);
                else
                {
                    header.FileStatus = FileStatus.Pending;
                    header.Path = srcPath;
                    curSyncInfo.FileStatus = FileStatus.Failed;
                    curSyncInfo.ErrorMessage = "找不到檔案可刪除。";
                }
                await this.UpdateSetAsync(header.InternalId, set);
            }
        }
        /// <summary>
        /// 紀錄下載資訊
        /// </summary>
        /// <param name="intenralId"></param>
        private void SetDowloadInfo(string intenralId)
        {

        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="file"></param>
        /// <param name="set"></param>
        /// <returns></returns>
        private static bool CheckFileExtension(IFormFile file, FileManagementSet set)
        {
            using var stream = file.OpenReadStream();
            var inspector = new ContentInspectorBuilder() { Definitions = MimeDetective.Definitions.DefaultDefinitions.All() }.Build();
            FileType fileType = inspector.Inspect(stream).FirstOrDefault().Definition.File;
            var header = set.FileManagement;
            var syncInfo = set.FileInfoSync.LastOrDefault();
            if (fileType != null)
            {
                header.FileExtension = fileType.Extensions.FirstOrDefault().ToLowerInvariant();
                header.MimeType = fileType.MimeType.ToLowerInvariant();
                if (!CheckExtension(fileType))
                {
                    header.FileStatus = FileStatus.Failed;
                    syncInfo.FileStatus = FileStatus.Failed;
                    syncInfo.ErrorMessage = $"實際的網際網路媒體類型為【{fileType.MimeType.ToLowerInvariant()}】不允許上傳";
                    return false;
                }
                if (!CheckMimeType(fileType))
                {
                    header.FileStatus = FileStatus.Failed;
                    syncInfo.FileStatus = FileStatus.Failed;
                    syncInfo.ErrorMessage = $"實際的網際網路媒體類型為【{fileType.MimeType.ToLowerInvariant()}】，不允許上傳";
                    return false;
                }
            }
            return true;
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="file"></param>
        /// <param name="set"></param>
        /// <returns></returns>
        private static bool CheckFileSize(IFormFile file, FileManagementSet set)
        {
            const long MaxFileSize = 20 * 1024 * 1024;
            if (file.Length > MaxFileSize)
            {
                set.FileInfoSync.FirstOrDefault().ErrorMessage = "檔案大小超過 20MB，請重新上傳";
                return false;
            }
            return true;
        }
        /// <summary>
        /// 檢查檔案是否已存在
        /// </summary>
        /// <param name="set"></param>
        /// <returns></returns>
        private static bool CheckFileExist(FileManagementSet set)
        {
            string fullPath = Path.Combine(set.FileManagement.Path, $"{set.FileManagement.InternalId}.{set.FileManagement.FileExtension}");
            if (set.FileManagement.FileStatus.In(FileStatus.Pending, FileStatus.Success) || File.Exists(fullPath))
            {
                set.FileInfoSync.LastOrDefault().FileStatus = FileStatus.Skipped;
                return true;
            }
            return false;
        }
        /// <summary>
        /// 檢查副檔名是否合法
        /// </summary>
        /// <param name="fileType"></param>
        /// <returns></returns>
        private static bool CheckExtension(FileType fileType)
        {
            string[] checkList = [FileExtensions.PDF,FileExtensions.TXT];
            return checkList.Contains(fileType.Extensions.FirstOrDefault().ToLowerInvariant());
        }
        /// <summary>
        /// 檢查網際網路媒體類型是否合法
        /// </summary>
        /// <param name="mimeType"></param>
        /// <returns></returns>
        private static bool CheckMimeType(FileType fileType)
        {
            string[] checkList = [MimeTypes.APPLICATION_PDF, MimeTypes.TEXT_PLAIN];
            return checkList.Contains(fileType.MimeType.ToLowerInvariant());
        }
        /// <summary>
        /// 解壓縮檔案
        /// </summary>
        /// <param name="label"></param>
        /// <param name="file"></param>
        /// <returns></returns>
        /// <exception cref="ArgumentException"></exception>
        private async Task Decompress(string label)
        {
            string rootPath = LibData.Merge("/", false, FilePath.Root, FilePath.Import);
            string extractToFolder = LibData.Merge("/", false, rootPath, label);
            using var archive = ArchiveFactory.Open(LibData.Merge("/", false, rootPath, $"{label}.zip"));
            foreach (var entry in archive.Entries.Where(e => !e.IsDirectory))
            {
                var fullPath = Path.Combine(extractToFolder, entry.Key);
                Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
                using var entryStream = entry.OpenEntryStream();
                using var outStream = File.Create(fullPath);
                entryStream.CopyTo(outStream);
                outStream.Close();

                var fileInfo = new FileInfo(fullPath);
                long fileSize = fileInfo.Length;
                using var hashStream = File.OpenRead(fullPath);
                using var sha256 = SHA256.Create();
                var hashBytes = sha256.ComputeHash(hashStream);
                string fileSha256 = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();

                var internalId = Guid.NewGuid().ToString();
                var set = new FileManagementSet()
                {
                    FileManagement = new FileManagementModel()
                    {
                        InternalId = internalId,
                        ProgId = "",
                        Path = fullPath,
                        FileName = Path.GetFileNameWithoutExtension(entry.Key),
                        FileExtension = Path.GetExtension(entry.Key)?.TrimStart('.').ToLowerInvariant(),
                        FileSHA256 = fileSha256,
                        FileSize = fileSize,
                        ImportLabel = label,
                        FileStatus = FileStatus.Success,
                        IsIniData = true,
                    },
                    FileInfoSync=
                    [
                        new FileInfoSyncModel()
                        {
                            InternalId = internalId,
                            FileStatus = FileStatus.Success,
                            SrcIP = Dns.GetHostName().ToString(),
                            SrcNode = Environment.MachineName,
                            SrcFullPath = extractToFolder,
                            DestIP = Dns.GetHostName().ToString(),
                            DestNode = Environment.MachineName,
                            DestFullPath = fullPath,
                        }
                    ]
                };
                await this.CreateSetAsync(set);
            }
        }

        #endregion
    }
}
