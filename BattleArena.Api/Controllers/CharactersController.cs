using BattleArena.Api.Contracts;
using BattleArena.Application.Characters.Commands;
using BattleArena.Application.Characters.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace BattleArena.Api.Controllers;

// Character grid + create: GET returns paged rows for TanStack Table; POST adds a row after validation pipeline runs.
[ApiController]
[Route("api/[controller]")]
public sealed class CharactersController : ControllerBase
{
    private readonly IMediator _mediator;

    public CharactersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedCharacterRowsResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedCharacterRowsResult>> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetCharactersQuery(page, pageSize), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Guid>> Create(
        [FromBody] CreateCharacterRequest body,
        CancellationToken cancellationToken = default)
    {
        var id = await _mediator.Send(
            new CreateCharacterCommand(
                body.Name,
                body.Universe,
                body.Biography,
                body.Rarity,
                body.BaseAttack,
                body.BaseDefense,
                body.BaseSpeed,
                body.ImageUrl),
            cancellationToken);

        // Location is relative; add GET-by-id later if you want CreatedAtAction with a named route.
        return Created($"/api/characters/{id}", id);
    }
}
