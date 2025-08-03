using GraphQL;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi.Extensions;
using MimeDetective;
using MimeDetective.Engine;
using MimeDetective.Storage;
using NetTopologySuite.Geometries;
using RTools_NTS.Util;
using System.Net;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using static System.Runtime.InteropServices.JavaScript.JSType;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SysSetting.FileManagement
{
    [ProgId("FileManagement")]
    public class FileManagementBiz(IRepositoryMapProvider repoMapProvider) : BizService<FileManagementSet>(repoMapProvider), IBizService<FileManagementSet>
    {
        #region Public
        /// <summary>
        /// 暫時上傳，放至暫存區
        /// </summary>
        /// <param name="file"></param>
        public async void UploadTemp(IFormFile file)
        {
            string sha256 = GetFileSHA256(file);
            FileManagementSet set = CreateNewFileInfo(file);
            //if (!CheckSHA256(file,out set)) { }

            if (CheckFileLegal(file, set))
            {
                DoStoreFileToSystem(file, set);
            }
        }
        /// <summary>
        /// 確定保存，移至正式區
        /// </summary>
        /// <param name="internalIds"></param>
        public async void MoveToPermanent(string[] internalIds)
        {
            List<FileManagementSet> sets = [];
            foreach (string id in internalIds) sets.Add(await this.DoQuerySetAsync(id));
            MoveFileFromTempToFinal(sets);
        }
        /// <summary>
        /// 下載檔案
        /// </summary>
        /// <param name="internalIds"></param>
        public async void DownloadFile(string[] internalIds)
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

                Dictionary<string,string> files = new Dictionary<string,string>();
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
        /// <summary>
        /// 移除暫存區的檔案
        /// </summary>
        /// <param name="internalIds"></param>
        public async void RemovePendingFile(string[] internalIds)
        {
            foreach (var internalId in internalIds)
            {
                //要移除的是tmp，所以要找的是還在Pending狀態的
                //刪除內部檔案，以及設定Status=Deleted
                //添加Sync資訊為Cancel
                //檢查Sha時，要略過狀態為Deleted的，
            }
        }
        /// <summary>
        /// 同步檔案
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
        private FileManagementSet CreateNewFileInfo(IFormFile file)
        {
            DateTime today = DateTime.UtcNow;
            string internalId = new Guid().ToString();
            FileManagementSet set = new()
            {
                FileManagement = new()
                {
                    InternalId = internalId,
                    ProgId = "",
                    Path = LibData.Merge("/", false, "/PendingFiles", today.Year, today.Month, today.Day, ProgId),
                    FileName = file.FileName,
                    FileDescription = file.FileName,
                    MimeType = file.ContentType.ToString(),
                    FileSHA256 = "",
                    FileSize = file.Length
                },
                FileInfoSync = [new()
                {
                    InternalId=internalId,
                    FileStatus=FileStatus.Pending,
                    SrcIP="",
                    SrcNode="Guest",
                    SrcFullPath=file.FileName,
                    DestIP= Dns.GetHostName().ToString(),
                    DestNode = Environment.MachineName,
                    DestFullPath = "",
                } ]
            };
            return set;
        }
        /// <summary>
        /// 檢查檔案是否合法上傳
        /// </summary>
        /// <param name="file"></param>
        /// <param name="set"></param>
        /// <returns></returns>
        private bool CheckFileLegal(IFormFile file, FileManagementSet set)
        {
            if (file == null || file.Length == 0) return false;
            if (!CheckFileExtension(file, set)) return false;
            if (!CheckFileSize(file, set)) return false;
            return true;
        }

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
        private bool CheckSHA256(string sha256,out FileManagementSet set) 
        {
            set = null;
            //var exist = Task(this.DoQueryListAsync(typeof(FileManagementModel), [nameof(set.FileManagement.InternalId)],
            //    $@"{nameof(set.FileManagement.FileSHA256)}={sha256} And FileStatus In (1,2)", 0, 0));//Pending或已存在
            //if(exist.Count==0)
            //{

            //    return true;
            //}
            //else
            //{
            //    set = Task(this.DoQuerySetAsync(((FileManagementModel)exist[0]).InternalId));
            //    set.FileInfoSync.Add(new FileInfoSyncModel()
            //    {
            //        InternalId = exist[0].InternalId,
            //        FileStatus = FileStatus.Skipped,
                    
            //    });

                    return false;
            //}
        }


        /// <summary>
        /// 存入系統
        /// </summary>
        /// <param name="file"></param>
        /// <param name="set"></param>
        private async void DoStoreFileToSystem(IFormFile file, FileManagementSet set)
        {
            if (file == null || file.Length == 0) return;
            var tempFolder = Path.Combine(Directory.GetCurrentDirectory(), set.FileManagement.Path);
            if (!Directory.Exists(tempFolder))Directory.CreateDirectory(tempFolder);
            // 產生唯一檔名（也可改用 InternalId 或 SHA256）
            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            var fullPath = Path.Combine(tempFolder, fileName);
            // 寫入檔案
            using var stream = new FileStream(fullPath, FileMode.Create);
            await file.CopyToAsync(stream);



        }
        /// <summary>
        /// 將檔案從暫存區移至正式區
        /// </summary>
        /// <param name="sets"></param>
        private void MoveFileFromTempToFinal(List<FileManagementSet> sets)
        {
            DateTime today = DateTime.UtcNow;
            foreach (var set in sets)
            {
                string srcFullPath = Path.Combine(set.FileManagement.Path, set.FileManagement.InternalId);
                string dstFullPath = LibData.Merge("/", false, "/Permanent", today.Year, today.Month, today.Day, ProgId, set.FileManagement.InternalId);
                var curSyncInfo = new FileInfoSyncModel()
                {
                    InternalId = set.FileManagement.InternalId,
                    FileStatus = FileStatus.Success,
                    SrcFullPath = srcFullPath,
                    DestFullPath = dstFullPath,
                };
                set.FileInfoSync.Add(curSyncInfo);
                File.Move(srcFullPath, dstFullPath);
                //如果失敗，status改為failed，並添加錯誤訊息
                curSyncInfo.FileStatus = FileStatus.Failed;
                curSyncInfo.ErrorMessage = "";
            }
        }
        /// <summary>
        /// 紀錄下載資訊
        /// </summary>
        /// <param name="intenralId"></param>
        private void SetDowloadInfo(string intenralId)
        {

        }


        private static bool CheckFileExtension(IFormFile file, FileManagementSet set)
        {
            var inspector = new ContentInspectorBuilder() { Definitions = MimeDetective.Definitions.DefaultDefinitions.All() }.Build();
            using var stream = file.OpenReadStream();
            FileType fileType = inspector.Inspect(stream).FirstOrDefault().Definition.File;
            if (fileType != null)
            {
                if (!CheckExtension(fileType))
                {
                    set.FileInfoSync.FirstOrDefault().ErrorMessage = $"實際的檔案格式為:{fileType.Extensions.FirstOrDefault().ToLowerInvariant()}，不允許上傳";
                    return false;
                }
                if (!CheckMimeType(fileType))
                {
                    set.FileInfoSync.FirstOrDefault().ErrorMessage = $"實際的網際網路媒體類型為:{fileType.MimeType.ToLowerInvariant()}，不允許上傳";
                    return false;
                }
            }
            return true;
        }
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
        #endregion
    }
}
