using FluentValidation;

namespace BattleArena.Application.Characters.Commands;

public sealed class UpdateCharacterCommandValidator : AbstractValidator<UpdateCharacterCommand>
{
    public UpdateCharacterCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Universe).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Biography).MaximumLength(2000);
        RuleFor(x => x.Rarity).InclusiveBetween(1, 5);
        RuleFor(x => x.BaseAttack).InclusiveBetween(0, 9999);
        RuleFor(x => x.BaseDefense).InclusiveBetween(0, 9999);
        RuleFor(x => x.BaseSpeed).InclusiveBetween(0, 9999);
        RuleFor(x => x.ImageUrl).MaximumLength(500);
    }
}
