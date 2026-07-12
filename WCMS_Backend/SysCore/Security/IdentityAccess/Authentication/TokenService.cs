using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using WCMS.Features.IAM.Auth;
using WCMS.SysCore.FeatureDriver.Model.Base;
namespace WCMS.SysCore.Security.IdentityAccess.Authentication;

public sealed class TokenService(IMemoryCache cache, IConfiguration cfg) 
{
    #region Property
    private const string TokenIdFormat = "N";
    private const string DefaultAccessTokenMinutes = "15";
    private const string DefaultRefreshTokenDays = "7";
    private const string RefreshTokenPrefix = "rt";
    private const string UserRefreshTokenPrefix = "ur";
    private const string AccessBlacklistPrefix = "bl";
    private readonly IMemoryCache _cache = cache;
    private readonly IConfiguration _cfg = cfg;
    #endregion

    public (string accessToken, string jti, DateTime expires) IssueAccessToken(User_DTO user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_cfg[SysParam.Configuration.Jwt.KeyPath]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var jti = Guid.NewGuid().ToString(TokenIdFormat);
        var expires = DateTime.UtcNow.AddMinutes(int.Parse(_cfg[SysParam.Configuration.Jwt.AccessTokenMinutesPath] ?? DefaultAccessTokenMinutes));

        var claims = new[]
        {
            new Claim(nameof(HeaderModel.InternalId), user.InternalId),
            new Claim(ClaimTypes.NameIdentifier, user.UserId),
            new Claim(ClaimTypes.Name, user.UserName ?? user.UserId),
            //new Claim(ClaimTypes.Role, user.RoleId ?? "User"),
            new Claim(JwtRegisteredClaimNames.Jti, jti),
        };

        var token = new JwtSecurityToken(
            issuer: _cfg[SysParam.Configuration.Jwt.IssuerPath],
            audience: _cfg[SysParam.Configuration.Jwt.AudiencePath],
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expires,
            signingCredentials: creds
        );

        var jwt = new JwtSecurityTokenHandler().WriteToken(token);
        return (jwt, jti, expires);
    }

    public (string refreshToken, string tokenId, DateTime expires) IssueRefreshToken(User_DTO user)
    {
        var tokenId = Guid.NewGuid().ToString(TokenIdFormat);
        var raw = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        var expires = DateTime.UtcNow.AddDays(int.Parse(_cfg[SysParam.Configuration.Jwt.RefreshTokenDaysPath] ?? DefaultRefreshTokenDays));

        _cache.Set($"{RefreshTokenPrefix}:{user.UserId}:{tokenId}", true, expires - DateTime.UtcNow);
        return (raw, tokenId, expires);
    }

    public Task StoreRefreshAsync(string userId, string tokenId, DateTime exp)
    {
        var ttl = exp - DateTime.UtcNow;
        _cache.Set($"{RefreshTokenPrefix}:{tokenId}", userId, ttl);

        var set = _cache.GetOrCreate<HashSet<string>>($"{UserRefreshTokenPrefix}:{userId}", _ => new());
        set!.Add(tokenId);
        _cache.Set($"{UserRefreshTokenPrefix}:{userId}", set, ttl);
        return Task.CompletedTask;
    }
    public Task<string?> GetUserIdByRefreshIdAsync(string tokenId)
    {
        return Task.FromResult(_cache.TryGetValue($"{RefreshTokenPrefix}:{tokenId}", out string? userId) ? userId : null);
    }
    public Task<bool> ValidateRefreshAsync(string userId, string tokenId)
    {
        return Task.FromResult(_cache.TryGetValue($"{RefreshTokenPrefix}:{userId}:{tokenId}", out _));
    }

    public Task RevokeRefreshAsync(string userId, string tokenId)
    {
        _cache.Remove($"{RefreshTokenPrefix}:{tokenId}");
        if (_cache.TryGetValue($"{UserRefreshTokenPrefix}:{userId}", out HashSet<string>? set))
        {
            set!.Remove(tokenId);
            _cache.Set($"{UserRefreshTokenPrefix}:{userId}", set, TimeSpan.FromHours(1)); // 任意
        }
        return Task.CompletedTask;
    }

    public Task BlacklistAccessAsync(string jti, TimeSpan ttl)
    {
        _cache.Set($"{AccessBlacklistPrefix}:{jti}", true, ttl);
        return Task.CompletedTask;
    }

    public Task<bool> IsAccessBlacklistedAsync(string jti)
    {
        return Task.FromResult(_cache.TryGetValue($"{AccessBlacklistPrefix}:{jti}", out _));
    }
}
