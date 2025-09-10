using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Data;
using System.Runtime.InteropServices;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecUSR
{
    [ProgId("SpecUSR")]
    public class SpecUSRBiz(IRepositoryMapProvider repo, IErrorHelper message) : BizService<SpecUSRSet>(repo, message), IBizService<SpecUSRSet> 
    {
        #region Migration Old Data
        [HttpPost(nameof(Migrate)), LocalhostOnly]
        public async Task Migrate(string importFileLabel = "1810", IList<FileManageSet> srcFileSets=default)
        {
            SpecUSRSet[] datas = await ConvertToApiModel(importFileLabel, srcFileSets);
            await BizInitCreateSetsAsync(datas);
        }
        private async Task<SpecUSRSet[]> ConvertToApiModel(string importFileLabel, IList<FileManageSet> srcFileSets)
        {
            List<SpecUSRSet> result = [];
            Dictionary<string, string> sqls = new()
            {
                { "USRProject", "SELECT * FROM USRProject" },
                { "USRProject_Lang", "SELECT * FROM USRProject_Lang" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);
            
            var fileSrcIdDic = srcFileSets.SelectMany(s => s.FileManage_SyncInfo).GroupBy(d => d.SrcFullPath).ToDictionary(g => g.Key, g => g.First().InternalId);
            List<FileManageSet> updateFileSets = [];

            foreach (DataRow row in ds.Tables["USRProject"].Rows)
            {
                SpecUSRSet set = new() { };
                result.Add(set);
                set.SpecUSR.USRId = row["Sn"].ToString();
                set.SpecUSR.CategoryId = $"USR_{row["Category"]}";
                set.SpecUSR.ContentStatus = GetContentStatus(row["Status"].ToString());
                set.SpecUSR.Tags = row["Tag"].ToString();
                set.SpecUSR.CreateTime= row["CreateTime"].ToString().ToDateTime();
                set.SpecUSR.ModifyTime= row["UpdateTime"].ToString().ToDateTime();
                string picFileName = row["Pic"].ToString();
                string picDescription = row["PicDescription"].ToString();
                if (!picFileName.IsNullOrEmpty())
                {
                    FileManageSet fileInfo = GetSetByPicture(picFileName, srcFileSets);
                    updateFileSets.Add(fileInfo);
                    fileInfo.FileManage.ProgId = ProgId;
                    fileInfo.FileManage.FileName = picFileName;
                    if (!picDescription.IsNullOrEmpty())
                    {
                        fileInfo.FileManage.FileDescription = picDescription;
                    }
                    picFileName = fileInfo.FileManage.InternalId;
                }
                set.SpecUSR.PictureId = picFileName;
                set.SpecUSR.PicDescription = picDescription;
                int rowId = 1;
                ds.Tables["USRProject_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.SpecUSR.USRId).ToList().ForEach(dRow =>
                {
                    SpecUSRDetail detail = new()
                    {
                        USRId = set.SpecUSR.USRId,
                        RowId = rowId++,
                        Lang = dRow["Lang"].ToString(),
                        Year = dRow["Year"].ToString(),
                        AcademicYear = dRow["AcademicYear"].ToString(),
                        Courses = dRow["Courses"].ToString(),
                        PracticeField = dRow["PracticeField"].ToString(),
                        ProjectName = dRow["ProjectName"].ToString(),
                        ExternalCooperationUnit = dRow["ExternalCooperationUnit"].ToString(),
                        Department = dRow["Department"].ToString(),
                        DuringExecution = dRow["DuringExecution"].ToString(),
                        PlanAmount = dRow["PlanAmount"].ToString(),
                        ExecutionStrategy = dRow["ExecutionStrategy"].ToString(),
                        ContentIntroduction = dRow["ContentIntroduction"].ToString(),
                        ProjectConcept = dRow["ProjectConcept"].ToString(),
                        ProjectHighlights = dRow["ProjectHighlights"].ToString(),
                        ProjectLeader = dRow["ProjectLeader"].ToString(),
                        Cohost1 = dRow["Cohost1"].ToString(),
                        Cohost2 = dRow["Cohost2"].ToString(),
                        Commissioned = dRow["Commissioned"].ToString(),
                        Remark = dRow["Remark"].ToString(),
                    };
                    set.SpecUSRDetail.Add(detail);
                });
            }
            foreach (var set in updateFileSets.Distinct())
            {
                set.FileManage.ProgId = ProgId;
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
        private static FileManageSet GetSetByPicture(string srcPic, IList<FileManageSet> fileSets)
        {
            return fileSets.Where(x => x.FileManage_SyncInfo.Any(y => y.SrcFullPath.ToLowerInvariant().Equals($@"File/USRProject/{srcPic}".ToLowerInvariant()))).FirstOrDefault();
        }
        #endregion

        #region Protected
        protected override void BeforeUpdate(SpecUSRSet set, SysEnum.FuncAction act)
        {
            base.BeforeUpdate(set, act);
            switch (act)
            {
                case SysEnum.FuncAction.Create:
                case SysEnum.FuncAction.Update:
                    DoRemergeData(set.SpecUSR);
                    break;
            }
        }
        #endregion

        #region Private
        /// <summary>
        /// 重新組合多筆資料(類別、狀態、標籤)
        /// </summary>
        /// <param name="header"></param>
        private static void DoRemergeData(SpecUSRModel header)
        {
            header.Tags = header.Tags.Remerge(",");
        }
        #endregion
    }
}
