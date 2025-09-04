namespace WCMS.SysCore.Interface
{
    public interface IOperateLog
    {
        public IList<OperateLogModel> MoveFollows { get; set; }
        public void AddMoveFollow(OperateLogModel _MoveFollows);
    }
}
