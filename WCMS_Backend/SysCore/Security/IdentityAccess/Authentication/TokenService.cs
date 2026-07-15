using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using WCMS.Features.IAM.Auth;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.Constants;

namespace WCMS.SysCore.Security.IdentityAccess.Authentication;

/// <summary>
/// 負責 JWT 簽發與 TokenStateCache 的 Refresh、撤銷狀態操作。
/// </summary>
public sealed class TokenService(TokenStateCache tokenStateCache, IConfiguration cfg)
{
    #region Property
    private const string TokenIdFormat = "N";
    private const string DefaultAccessTokenMinutes = "15";
    private const string DefaultRefreshTokenDays = "7";
    private TokenStateCache TokenStateCache { get; } = tokenStateCache;
    private IConfiguration Configuration { get; } = cfg;
    #endregion

    #region Public
    /// <summary>
    /// 簽發指定使用者的 Access Token。
    /// </summary>
    public (string accessToken, string jti, DateTime expires) IssueAccessToken(User_DTO user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Configuration[SysParam.Configuration.Jwt.KeyPath]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var jti = Guid.NewGuid().ToString(TokenIdFormat);
        var expires = DateTime.UtcNow.AddMinutes(int.Parse(Configuration[SysParam.Configuration.Jwt.AccessTokenMinutesPath] ?? DefaultAccessTokenMinutes));
        var claims = new[]
        {
            new Claim(nameof(HeaderModel.InternalId), user.InternalId),
            new Claim(ClaimTypes.NameIdentifier, user.UserId),
            new Claim(ClaimTypes.Name, user.UserName ?? user.UserId),
            new Claim(JwtRegisteredClaimNames.Jti, jti),
        };
        var token = new JwtSecurityToken(
            issuer: Configuration[SysParam.Configuration.Jwt.IssuerPath],
            audience: Configuration[SysParam.Configuration.Jwt.AudiencePath],
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expires,
            signingCredentials: creds);
        var jwt = new JwtSecurityTokenHandler().WriteToken(token);
        return (jwt, jti, expires);
    }
    /// <summary>
    /// 產生 Refresh Token 資料，狀態由 StoreRefreshAsync 保存。
    /// </summary>
    public (string tokenId, DateTime expires) IssueRefreshToken()
    {
        string tokenId = Guid.NewGuid().ToString(TokenIdFormat);
        DateTime expires = DateTime.UtcNow.AddDays(int.Parse(Configuration[SysParam.Configuration.Jwt.RefreshTokenDaysPath] ?? DefaultRefreshTokenDays));
        return (tokenId, expires);
    }
    /// <summary>
    /// 保存 Refresh Token 與使用者的有效關聯。
    /// </summary>
    public Task StoreRefreshAsync(
        string userId,
        string tokenId,
        DateTime expires,
        CancellationToken ct = default)
    {
        return TokenStateCache.StoreRefreshAsync(userId, tokenId, expires, ct);
    }
    /// <summary>
    /// 依 Refresh Token 代號取得使用者代號。
    /// </summary>
    public Task<string?> GetUserIdByRefreshIdAsync(string tokenId, CancellationToken ct = default)
    {
        return TokenStateCache.GetUserIdByRefreshIdAsync(tokenId, ct);
    }
    /// <summary>
    /// 撤銷指定 Refresh Token。
    /// </summary>
    public Task RevokeRefreshAsync(string tokenId, CancellationToken ct = default)
    {
        return TokenStateCache.RevokeRefreshAsync(tokenId, ct);
    }
    /// <summary>
    /// 將 Access Token 加入撤銷清單。
    /// </summary>
    public Task BlacklistAccessAsync(string jti, TimeSpan ttl, CancellationToken ct = default)
    {
        return TokenStateCache.BlacklistAccessAsync(jti, ttl, ct);
    }
    /// <summary>
    /// 判斷 Access Token 是否已被撤銷。
    /// </summary>
    public Task<bool> IsAccessBlacklistedAsync(string jti, CancellationToken ct = default)
    {
        return TokenStateCache.IsAccessBlacklistedAsync(jti, ct);
    }
    #endregion
}
