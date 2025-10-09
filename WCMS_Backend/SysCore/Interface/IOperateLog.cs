namespace WCMS.SysCore.Interface
{
    public interface IOperateLog
    {
        public IList<OperateLogModel> MoveFollows { get; set; }
        public OperateLogModel AddMoveFollow(string apiName, string userId, string jsonData, string ip);
        public OperateLogModel AddMoveFollow(OperateLogModel _MoveFollows);
    }
}
