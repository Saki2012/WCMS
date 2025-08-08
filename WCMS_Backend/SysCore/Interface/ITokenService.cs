using WCMS.SysCore.Model;

namespace WCMS.SysCore.Interface
{
    public interface ITokenService
    {
        (string accessToken, string jti, DateTime expires) IssueAccessToken(UserModel user);
        (string refreshToken, string tokenId, DateTime expires) IssueRefreshToken(UserModel user);
        Task StoreRefreshAsync(string userId, string tokenId, DateTime expires);
        Task<bool> ValidateRefreshAsync(string userId, string tokenId);
        Task RevokeRefreshAsync(string userId, string tokenId);
        Task BlacklistAccessAsync(string jti, TimeSpan ttl);
        Task<bool> IsAccessBlacklistedAsync(string jti);
    }
}
