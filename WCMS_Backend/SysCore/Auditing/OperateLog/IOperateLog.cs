namespace WCMS.SysCore.Observability.OperateLog;

public interface IOperateLog
{
    public OperateLogModel AddOperateLog(string apiName, string userId, string jsonData, string ip);
    public OperateLogModel AddOperateLog(OperateLogModel log);
}
