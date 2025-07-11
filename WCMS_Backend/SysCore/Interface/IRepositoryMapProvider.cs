namespace WCMS.SysCore.Interface
{
    public interface IRepositoryMapProvider
    {
        Dictionary<string, object> GetRepoDict<TSet>() where TSet : class;
    }
}
