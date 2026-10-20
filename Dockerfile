# syntax=docker/dockerfile:1
#
# Imagine unică: build-ul clientului Vite ajunge în wwwroot-ul API-ului .NET, deci SPA-ul și
# /api sunt servite de același proces, de pe aceeași origine (fără CORS în producție).
#
# Build context: rădăcina repository-ului.
#
#   docker build -t psiho .
#   docker run -p 8080:8080 -v psiho-data:/data -v psiho-uploads:/app/wwwroot/uploads \
#     -e Jwt__SigningKey="<32+ caractere>" -e AdminSeed__Password="<parola>" psiho

# ---------------------------------------------------------------- 1. Client ---
FROM node:22-alpine AS client
WORKDIR /client

# Puține straturi, intenționat: builderul platformei (podman rootless) poate copia întreg
# sistemul de fișiere la fiecare COPY/RUN, iar cota de disc a build-ului e mică. De aceea
# sursele se copiază o dată și totul rulează într-un singur RUN care își curăță cache-urile.
# Gol înseamnă „apeluri relative către /api” — exact ce trebuie când API-ul servește SPA-ul.
ENV VITE_API_BASE_URL="" NPM_CONFIG_UPDATE_NOTIFIER=false NPM_CONFIG_FUND=false NPM_CONFIG_AUDIT=false
COPY client/ ./
RUN npm ci \
    && npm run build \
    && rm -rf node_modules /root/.npm /tmp/*

# ------------------------------------------------------------------- 2. API ---
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS api
WORKDIR /src

# Același motiv: un singur COPY și un singur RUN (restore + publish), cu cache-ul NuGet
# șters la final. Soluția nu se copiază — referă și proiectul de teste, care nu intră în imagine.
ENV DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_NOLOGO=1 DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1
COPY src/ src/
RUN dotnet publish src/PsihoAdinaGghita.Api/PsihoAdinaGghita.Api.csproj \
        -c Release -o /app/publish /p:UseAppHost=false \
    && rm -rf /root/.nuget /root/.local/share/NuGet /tmp/* src/*/obj src/*/bin

# --------------------------------------------------------------- 3. Runtime ---
# Debian, nu Alpine: biblioteca nativă SQLite (SQLitePCLRaw) și ICU sunt calea cea mai bine
# testată aici, iar diferența de dimensiune nu contează pentru un singur container.
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# tzdata: ora României în emailurile de programare.
RUN apt-get update \
    && apt-get install -y --no-install-recommends tzdata \
    && rm -rf /var/lib/apt/lists/*

ENV TZ=Europe/Bucharest
ENV ASPNETCORE_ENVIRONMENT=Production

# Platforma termină TLS în fața containerului; fără asta aplicația s-ar crede pe http,
# iar UseHttpsRedirection ar putea intra în buclă de redirect.
ENV ASPNETCORE_FORWARDEDHEADERS_ENABLED=true

# Baza de date stă pe volumul persistent /data, nu în release (release-ul se înlocuiește
# la fiecare deploy). Încărcările stau pe volumul /app/wwwroot/uploads.
ENV ConnectionStrings__Default="Data Source=/data/psiho.db"

COPY --from=api /app/publish ./
COPY --from=client /client/dist ./wwwroot/

# Unele platforme (ex. sdploy) pornesc containerul cu un UID arbitrar, non-root (ex. 1037),
# nu cu `app`. Directoarele de date sunt deci scriibile de oricine, iar HOME indică /tmp,
# ca .NET să nu încerce să scrie în / (sistem de fișiere read-only pentru acel UID).
RUN mkdir -p /data /app/wwwroot/uploads \
    && chown -R app:app /data /app \
    && chmod 0777 /data /app/wwwroot/uploads
ENV HOME=/tmp

EXPOSE 8080

# Entrypoint simplu, fără schimbare de utilizator: pe platforme cu podman rootless, „root”
# din container e deja un UID neprivilegiat pe gazdă, iar `gosu app` poate eșua (UID-ul 1654
# nu e mapat în user namespace) — procesul murea fără niciun mesaj. Aplicația rulează cu
# UID-ul pe care îl alege platforma; directoarele de date sunt scriibile de oricine (mai sus).
#  - portul: $PORT dacă e injectat, altfel 8080 (valoarea din EXPOSE);
#  - 0.0.0.0, nu „+”: ascultă explicit pe IPv4, unde verifică platforma (ready check);
#  - 2>&1: erorile de pornire ajung în același log cu restul.
# Prima linie din log: UID-ul real și dacă volumele sunt scriibile — diagnostic la pornire.
ENTRYPOINT ["/bin/sh", "-c", "echo \"[start] uid=$(id -u) port=${PORT:-8080} data=$( [ -w /data ] && echo rw || echo RO ) uploads=$( [ -w /app/wwwroot/uploads ] && echo rw || echo RO )\"; exec dotnet PsihoAdinaGghita.Api.dll --urls \"http://0.0.0.0:${PORT:-8080}\" 2>&1"]
