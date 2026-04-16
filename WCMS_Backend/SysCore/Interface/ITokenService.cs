using WCMS.Features.IAM.Auth;

namespace WCMS.SysCore.Interface
{
    public interface ITokenService
    {
        (string accessToken, string jti, DateTime expires) IssueAccessToken(User_DTO user);
        (string refreshToken, string tokenId, DateTime expires) IssueRefreshToken(User_DTO user);
        Task StoreRefreshAsync(string userId, string tokenId, DateTime expires);
        Task<string?> GetUserIdByRefreshIdAsync(string tokenId);   // ★ 新增
        Task<bool> ValidateRefreshAsync(string userId, string tokenId);
        Task RevokeRefreshAsync(string userId, string tokenId);
        Task BlacklistAccessAsync(string jti, TimeSpan ttl);
        Task<bool> IsAccessBlacklistedAsync(string jti);
    }
}
