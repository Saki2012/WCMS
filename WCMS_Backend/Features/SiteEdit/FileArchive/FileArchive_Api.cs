using Microsoft.AspNetCore.Mvc;
using System.Data;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SiteEdit.FileArchive
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class FileArchiveController : ApiDataController<FileArchiveSet>
    {

        #region Migration Old Data
        [HttpPost(nameof(Migrate)), LocalhostOnly]
        public async Task<IActionResult> Migrate(CancellationToken ct, string importFileLabel = "1810")
        {
            FileArchiveSet[] datas = await ConvertToApiModel(importFileLabel);
            return await InitialCreateData(datas, ct);
        }
        private async Task<FileArchiveSet[]> ConvertToApiModel(string importFileLabel)
        {
            List<FileArchiveSet> result = [];

            Dictionary<string, string> sqls = new()
            {
                { "Archive", "Select * From Archive" },
                { "Archive_Lang", "Select * From Archive_Lang" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);

            var importFileInternalIds = await FileService.QueryListAsync([nameof(FileManageModel.InternalId)], $"{nameof(FileManageModel.ImportLabel)} = {importFileLabel}", 0, 0);
            List<FileManageSet> fileSets = [];
            foreach (var id in importFileInternalIds.Data.Select(p => p.FileManage.InternalId).ToList().Distinct())
            {
                var data = await FileService.QuerySetAsync(id);
                fileSets.Add(data.Data.LastOrDefault());
            }
            var fileSrcIdDic = fileSets.SelectMany(s => s.FileManage_SyncInfo).GroupBy(d => d.SrcFullPath).ToDictionary(g => g.Key, g => g.First().InternalId);
            List<FileManageSet> updateFileSets = [];

            foreach (DataRow srcHeader in ds.Tables["Archive"].Rows)
            {
                FileArchiveSet set = new()
                {
                    FileArchive = new FileArchive()
                    {
                        FileArchiveId = srcHeader["Sn"].ToString(),
                        CategoriesId = srcHeader["Category"].ToString(),
                        TagsId = srcHeader["Tag"].ToString(),
                        ContentStatus = GetContentStatus(srcHeader["Status"].ToString()),
                        IsIniData = true,
                    }
                };

                int rowId = 1;
                ds.Tables["Archive_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.FileArchive.FileArchiveId).ToList().ForEach(dRow =>
                {
                    if (!dRow["Title"].IsNullOrEmpty())
                    {
                        set.FileArchiveInfo.Add(new FileArchiveInfo()
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
                                set.FileArchiveDetail.Add(new FileArchiveDetail()
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
                await FileService.UpdateSetAsync(set.FileManage.InternalId, set);
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
}
