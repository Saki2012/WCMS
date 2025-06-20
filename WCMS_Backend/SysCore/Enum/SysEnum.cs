using WCMS.SysCore.Library;
using System.ComponentModel;

namespace WCMS.SysCore.Enum
{
    public class SysEnum
    {
        /// <summary>
        /// 資料狀態
        /// </summary>
        [LibDesc("資料狀態")]
        public enum DataStatus : byte
        {
            /// <summary>
            /// 未生效
            /// </summary>
            [LibDesc("作廢")] Invalid = 0,
            /// <summary>
            /// 生效
            /// </summary>
            [LibDesc("生效")] Valid = 1
        }
        /// <summary>
        /// 帳戶狀態
        /// </summary>
        [Description("帳戶狀態")]
        public enum AccountStatus : byte
        {
            /// <summary>
            /// 停用
            /// </summary>
            [Description("停用")] Unable = 0,
            /// <summary>
            /// 啟用
            /// </summary>
            [Description("啟用")] Enable = 1,
            /// <summary>
            /// 凍結
            /// </summary>
            [Description("凍結")] Freeze = 2,
            /// <summary>
            /// 密碼過期
            /// </summary>
            [Description("密碼過期")] PasuwadoExpired = 3,
            /// <summary>
            /// 主機預設密碼
            /// </summary>
            [Description("主機預設密碼")] HostDefault = 4,
        }
        /// <summary>
        /// 功能權限動作
        /// </summary>
        [Description("功能權限動作"), Flags]
        public enum FuncAction : int
        {
            /// <summary>
            /// 使用
            /// </summary>
            [Description("使用")] Use = 1,
            /// <summary>
            /// 查詢
            /// </summary>
            [Description("查詢")] Query = 2,
            /// <summary>
            /// 新增
            /// </summary>
            [Description("新增")] Create = 4,
            /// <summary>
            /// 修改
            /// </summary>
            [Description("修改")] Update = 8,
            /// <summary>
            /// 刪除
            /// </summary>
            [Description("刪除")] Delete = 16,
            /// <summary>
            /// 作廢
            /// </summary>
            [Description("作廢")] Invalid = 32,
            /// <summary>
            /// 全部
            /// </summary>
            All = 63,
        }
        /// <summary>
        /// 過帳狀態
        /// </summary>
        [Description("過帳狀態")]
        public enum TransStatus : byte
        {
            /// <summary>
            /// 無
            /// </summary>
            [Description("無")] None = 0,
            /// <summary>
            /// 正過帳
            /// </summary>
            [Description("正過帳")] Increase = 1,
            /// <summary>
            /// 差異過帳
            /// </summary>
            [Description("差異過帳")] Difference = 2,
            /// <summary>
            /// 反過帳
            /// </summary>
            [Description("反過帳")] Invert = 3,
        }
        /// <summary>
        /// 行狀態
        /// </summary>
        [Description("行狀態")]
        public enum RowState : byte
        {
            /// <summary>
            /// 無異動
            /// </summary>
            [Description("無異動")] None = 0,
            /// <summary>
            /// 新增
            /// </summary>
            [Description("新增")] Insert = 1,
            /// <summary>
            /// 修改
            /// </summary>
            [Description("修改")] Update = 2,
            /// <summary>
            /// 刪除
            /// </summary>
            [Description("刪除")] Delete = 3,
        }
    }
}
