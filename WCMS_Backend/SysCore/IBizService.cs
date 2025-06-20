namespace WCMS.SysCore
{

    public interface IBizService<TSet>
    {
        public TSet Create(TSet set);
        public TSet Update(object[] key, TSet set);
        public bool Delete(object[] key);
        public bool Invalid(object[] key, bool status);
        public TSet Query(TSet set);
        public List<TSet> QueryList(string selectFields, string condition, int pageCt, int takeCt);
        public Task<TSet> CreateAsync(TSet set);
        public Task<TSet> UpdateAsync(object key, TSet set);
        public Task<bool> DeleteAsync(object[] key);
        public Task<bool> InvalidAsync(object[] key, bool status);
        public Task<TSet> QueryAsync(TSet set);
        public Task<List<TSet>> QueryListAsync(string selectFields, string condition, int pageCt, int takeCt);
    }
    
    public class BizService<TSet> : IBizService<TSet>
    {
        #region Property
        private BasicRepository<TSet> Repo { get; }
        #endregion

        #region Construct
        public BizService(BasicRepository<TSet> repo) => Repo = repo;
        #endregion

        #region Public
        public TSet Create(TSet set)
        {
            return Repo.Create(set);
        }
        public async Task<TSet> CreateAsync(TSet set)
        {
            try 
            { 
                return await Repo.CreateAsync(set);
            }
            catch
            {
                return await Repo.CreateAsync(set);
            }
            finally
            {
                Repo.Dispose();
            }
        }
        public TSet Update(object[] key, TSet set)
        {
            return Repo.Update(key,set);
        }
        public async Task<TSet> UpdateAsync(object key, TSet set)
            => await Repo.UpdateAsync(key, set);
        public bool Delete(object[] key)
        {
            Repo.Delete(key);
            return true;
        }
        public async Task<bool> DeleteAsync(object[] key)
            => await Repo.DeleteAsync(key);
        public bool Invalid(object[] key, bool status)
        {
            throw new NotImplementedException();
        }
        public async Task<bool> InvalidAsync(object[] key, bool status)
            => await Repo.InvalidAsync(key, status);
        public TSet Query(TSet set)
        {
            throw new NotImplementedException();
        }
        public async Task<TSet> QueryAsync(TSet set)
            => await Repo.QueryAsync(set);
        public List<TSet> QueryList(string selectFields, string condition, int pageCt, int takeCt)
        {
            throw new NotImplementedException();
        }
        public async Task<List<TSet>> QueryListAsync(string selectFields, string condition, int pageCt, int takeCt)
            => await Repo.QueryListAsync(selectFields, condition, pageCt, takeCt);
        #endregion

        #region Protected
        protected virtual void BeforeUpdate(TSet set){}

        protected virtual void AfterUpdate(TSet set){}

        protected virtual void AfterCommit(TSet set){}
        #region
    }
}
