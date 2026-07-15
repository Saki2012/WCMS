using WCMS.SysCore.Persistence;

namespace WCMS.SysCore.Auditing.OperateLog;

//實做操作記錄的點
public class OperateLog(ApplicationDbContext dataAccess) : IOperateLog
{
    private readonly ApplicationDbContext DataAccess = dataAccess;
    public OperateLogModel AddOperateLog(string apiName, string userId, string jsonData, string ip)
    {
        return AddOperateLog(new() { APIName = apiName, UserId = userId, followingDT = jsonData, IP = ip });
    }
    public OperateLogModel AddOperateLog(OperateLogModel log)
    {
        DataAccess.Add(log);
        DataAccess.SaveChanges();
        return log;
    }
}
