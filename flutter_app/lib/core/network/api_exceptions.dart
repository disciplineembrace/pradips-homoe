/// API exception types for structured error handling.
///
/// All errors include a user-friendly message and a technical detail
/// for logging. Sensitive data (tokens, passwords) is never included
/// in error messages or logs.
library;

/// Base class for all API exceptions.
sealed class ApiException implements Exception {
  final String message;
  final String? technicalDetail;

  const ApiException(this.message, [this.technicalDetail]);

  @override
  String toString() => message;
}

/// No internet connection available.
class NoConnectionException extends ApiException {
  const NoConnectionException()
      : super('No internet connection. Showing offline content.');
}

/// Request timed out.
class Timeout ApiException {
  const TimeoutException([String? detail])
      : super('Request timed out. Please try again.', detail);
}

/// Authentication failed (invalid session, expired token, wrong PIN).
class AuthException extends ApiException {
  final int? statusCode;
  const AuthException(String message, {this.statusCode, String? detail})
      : super(message, detail);
}

/// Permission denied (insufficient role, no premium access).
class PermissionException extends ApiException {
  const PermissionException(String message, [String? detail])
      : super(message, detail);
}

/// Server returned an error (5xx).
class ServerException extends ApiException {
  final int statusCode;
  const ServerException(String message, this.statusCode, [String? detail])
      : super(message, detail);
}

/// Malformed or unexpected server response.
class MalformedResponseException extends ApiException {
  const MalformedResponseException([String? detail])
      : super('Received invalid data from server.', detail);
}

/// Local database (SQLite) error.
class DatabaseException extends ApiException {
  const DatabaseException(String message, [String? detail]) : super(message, detail);
}

/// Sync conflict that couldn't be auto-resolved.
class SyncConflictException extends ApiException {
  final String entityId;
  const SyncConflictException(this.entityId, String message, [String? detail])
      : super(message, detail);
}

/// Partial download — sync interrupted.
class PartialSyncException extends ApiException {
  final int received;
  final int expected;
  const PartialSyncException(this.received, this.expected, [String? detail])
      : super('Sync incomplete: received $received of $expected records.', detail);
}
