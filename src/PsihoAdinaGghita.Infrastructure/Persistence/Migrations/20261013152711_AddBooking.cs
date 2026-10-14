using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PsihoAdinaGghita.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBooking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CancelledAt",
                table: "AppointmentRequests",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ConfirmedAt",
                table: "AppointmentRequests",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EndAt",
                table: "AppointmentRequests",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GoogleEventId",
                table: "AppointmentRequests",
                type: "TEXT",
                maxLength: 1024,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GoogleSyncState",
                table: "AppointmentRequests",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "NotNeeded");

            migrationBuilder.AddColumn<string>(
                name: "RejectReason",
                table: "AppointmentRequests",
                type: "TEXT",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartAt",
                table: "AppointmentRequests",
                type: "TEXT",
                nullable: true);

            // Rândurile existente (formularul text-liber) devin Legacy.
            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "AppointmentRequests",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "Legacy");

            migrationBuilder.CreateTable(
                name: "AvailabilityExceptions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Date = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    IsClosed = table.Column<bool>(type: "INTEGER", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "TEXT", nullable: true),
                    EndTime = table.Column<TimeOnly>(type: "TEXT", nullable: true),
                    Reason = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AvailabilityExceptions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AvailabilityRules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    DayOfWeek = table.Column<int>(type: "INTEGER", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "TEXT", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AvailabilityRules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BookingSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    IsEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    SlotStepMinutes = table.Column<int>(type: "INTEGER", nullable: false),
                    BufferMinutes = table.Column<int>(type: "INTEGER", nullable: false),
                    MinNoticeHours = table.Column<int>(type: "INTEGER", nullable: false),
                    HorizonDays = table.Column<int>(type: "INTEGER", nullable: false),
                    MaxPendingPerEmail = table.Column<int>(type: "INTEGER", nullable: false),
                    UseGoogleFreeBusy = table.Column<bool>(type: "INTEGER", nullable: false),
                    TimeZone = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookingSettings", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppointmentRequests_StartAt",
                table: "AppointmentRequests",
                column: "StartAt",
                unique: true,
                filter: "\"Status\" IN ('Pending','Confirmed')");

            migrationBuilder.CreateIndex(
                name: "IX_AvailabilityExceptions_Date",
                table: "AvailabilityExceptions",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_AvailabilityRules_DayOfWeek",
                table: "AvailabilityRules",
                column: "DayOfWeek");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AvailabilityExceptions");

            migrationBuilder.DropTable(
                name: "AvailabilityRules");

            migrationBuilder.DropTable(
                name: "BookingSettings");

            migrationBuilder.DropIndex(
                name: "IX_AppointmentRequests_StartAt",
                table: "AppointmentRequests");

            migrationBuilder.DropColumn(
                name: "CancelledAt",
                table: "AppointmentRequests");

            migrationBuilder.DropColumn(
                name: "ConfirmedAt",
                table: "AppointmentRequests");

            migrationBuilder.DropColumn(
                name: "EndAt",
                table: "AppointmentRequests");

            migrationBuilder.DropColumn(
                name: "GoogleEventId",
                table: "AppointmentRequests");

            migrationBuilder.DropColumn(
                name: "GoogleSyncState",
                table: "AppointmentRequests");

            migrationBuilder.DropColumn(
                name: "RejectReason",
                table: "AppointmentRequests");

            migrationBuilder.DropColumn(
                name: "StartAt",
                table: "AppointmentRequests");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "AppointmentRequests");
        }
    }
}
