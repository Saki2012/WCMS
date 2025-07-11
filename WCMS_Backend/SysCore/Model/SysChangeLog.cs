using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using static WCMS.SysCore.Enum.SysEnum;
using System.Reflection;
using WCMS.SysCore.Library;
using System.ComponentModel.DataAnnotations;

namespace WCMS.SysCore.Model
{
    /// <summary>
    /// 資料變更日誌系統
    /// </summary>
    public class SysChangeLog
    {
        #region Property
        private readonly DataChangeLogSet ChangeLogSet = new DataChangeLogSet() { DataChangeLog = new DataChangeLog(), DataChangeLogDetail = new List<DataChangeLogDetail>() };
        private readonly DbSet<DataChangeLog> DataChangeLog;
        private readonly DbSet<DataChangeLogDetail> DataChangeLogDetail;
        #endregion

        #region Construct
        public SysChangeLog(ApplicationDbContext dataAccess)
        {
            DataChangeLog = dataAccess.DataChangeLog;
            DataChangeLogDetail = dataAccess.DataChangeLogDetail;
        }
        #endregion

        #region Public
        /// <summary>
        /// 設置變更日誌內容
        /// </summary>
        /// <param name="progId"></param>
        /// <param name="internalId"></param>
        /// <param name="userId"></param>
        public void SetChangeLog(string progId, string internalId, string userId)
        {
            return;
            var datachangeLog = DataChangeLog.OrderByDescending(p => p.DataChangeId).FirstOrDefault();
            long id = null == datachangeLog ? 0 : datachangeLog.DataChangeId;
            ChangeLogSet.DataChangeLog.DataChangeId = ++id;
            ChangeLogSet.DataChangeLog.InternalId = internalId;
            ChangeLogSet.DataChangeLog.ProgId = progId;
            ChangeLogSet.DataChangeLog.UserId = userId;
            ChangeLogSet.DataChangeLog.DataChangeTime = DateTime.Now;
        }
        /// <summary>
        /// 設置變更日誌內容
        /// </summary>
        /// <param name="tbIdx"></param>
        /// <param name="oldModel"></param>
        /// <param name="newModel"></param>
        public void SetChangeLogDetail(int tbIdx, dynamic oldModel, dynamic newModel, RowState rowState)
        {
            return;
            DataChangeLogDetail.Add(new DataChangeLogDetail() { DataChangeId = ChangeLogSet.DataChangeLog.DataChangeId, TableIndex = tbIdx, RowState = rowState, ChangeData = GetChangeData(tbIdx, oldModel, newModel, rowState) });
        }
        /// <summary>
        /// 
        /// </summary>
        public Dictionary<int, string> GetGetChangeLogDetail(long Id)
        {
            Dictionary<int, string> result = new Dictionary<int, string>();
            List<DataChangeLogDetail> lst = DataChangeLogDetail.Where(p => p.DataChangeId == Id) as List<DataChangeLogDetail>;
            foreach (var data in lst)
            {
                //result.Add(data.TableIndex, DecompressJsonVal(data.ChangeData));
            }
            return result;
        }
        /// <summary>
        /// 獲取變更日誌列表
        /// </summary>
        /// <param name="internalId"></param>
        /// <returns></returns>
        public static List<DataChangeLog> GetChangeLogList(DbSet<DataChangeLog> dataChangeLog, string internalId)
        {
            return dataChangeLog.Where(p => p.InternalId == internalId) as List<DataChangeLog>;
        }
        /// <summary>
        /// 當表單刪除時，移除該表單變更日誌
        /// </summary>
        /// <param name="internalId"></param>
        public void RemoveChangeLog(string internalId)
        {
            DataChangeLog.RemoveRange(DataChangeLog.Where(p => p.InternalId == internalId));
        }
        /// <summary>
        /// 新增變更日誌
        /// </summary>
        public void SaveChangeLog()
        {
            return;
            DataChangeLog.Add(ChangeLogSet.DataChangeLog);
            DataChangeLogDetail.AddRange(ChangeLogSet.DataChangeLogDetail);
        }
        #endregion

        #region Private
        /// <summary>
        /// 獲取變更資料
        /// </summary>
        /// <param name="oldModel"></param>
        /// <param name="newModel"></param>
        /// <returns></returns>
        private byte[] GetChangeData(int tbIdx, dynamic oldModel, dynamic newModel, RowState rowState)
        {
            Dictionary<string, object[]> changeFieldsDic = GetChangeDataDic(tbIdx, oldModel, newModel, rowState);
            string json = JsonConvert.SerializeObject(changeFieldsDic);
            //return CompressJsonVal(json);
            return null;
        }
        /// <summary>
        /// 獲取變更資料
        /// </summary>
        /// <param name="oldModel"></param>
        /// <param name="newModel"></param>
        /// <returns></returns>
        private Dictionary<string, object[]> GetChangeDataDic(int tbIdx, dynamic oldModel, dynamic newModel, RowState rowState)
        {
            Dictionary<string, object[]> result = new Dictionary<string, object[]>();
            PropertyInfo[] infos = oldModel is null ? newModel.GetType().GetProperties() : oldModel.GetType().GetProperties();
            foreach (PropertyInfo info in infos)
            {
                if (!info.PropertyType.IsSealed) continue;
                switch (rowState)
                {
                    case RowState.Insert:
                        //result.Add(info.Name, new object[] { null, ModelReflects[tbIdx].GetValue(newModel, info.Name) });
                        break;
                    case RowState.Update:
                        //result.Add(info.Name, new object[] { ModelReflects[tbIdx].GetValue(oldModel, info.Name), ModelReflects[tbIdx].GetValue(newModel, info.Name) });
                        break;
                    case RowState.Delete:
                        //result.Add(info.Name, new object[] { ModelReflects[tbIdx].GetValue(oldModel, info.Name), null });
                        break;
                }
            }
            return result;
        }
        ///// <summary>
        ///// 壓縮
        ///// </summary>
        ///// <param name="json"></param>
        ///// <returns></returns>
        //private byte[] CompressJsonVal(string json)
        //{
        //    string compressString = LibCompress.GZipCompressString(json);
        //    byte[] bytes = LibCompress.ConvertStringToBytes(compressString);
        //    return LibCompress.Compress(bytes);
        //}
        ///// <summary>
        ///// 解壓縮
        ///// </summary>
        ///// <param name="compressJson"></param>
        ///// <returns></returns>
        //private string DecompressJsonVal(byte[] compressJson)
        //{
        //    byte[] decompress = LibCompress.Decompress(compressJson);
        //    string str = LibCompress.ConvertBytesToString(decompress);
        //    return LibCompress.GZipDecompressString(str);
        //}
        #endregion
    }

    public class SysChangeModel
    {
        /// <summary>
        /// 每個功能單的唯一Id
        /// </summary>
        [Key] public Guid InternalId { get; set; }
        /// <summary>
        /// 修改版本
        /// </summary>
        [Key] public int Version { get; set; }              
        /// <summary>
        /// 功能Id
        /// </summary>
        public string ProgId { get; set; }
        /// <summary>
        /// 變更方式(新增/修改/刪除)
        /// </summary>
        public string OperationType { get; set; }
        /// <summary>
        /// 該功能表單主鍵(不一定唯一，找InternalId為準)
        /// </summary>
        public string PrimaryKeyValue { get; set; }
        /// <summary>
        /// 修改前/刪除前完整的資料格式 (
        /// 壓縮過的json格式
        /// </summary>
        public byte[] BeforeData { get; set; }// 壓縮 JSON
        /// <summary>
        /// 新增後/修改後完整的資料格式
        /// 壓縮過的json格式
        /// </summary>
        public byte[] AfterData { get; set; }// 壓縮 JSON
        /// <summary>
        /// 修改人員
        /// </summary>
        public string ModifyUserId { get; set; }
        /// <summary>
        /// 修改時間
        /// </summary>
        public DateTime ModifyTime { get; set; }
    }
}
