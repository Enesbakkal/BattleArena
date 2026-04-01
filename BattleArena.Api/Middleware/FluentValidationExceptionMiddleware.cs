using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace BattleArena.Api.Middleware;

// Converts FluentValidation.ValidationException into HTTP 400 + ProblemDetails-style JSON for the grid form and clients.
public sealed class FluentValidationExceptionMiddleware
{
    private readonly RequestDelegate _next;

    public FluentValidationExceptionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidationException ex)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/problem+json";

            var errors = ex.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(
                    g => string.IsNullOrEmpty(g.Key) ? "_" : g.Key,
                    g => g.Select(e => e.ErrorMessage).ToArray());

            var problem = new ValidationProblemDetails
            {
                Title = "One or more validation errors occurred.",
                Status = StatusCodes.Status400BadRequest,
                Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                Errors = errors
            };

            await context.Response.WriteAsJsonAsync(problem);
        }
    }
}
