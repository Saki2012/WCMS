using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Data;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SiteEdit.FileArchive
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class FileArchiveController : ApiDataController<FileArchiveSet, FileArchiveSet_DTO>
    {

        #region Migration Old Data
        [HttpPost(nameof(Migrate)), LocalhostOnly]
        public async Task<IActionResult> Migrate(CancellationToken ct, string importFileLabel = "1810")
        {
            FileArchiveSet_DTO[] datas = await ConvertToApiModel(importFileLabel);
            return await InitialCreateData(datas, ct);
        }
        private async Task<FileArchiveSet_DTO[]> ConvertToApiModel(string importFileLabel)
        {
            List<FileArchiveSet_DTO> result = [];

            Dictionary<string, string> sqls = new()
            {
                { "Archive", "Select * From Archive" },
                { "Archive_Lang", "Select * From Archive_Lang" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);

            var importFileInternalIds = await FileService.BizQueryListAsync([nameof(FileManageModel.InternalId)], $"{nameof(FileManageModel.ImportLabel)} = {importFileLabel}", 0, 0);
            List<FileManageSet> fileSets = [];
            foreach (var id in importFileInternalIds.Select(p => p.FileManage.InternalId).ToList().Distinct())
            {
                var data = await FileService.BizQuerySetAsync(id);
                fileSets.Add(data);
            }
            var fileSrcIdDic = fileSets.SelectMany(s => s.FileManage_SyncInfo).GroupBy(d => d.SrcFullPath).ToDictionary(g => g.Key, g => g.First().InternalId);
            List<FileManageSet> updateFileSets = [];

            foreach (DataRow srcHeader in ds.Tables["Archive"].Rows)
            {
                FileArchiveSet_DTO set = new()
                {
                    FileArchive = new FileArchive_DTO()
                    {
                        FileArchiveId = srcHeader["Sn"].ToString(),
                        CategoriesId = srcHeader["Category"].ToString(),
                        TagsId = srcHeader["Tag"].ToString(),
                        ContentStatus = GetContentStatus(srcHeader["Status"].ToString()),
                    }
                };

                int rowId = 1;
                ds.Tables["Archive_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.FileArchive.FileArchiveId).ToList().ForEach(dRow =>
                {
                    if (!dRow["Title"].IsNullOrEmpty())
                    {
                        set.FileArchiveInfo.Add(new FileArchiveInfo_DTO()
                        {
                            FileArchiveId = set.FileArchive.FileArchiveId,
                            RowId = rowId,
                            Lang = dRow["Lang"].ToString(),
                            Title = dRow["Title"].ToString(),
                        });

                        for(int i = 1; i < 10; i++)
                        {
                            string subFileName = dRow[$"Filename{i}"].ToString();
                            string subFileRName = dRow[$"File{i}"].ToString();
                            if (!subFileName.IsNullOrEmpty() && !subFileRName.IsNullOrEmpty())
                            {
                                FileManageSet fileSet = GetSetByPicture(subFileRName, fileSets);
                                updateFileSets.Add(fileSet);
                                fileSet.FileManage.FileName = subFileName;
                                fileSet.FileManage.FileDescription = subFileName;
                                set.FileArchiveDetail.Add(new FileArchiveDetail_DTO()
                                {
                                    FileArchiveId = set.FileArchive.FileArchiveId,
                                    ParentRowId = rowId,
                                    RowId = i,
                                    FileSrcId = fileSet.FileManage.InternalId,
                                    FileName = subFileName,
                                });
                            }
                        }
                        rowId++;
                    }
                });
                result.Add(set);
            }
            foreach (var set in updateFileSets.Distinct())
            {
                set.FileManage.ProgId = this.Service.ProgId;
                await FileService.BizUpdateSetAsync(set.FileManage.InternalId, set);
            }
            return [.. result];
        }
        private static ContentStatus GetContentStatus(string status)
        {
            ContentStatus result = ContentStatus.None;
            foreach (string s in status.Split(','))
            {
                switch (s.Trim().ToLower())
                {
                    case "hide":
                        result |= ContentStatus.Hidden;
                        break;
                    case "hot":
                        result |= ContentStatus.Hot;
                        break;
                    case "top":
                        result |= ContentStatus.Top;
                        break;
                }
            }
            return result;
        }
        private static FileManageSet GetSetByPicture(string srcPic, List<FileManageSet> fileSets)
        {
            return fileSets.Where(x => x.FileManage_SyncInfo.Any(y => y.SrcFullPath.ToLowerInvariant().Equals($@"File/Archive/{srcPic}".ToLowerInvariant()))).FirstOrDefault();
        }
        #endregion
    }

    public class FileArchiveSet_DTO :ITSet_DTO
    {
        public FileArchive_DTO FileArchive { get; set; } = new ();
        public List<FileArchiveInfo_DTO> FileArchiveInfo { get; set; } = [];
        public List<FileArchiveDetail_DTO> FileArchiveDetail { get; set; } = [];
    }
    public class FileArchive_DTO : DTOBasicDataModel
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc, Required, Key] public string FileArchiveId { get; set; }
        /// <summary>
        /// 狀態:置頂/熱門/隱藏
        /// </summary>
        [LibDesc] public ContentStatus ContentStatus { get; set; }
        /// <summary>
        /// 類別ID(多個)
        /// </summary>
        [LibDesc, Required] public string CategoriesId { get; set; }
        /// <summary>
        /// 標籤ID(多個)
        /// </summary>
        [LibDesc, Required] public string TagsId { get; set; }

        #region 關聯
        public virtual List<FileArchiveInfo_DTO> FileArchiveInfo { get; set; } = [];
        #endregion
    }
    public class FileArchiveInfo_DTO
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc, Required, Key] public string FileArchiveId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc, Key] public int RowId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc] public string Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        public string Title { get; set; }
        public virtual List<FileArchiveDetail_DTO> FileArchiveDetail { get; set; } = [];
    }
    /* 不確定這張表該關聯Header還是Info，待討論 */
    public class FileArchiveDetail_DTO
    {
        /// <summary>
        /// 靜態客製頁面ID
        /// </summary>
        [LibDesc, Required, Key] public string FileArchiveId { get; set; }
        /// <summary>
        /// 父行主鍵 (FileArchiveInfo)
        /// </summary>
        [LibDesc, Key] public int ParentRowId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc, Key] public int RowId { get; set; }
        /// <summary>
        /// 檔案來源
        /// </summary>
        [LibDesc] public string FileSrcId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc] public string FileName { get; set; }
    }
}
