using System.Text.Json;
using BattleArena.Application.Abstractions;
using BattleArena.Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;

namespace BattleArena.Application.Characters.Queries;

public sealed class GetCharacterByIdQueryHandler : IRequestHandler<GetCharacterByIdQuery, CharacterDetailDto?>
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly IApplicationDbContext _db;
    private readonly IMemoryCache _memoryCache;
    private readonly IDistributedCache _distributedCache;

    public GetCharacterByIdQueryHandler(
        IApplicationDbContext db,
        IMemoryCache memoryCache,
        IDistributedCache distributedCache)
    {
        _db = db;
        _memoryCache = memoryCache;
        _distributedCache = distributedCache;
    }

    public async Task<CharacterDetailDto?> Handle(GetCharacterByIdQuery request, CancellationToken cancellationToken)
    {
        var cacheKey = CharacterDetailCacheKeys.Detail(request.Id);

        if (_memoryCache.TryGetValue(cacheKey, out CharacterDetailDto? memoryHit))
            return memoryHit;

        var distributedBytes = await _distributedCache.GetAsync(cacheKey, cancellationToken);
        if (distributedBytes is not null)
        {
            var fromDistributed = JsonSerializer.Deserialize<CharacterDetailDto>(distributedBytes, SerializerOptions);
            if (fromDistributed is not null)
            {
                _memoryCache.Set(
                    cacheKey,
                    fromDistributed,
                    new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(30) });

                return fromDistributed;
            }
        }

        var detail = await _db.Characters
            .AsNoTracking()
            .Where(c => c.Id == request.Id)
            .Select(c => new CharacterDetailDto(
                c.Id,
                c.Name,
                c.Universe,
                c.Biography,
                c.Rarity,
                c.BaseAttack,
                c.BaseDefense,
                c.BaseSpeed,
                c.ImageUrl,
                c.CreatedAtUtc))
            .FirstOrDefaultAsync(cancellationToken);

        if (detail is null)
            return null;

        var serialized = JsonSerializer.SerializeToUtf8Bytes(detail, SerializerOptions);

        await _distributedCache.SetAsync(
            cacheKey,
            serialized,
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5) },
            cancellationToken);

        _memoryCache.Set(
            cacheKey,
            detail,
            new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(30) });

        return detail;
    }
}