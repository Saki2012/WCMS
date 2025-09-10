using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Runtime.InteropServices;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SiteEdit.FileArchive
{
    [ProgId("FileArchive")]
    public class FileArchiveBiz(IRepositoryMapProvider repoMapProvider, IErrorHelper message) : BizService<FileArchiveSet>(repoMapProvider, message), IBizService<FileArchiveSet> {

        #region Migration Old Data
        public async Task Migrate(string importFileLabel = "1810", IList<FileManageSet> srcFileSets = default)
        {
            FileArchiveSet[] datas = ConvertToApiModel(importFileLabel,srcFileSets);
            await BizInitCreateSetsAsync(datas);
        }
        private FileArchiveSet[] ConvertToApiModel(string importFileLabel, IList<FileManageSet> srcFileSets = default)
        {
            List<FileArchiveSet> result = [];
            Dictionary<string, string> sqls = new()
            {
                { "Archive", "Select * From Archive" },
                { "Archive_Lang", "Select * From Archive_Lang" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);
            var fileSrcIdDic = srcFileSets.SelectMany(s => s.FileManage_SyncInfo).GroupBy(d => d.SrcFullPath).ToDictionary(g => g.Key, g => g.First().InternalId);
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
                        CreateTime = srcHeader["CreateTime"].ToString().ToDateTime(),
                        ModifyTime = srcHeader["UpdateTime"].ToString().ToDateTime(),
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

                        for (int i = 1; i < 10; i++)
                        {
                            string subFileName = dRow[$"Filename{i}"].ToString();
                            string subFileRName = dRow[$"File{i}"].ToString();
                            if (!subFileName.IsNullOrEmpty() && !subFileRName.IsNullOrEmpty())
                            {
                                FileManageSet fileSet = GetSetByPicture(subFileRName, srcFileSets);
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
            foreach (var set in updateFileSets.Distinct()) { set.FileManage.ProgId = ProgId; }
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
        private static FileManageSet GetSetByPicture(string srcPic, IList<FileManageSet> fileSets)
        {
            return fileSets.Where(x => x.FileManage_SyncInfo.Any(y => y.SrcFullPath.ToLowerInvariant().Equals($@"File/Archive/{srcPic}".ToLowerInvariant()))).FirstOrDefault();
        }
        #endregion

        #region Protected
        protected override void BeforeUpdate(FileArchiveSet set, SysEnum.FuncAction act)
        {
            base.BeforeUpdate(set, act);
            switch (act)
            {
                case SysEnum.FuncAction.Create:
                case SysEnum.FuncAction.Update:
                    DoRemergeData(set.FileArchive);
                    break;
            }
        }
        #endregion

        #region Private
        /// <summary>
        /// 重新組合多筆資料(類別、狀態、標籤)
        /// </summary>
        /// <param name="header"></param>
        private static void DoRemergeData(FileArchive header)
        {
            header.CategoriesId = header.CategoriesId.Remerge(",");
            header.TagsId = header.TagsId.Remerge(",");
        }
        #endregion
    }
}
