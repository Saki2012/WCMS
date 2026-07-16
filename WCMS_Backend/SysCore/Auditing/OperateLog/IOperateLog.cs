namespace WCMS.SysCore.Auditing.OperateLog;

public interface IOperateLog
{
    public OperateLog AddOperateLog(string apiName, string userId, string jsonData, string ip);
    public OperateLog AddOperateLog(OperateLog log);
}
