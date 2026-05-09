using BattleArena.Application.Abstractions;
using MediatR;

namespace BattleArena.Application.Characters.Queries;

public sealed class SearchCharactersQueryHandler
    : IRequestHandler<SearchCharactersQuery, IReadOnlyList<CharacterSearchHit>>
{
    private readonly ICharacterSearchReadModel _search;

    public SearchCharactersQueryHandler(ICharacterSearchReadModel search)
    {
        _search = search;
    }

    public Task<IReadOnlyList<CharacterSearchHit>> Handle(
        SearchCharactersQuery request,
        CancellationToken cancellationToken)
        => _search.SearchAsync(request.Term, request.Size, cancellationToken);
}