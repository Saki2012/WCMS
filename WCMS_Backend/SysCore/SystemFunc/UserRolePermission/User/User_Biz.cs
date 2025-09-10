using System.Runtime.InteropServices;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library.Security;

namespace WCMS.SysCore.SystemFunc.UserRolePermission.User
{
    [ProgId("User")]
    public class UserBiz(IRepositoryMapProvider repoMapProvider, IErrorHelper message) : BizService<UserSet>(repoMapProvider, message), IBizService<UserSet>
    {
        #region Public
        public bool VerifyPassword(UserSet user, string password) => PasswordHasher.Verify(password, user.User.PasswordHash, user.User.PasswordSalt, user.User.PasswordAlgoVer);
        #endregion

        #region Private

        #endregion
    }
}
