using WCMS.SysCore.Persistence;

namespace WCMS.SysCore.Auditing.OperateLog;

/// <summary>
/// 提供操作日誌建立與立即寫入能力。
/// </summary>
public sealed class OperateLogService(ApplicationDbContext dataAccess) : IOperateLog
{
    #region Property
    private ApplicationDbContext DataAccess { get; } = dataAccess;
    #endregion

    #region Public
    /// <summary>
    /// 依 API、使用者、內容與來源 IP 建立操作日誌。
    /// </summary>
    public OperateLog AddOperateLog(string apiName, string userId, string jsonData, string ip)
    {
        OperateLog result = new()
        {
            APIName = apiName,
            UserId = userId,
            followingDT = jsonData,
            IP = ip,
        };
        return AddOperateLog(result);
    }
    /// <summary>
    /// 將既有操作日誌立即寫入資料庫並回傳同一實例。
    /// </summary>
    public OperateLog AddOperateLog(OperateLog log)
    {
        DataAccess.Add(log);
        DataAccess.SaveChanges();
        return log;
    }
    #endregion
}
