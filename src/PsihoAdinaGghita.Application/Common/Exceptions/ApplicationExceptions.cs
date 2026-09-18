namespace PsihoAdinaGghita.Application.Common.Exceptions;

/// <summary>Aruncată de ValidationBehavior; mapată la 400 + ProblemDetails de middleware.</summary>
public class ValidationException : Exception
{
    public ValidationException(IDictionary<string, string[]> errors)
        : base("Unul sau mai multe câmpuri sunt invalide.")
        => Errors = errors;

    public IDictionary<string, string[]> Errors { get; }
}

/// <summary>Entitate inexistentă → 404.</summary>
public class NotFoundException : Exception
{
    public NotFoundException(string name, object key)
        : base($"{name} cu identificatorul \"{key}\" nu a fost găsit.") { }

    public NotFoundException(string message) : base(message) { }
}

/// <summary>Regulă de business încălcată (ex. slug duplicat) → 409.</summary>
public class ConflictException : Exception
{
    public ConflictException(string message) : base(message) { }
}

/// <summary>Autentificare eșuată → 401, cu mesaj generic (fără enumerare de useri).</summary>
public class AuthenticationFailedException : Exception
{
    public AuthenticationFailedException(string message = "Date de autentificare incorecte.") : base(message) { }
}
