using BattleArena.Application.Abstractions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BattleArena.Application.Characters.Commands;

public sealed class DeleteCharacterCommandHandler : IRequestHandler<DeleteCharacterCommand, bool>
{
    private readonly IApplicationDbContext _db;

    public DeleteCharacterCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<bool> Handle(DeleteCharacterCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.Characters.FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);
        if (entity is null)
            return false;

        _db.Characters.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
