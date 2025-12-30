namespace WCMS.SysCore.Interface
{
    public interface IOperateLog
    {
        public IList<OperateLogModel> OperateLogs { get; set; }
        public OperateLogModel AddOperateLog(string apiName, string userId, string jsonData, string ip);
        public OperateLogModel AddOperateLog(OperateLogModel log);
    }
}
