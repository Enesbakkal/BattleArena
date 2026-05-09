using BattleArena.Application.Abstractions;
using BattleArena.Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;

namespace BattleArena.Application.Characters.Commands;

public sealed class DeleteCharacterCommandHandler : IRequestHandler<DeleteCharacterCommand, bool>
{
    private readonly IApplicationDbContext _db;
    private readonly IMemoryCache _memoryCache;
    private readonly IDistributedCache _distributedCache;
    private readonly ICharacterSearchIndexer _searchIndexer;

    public DeleteCharacterCommandHandler(
        IApplicationDbContext db,
        IMemoryCache memoryCache,
        IDistributedCache distributedCache,
        ICharacterSearchIndexer searchIndexer)
    {
        _db = db;
        _memoryCache = memoryCache;
        _distributedCache = distributedCache;
        _searchIndexer = searchIndexer;
    }

    public async Task<bool> Handle(DeleteCharacterCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.Characters.FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);
        if (entity is null)
            return false;

        _db.Characters.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);

        var key = CharacterDetailCacheKeys.Detail(request.Id);
        _memoryCache.Remove(key);
        await _distributedCache.RemoveAsync(key, cancellationToken);

        await _searchIndexer.DeleteAsync(request.Id, cancellationToken);

        return true;
    }
}