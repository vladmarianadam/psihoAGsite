using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using PsihoAdinaGghita.Application.Common.Exceptions;
using ValidationException = PsihoAdinaGghita.Application.Common.Exceptions.ValidationException;

namespace PsihoAdinaGghita.Api.Middleware;

/// <summary>
/// Gestionare centralizată a erorilor cu ProblemDetails. Nu scurge detalii interne
/// în producție (plan §9.8).
/// </summary>
public class ExceptionHandlingMiddleware
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleAsync(context, ex);
        }
    }

    private async Task HandleAsync(HttpContext context, Exception exception)
    {
        if (context.Response.HasStarted)
        {
            _logger.LogError(exception, "Excepție după începerea răspunsului; nu se mai poate scrie ProblemDetails.");
            throw exception;
        }

        ProblemDetails problem = exception switch
        {
            ValidationException validation => new ValidationProblemDetails(validation.Errors)
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Datele trimise sunt invalide.",
            },
            NotFoundException notFound => new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Resursă inexistentă.",
                Detail = notFound.Message,
            },
            ConflictException conflict => new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Conflict.",
                Detail = conflict.Message,
            },
            AuthenticationFailedException auth => new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Autentificare eșuată.",
                Detail = auth.Message,
            },
            UnauthorizedAccessException => new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Neautorizat.",
            },
            _ => new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "A apărut o eroare neașteptată.",
                Detail = _environment.IsDevelopment() ? exception.ToString() : null,
            },
        };

        if (problem.Status >= 500)
            _logger.LogError(exception, "Eroare neașteptată la {Method} {Path}", context.Request.Method, context.Request.Path);
        else
            _logger.LogInformation("Cerere respinsă ({Status}) la {Method} {Path}", problem.Status, context.Request.Method, context.Request.Path);

        problem.Instance = context.Request.Path;
        context.Response.Clear();
        context.Response.StatusCode = problem.Status ?? StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/problem+json";

        // Serializare pe tipul REAL: altfel un ValidationProblemDetails ar fi scris ca
        // ProblemDetails simplu și dicționarul „errors" (erorile pe câmpuri) s-ar pierde.
        await context.Response.WriteAsync(JsonSerializer.Serialize(problem, problem.GetType(), SerializerOptions));
    }
}
