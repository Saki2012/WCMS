using Azure;
using Azure.Core;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using SharpCompress.Archives;
using System.Reflection;
using WCMS.SysCore.AppSettingsOptions;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Resx;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore.SystemFunc.FileManagement
{
    public class FileManagementBiz(IRepositoryMapProvider repoMapProvider, IOptions<FilePathOptions> options, IErrorHelper message) : BizService<FileManageSet>(repoMapProvider, message), IBizService<FileManageSet>
    {
        #region Property
        private readonly FilePathOptions FilePath = options.Value;
        #endregion

        #region Public
        /// <summary>
        /// 暫時上傳，放至暫存區
        /// </summary>
        /// <param name="file"></param>
        public async Task<string> UploadTemp(IFormFile file)
        {
            string sha256 = LibData.GetFileSHA256(file);
            var (isNew, set) = await CheckSHA256Async(sha256, file);
            if (CheckFileLegal(file, set))
            {
                await DoStoreFileToSystem(file, set);
                set.FileManage.FileStatus = FileStatus.Pending;
            }
            await (isNew ? BizCreateSetAsync(set) : BizUpdateSetAsync(set.FileManage.InternalId, set));
            //更新完DB後再把Message訊息加回，避免MessageError時無法正常保存
            var syncInfo = set.FileManage_SyncInfo.LastOrDefault();
            if (!syncInfo.ErrorCode.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00025, syncInfo.ErrorMessage);
            return set.FileManage.InternalId;
        }
        /// <summary>
        /// 確定保存，移至正式區
        /// </summary>
        /// <param name="internalIds"></param>
        public async Task MoveToPermanent(string[] internalIds)
        {
            if (internalIds.IsNullOrEmpty() || internalIds.Length == 0) return;
            List<FileManageSet> sets = [];
            var list = await this.DoQueryListAsync(typeof(FileManageModel),
                [nameof(FileManageModel.InternalId), nameof(FileManageModel.FileName)],
                $@"{nameof(FileManageModel.InternalId)} in ({LibData.Merge(",", false, internalIds)}) And 
                   {nameof(FileManageModel.FileStatus)} = {FileStatus.Pending}",default, 0, 0);

            foreach (var item in list) sets.Add(await DoQuerySetAsync(((FileManageModel)item).InternalId));
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
            List<FileManageSet> sets = [];
            var list = await this.DoQueryListAsync(typeof(FileManageModel),
                [nameof(FileManageModel.InternalId), nameof(FileManageModel.FileName)],
                $@"{nameof(FileManageModel.InternalId)} in ({LibData.Merge(",", false, internalIds)}) And 
                    {nameof(FileManageModel.FileStatus)} = {FileStatus.Pending}", default, 0, 0);

            foreach (var item in list) sets.Add(await DoQuerySetAsync(((FileManageModel)item).InternalId));
            await DeleteFromTemp(sets);
        }
        /// <summary>
        /// 下載檔案
        /// </summary>
        /// <param name="internalIds"></param>
        public async Task<IList<FileManageModel>> GetDownloadFileInfo(string[] internalIds)
        {
            if (internalIds.Length == 0) return [];
            else
            {
                List<FileManageSet> sets = [];
                string[] selectFields = [nameof(FileManageModel.InternalId), nameof(FileManageModel.Path), nameof(FileManageModel.FileExtension), nameof(FileManageModel.FileName), nameof(FileManageModel.MimeType)];
                string condition;
                if (internalIds.Length == 1) condition = $"{nameof(FileManageModel.InternalId)} = {internalIds[0]}";
                else condition = $"{nameof(FileManageModel.InternalId)} In {LibData.Merge(',', false, internalIds)}";
                return await DoQueryListAsync(typeof(FileManageModel), selectFields, condition, default, 0, 0) as IList<FileManageModel>;
            }
        }
        /// <summary>
        /// 匯入初始檔案
        /// </summary>
        /// <param name="label"></param>
        /// <returns></returns>
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
        private FileManageSet CreateNewFileInfo(IFormFile file, string sha256)
        {
            DateTime today = DateTime.UtcNow;
            string internalId = Guid.NewGuid().ToString();
            using var stream = file.OpenReadStream();
            FileManageSet set = new()
            {
                FileManage = new()
                {
                    InternalId = internalId,
                    ProgId = "",
                    Path = LibData.Merge("/", false, FilePath.Root, FilePath.Pending, today.Year, today.Month, today.Day, ""),
                    FileExtension = LibData.GetFileExtenstion(stream),
                    MimeType = LibData.GetFileMimeType(stream),
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
        private bool CheckFileLegal(IFormFile file, FileManageSet set)
        {
            if (file == null || file.Length == 0) return false;
            var filemanage = set.FileManage;
            var syncInfo = set.FileManage_SyncInfo.LastOrDefault();
            if (CheckFileExist(filemanage, syncInfo)) return false;
            if (!CheckFileExtension(filemanage, syncInfo)) return false;
            if (!CheckFileSize(filemanage, syncInfo)) return false;
            return true;
        }
        /// <summary>
        /// 檢查Sha256是否存在在系統之中
        /// </summary>
        /// <param name="data"></param>
        private async Task<(bool exists, FileManageSet? set)> CheckSHA256Async(string sha256, IFormFile file)
        {
            var exist = await DoQueryListAsync(
                typeof(FileManageModel),
                [nameof(FileManageSet.FileManage.InternalId), nameof(FileManageSet.FileManage.FileSHA256)],
                @$"{nameof(FileManageSet.FileManage.FileSHA256)} = {sha256}", default, 0, 0
            );
            FileManageSet set = exist.Count == 0 ? CreateNewFileInfo(file, sha256) : await DoQuerySetAsync(((FileManageModel)exist[0]).InternalId);
            set.FileManage_SyncInfo.Add(new FileManage_SyncInfoModel()
            {
                InternalId = set.FileManage.InternalId,
                FileStatus = FileStatus.Pending,
                SrcIP = "",
                SrcNode = "Guest",
                SrcFullPath = file.FileName,
                DestIP = LibData.LocalhostIp,
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
        private static async Task DoStoreFileToSystem(IFormFile file, FileManageSet set)
        {
            if (file == null || file.Length == 0) return;
            if (!Directory.Exists(set.FileManage.Path)) Directory.CreateDirectory(set.FileManage.Path);
            var fileName = $"{set.FileManage.InternalId}.{set.FileManage.FileExtension}";
            var fullPath = Path.Combine(set.FileManage.Path, fileName);
            using var stream = new FileStream(fullPath, FileMode.Create);
            await file.CopyToAsync(stream);
        }
        /// <summary>
        /// 將檔案從暫存區移至正式區
        /// </summary>
        /// <param name="sets"></param>
        private async Task MoveFileFromTempToFinal(List<FileManageSet> sets)
        {
            DateTime today = DateTime.UtcNow;
            string dstPath = LibData.Merge("/", false, FilePath.Root, FilePath.Permanent, today.Year, today.Month, today.Day, ProgId);
            if (!Directory.Exists(dstPath)) Directory.CreateDirectory(dstPath);
            foreach (var set in sets)
            {
                if (set.FileManage.FileStatus != FileStatus.Pending) continue;
                var header = set.FileManage;
                var curSyncInfo = new FileManage_SyncInfoModel() { InternalId = set.FileManage.InternalId, FileStatus = FileStatus.Success };
                set.FileManage_SyncInfo.Add(curSyncInfo);
                string srcPath = header.Path;
                string srcFullPath = LibData.Merge("/", false, header.Path, $"{header.InternalId}.{header.FileExtension}");
                string dstFullPath = LibData.Merge("/", false, dstPath, $"{header.InternalId}.{header.FileExtension}");
                header.FileStatus = FileStatus.Success;
                header.Path = dstPath;
                curSyncInfo.SrcFullPath = srcFullPath;
                curSyncInfo.DestFullPath = dstFullPath;
                curSyncInfo.FileStatus = FileStatus.Success;
                curSyncInfo.SrcIP = LibData.LocalhostIp;
                curSyncInfo.SrcNode = Environment.MachineName;
                curSyncInfo.DestIP = LibData.LocalhostIp;
                curSyncInfo.DestNode = Environment.MachineName;
                if (File.Exists(srcFullPath)) File.Move(srcFullPath, dstFullPath);
                else
                {
                    header.FileStatus = FileStatus.Pending;
                    header.Path = srcPath;
                    curSyncInfo.FileStatus = FileStatus.Failed;
                    curSyncInfo.ErrorMessage = "找不到檔案可移動。";
                }
                await this.BizUpdateSetAsync(header.InternalId, set);
            }
        }
        /// <summary>
        /// 將檔案從暫存區刪除
        /// </summary>
        /// <param name="sets"></param>
        private async Task DeleteFromTemp(List<FileManageSet> sets)
        {
            foreach (var set in sets)
            {
                if (set.FileManage.FileStatus != FileStatus.Pending) continue;
                var header = set.FileManage;
                var curSyncInfo = new FileManage_SyncInfoModel() { InternalId = set.FileManage.InternalId, FileStatus = FileStatus.Canceled };
                set.FileManage_SyncInfo.Add(curSyncInfo);
                string srcPath = header.Path;
                string srcFullPath = LibData.Merge("/", false, header.Path, $"{header.InternalId}.{header.FileExtension}");
                string dstFullPath = string.Empty;
                header.FileStatus = FileStatus.Success;
                header.Path = string.Empty;
                curSyncInfo.SrcFullPath = srcFullPath;
                curSyncInfo.DestFullPath = dstFullPath;
                curSyncInfo.FileStatus = FileStatus.Success;
                curSyncInfo.SrcIP = LibData.LocalhostIp;
                curSyncInfo.SrcNode = Environment.MachineName;
                curSyncInfo.DestIP = LibData.LocalhostIp;
                curSyncInfo.DestNode = Environment.MachineName;
                if (File.Exists(srcFullPath)) File.Delete(srcFullPath);
                else
                {
                    header.FileStatus = FileStatus.None;
                    header.Path = srcPath;
                    curSyncInfo.FileStatus = FileStatus.Failed;
                    curSyncInfo.ErrorMessage = "找不到檔案可刪除。";
                }
                await this.BizUpdateSetAsync(header.InternalId, set);
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
        private  bool CheckFileExtension(FileManageModel filemanage, FileManage_SyncInfoModel syncInfo)
        {
            if (!CheckExtension(filemanage.FileExtension))
            {
                filemanage.FileStatus = FileStatus.Failed;
                syncInfo.FileStatus = FileStatus.Failed;
                syncInfo.ErrorCode = SysMessageCode.BECode00023;
                syncInfo.ErrorMessage = ResxMsg.Msg(SysMessageCode.BECode00023, filemanage.FileExtension);
                return false;
            }
            if (!CheckMimeType(filemanage.MimeType))
            {
                filemanage.FileStatus = FileStatus.Failed;
                syncInfo.FileStatus = FileStatus.Failed;
                syncInfo.ErrorCode = SysMessageCode.BECode00022;
                syncInfo.ErrorMessage = ResxMsg.Msg(SysMessageCode.BECode00022, filemanage.MimeType);
                return false;
            }
            return true;
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="file"></param>
        /// <param name="set"></param>
        /// <returns></returns>
        private bool CheckFileSize(FileManageModel filemanage, FileManage_SyncInfoModel syncInfo)
        {
            const int mb = 20;
            const long maxFileSize = mb * 1024 * 1024;
            if (filemanage.FileSize > maxFileSize)
            {
                syncInfo.ErrorCode = SysMessageCode.BECode00024;
                syncInfo.ErrorMessage = ResxMsg.Msg(SysMessageCode.BECode00024,mb);
                return false;
            }
            return true;
        }
        /// <summary>
        /// 檢查檔案是否已存在
        /// </summary>
        /// <param name="set"></param>
        /// <returns></returns>
        private bool CheckFileExist(FileManageModel filemanage, FileManage_SyncInfoModel syncInfo)
        {
            string fullPath = Path.Combine(filemanage.Path, $"{filemanage.InternalId}.{filemanage.FileExtension}");
            if (filemanage.FileStatus.In(FileStatus.Pending, FileStatus.Success) || File.Exists(fullPath))
            {
                syncInfo.FileStatus = FileStatus.Skipped;
                return true;
            }
            return false;
        }
        /// <summary>
        /// 檢查副檔名是否合法
        /// </summary>
        /// <param name="fileType"></param>
        /// <returns></returns>
        private static bool CheckExtension(string fileType)
        {
            string[] checkList = [
                #region 文字檔案
                FileExtensions.PDF,
                FileExtensions.DOCX,
                FileExtensions.XLSX,
                FileExtensions.PPTX,
                FileExtensions.TXT,
                FileExtensions.CSV,
                FileExtensions.ODT,
                #endregion
                #region 圖片
                FileExtensions.JPG,
                FileExtensions.JPEG,
                FileExtensions.PNG,
                FileExtensions.GIF,
                FileExtensions.BMP,
                FileExtensions.WEBP,
                FileExtensions.SVG ,
                #endregion
                #region 壓縮檔案
                FileExtensions.ZIP,
                FileExtensions.RAR,
                FileExtensions._7Z ,
                #endregion
                #region 影音
                FileExtensions.MP3,
                FileExtensions.WAV,
                FileExtensions.MP4,
                FileExtensions.MOV,
                FileExtensions.MKV,
                #endregion
            ];


            return checkList.Contains(fileType.ToLowerInvariant());
        }
        /// <summary>
        /// 檢查網際網路媒體類型是否合法
        /// </summary>
        /// <param name="mimeType"></param>
        /// <returns></returns>
        private static bool CheckMimeType(string fileType)
        {
            string[] checkList = [
                MimeTypes.APPLICATION_PDF,
                MimeTypes.APPLICATION_MSWORD,
                MimeTypes.APPLICATION_VND_OPENXML_WORD ,
                MimeTypes.APPLICATION_VND_EXCEL         ,
                MimeTypes.APPLICATION_VND_OPENXML_EXCEL ,
                MimeTypes.APPLICATION_VND_POWERPOINT ,
                MimeTypes.APPLICATION_ODT,
                MimeTypes.APPLICATION_VND_OPENXML_POWERPOINT ,
                MimeTypes.TEXT_PLAIN ,
                MimeTypes.TEXT_CSV ,
                MimeTypes.IMAGE_JPEG,
                MimeTypes.IMAGE_PNG ,
                MimeTypes.IMAGE_GIF ,
                MimeTypes.IMAGE_BMP ,
                MimeTypes.IMAGE_WEBP ,
                MimeTypes.IMAGE_SVG_XML,
                MimeTypes.APPLICATION_ZIP,
                MimeTypes.APPLICATION_VND_RAR ,
                MimeTypes.APPLICATION_X_7Z_COMPRESSED ,
                MimeTypes.AUDIO_MPEG,
                MimeTypes.AUDIO_WAV,
                MimeTypes.VIDEO_MP4,
                MimeTypes.VIDEO_QUICKTIME];
            return checkList.Contains(fileType.ToLowerInvariant());
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
            Dictionary<string, FileManageSet> setDic = [];//Key為Sha256
            foreach (var entry in archive.Entries.Where(e => !e.IsDirectory))
            {
                if (Path.GetFileNameWithoutExtension(entry.Key).ToLowerInvariant().Equals("thumbs")) continue;
                var fullPath = LibData.Merge("/", false, extractToFolder, entry.Key);
                Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
                using var entryStream = entry.OpenEntryStream();
                using var memoryStream = new MemoryStream();
                await entryStream.CopyToAsync(memoryStream);
                memoryStream.Position = 0;
                string fileSha256 = LibData.GetFileSHA256(memoryStream);
                FileStatus status = FileStatus.Skipped;
                if (!setDic.TryGetValue(fileSha256, out FileManageSet? set))
                {
                    string internalId = Guid.NewGuid().ToString();
                    string ext = LibData.GetFileExtenstion(memoryStream);
                    string mimeType = LibData.GetFileMimeType(memoryStream);
                    string destPath = LibData.Merge("/", false, Path.GetDirectoryName(fullPath), $"{internalId}.{ext}");
                    using var outStream = File.Create(destPath);
                    memoryStream.Position = 0;
                    await memoryStream.CopyToAsync(outStream);
                    outStream.Close();
                    status = FileStatus.Success;
                    var fileInfo = new FileInfo(destPath);
                    long fileSize = fileInfo.Length;
                    set = new FileManageSet()
                    {
                        FileManage = new FileManageModel()
                        {
                            InternalId = internalId,
                            Path = Path.GetDirectoryName(fullPath).Replace("\\", "/"),
                            FileName = Path.GetFileNameWithoutExtension(entry.Key),
                            FileExtension = ext,
                            FileDescription = Path.GetFileNameWithoutExtension(entry.Key),
                            ProgId = string.Empty,
                            MimeType = mimeType,
                            FileSHA256 = fileSha256,
                            FileSize = fileSize,
                            ImportLabel = label,
                            FileStatus = FileStatus.Success,
                            IsIniData = true,
                        },
                    };
                    setDic.Add(fileSha256, set);
                }
                set.FileManage_SyncInfo.Add(new FileManage_SyncInfoModel()
                {
                    InternalId = set.FileManage.InternalId,
                    FileStatus = status,
                    SrcIP = LibData.LocalhostIp,
                    SrcNode = Environment.MachineName,
                    SrcFullPath = entry.Key,
                    DestIP = LibData.LocalhostIp,
                    DestNode = Environment.MachineName,
                    DestFullPath = LibData.Merge("/", false, set.FileManage.Path, $"{set.FileManage.InternalId}.{set.FileManage.FileExtension}")
                });
            }
            foreach (var set in setDic.Values) await this.BizCreateSetAsync(set);
        }

        #endregion
    }
}
