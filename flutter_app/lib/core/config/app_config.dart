/// App configuration — API URLs and constants.
///
/// The Flutter app connects to the EXISTING live website backend.
/// No separate backend is created. The website remains the source of truth.
class AppConfig {
  /// Live website API base URL (production).
  /// All API calls go through the existing Next.js API routes.
  static const String apiBaseUrl = 'https://pradips-homoe.vercel.app';

  /// For local development (Android emulator → host machine):
  /// static const String apiBaseUrl = 'http://10.0.2.2:3000';

  /// API endpoint paths (reuse existing website API routes)
  static const String loginEndpoint = '/api/auth/login';
  static const String logoutEndpoint = '/api/auth/logout';
  static const String sessionEndpoint = '/api/auth/session';
  static const String meEndpoint = '/api/me';

  // Content endpoints (read-only from app perspective)
  static const String remediesEndpoint = '/api/remedies';
  static const String rubricsEndpoint = '/api/rubrics';
  static const String rubricsChaptersEndpoint = '/api/rubrics/chapters';
  static const String rubricsChildrenEndpoint = '/api/rubrics/children';
  static const String booksEndpoint = '/api/books';
  static const String searchEndpoint = '/api/search';
  static const String clinicalSearchEndpoint = '/api/clinical-search';
  static const String synthesisEndpoint = '/api/synthesis';
  static const String therapeuticsEndpoint = '/api/therapeutics';

  // User feature endpoints (read/write — synced via outbox)
  static const String bookmarksEndpoint = '/api/user/bookmarks';
  static const String favoritesEndpoint = '/api/user/favorites';
  static const String historyEndpoint = '/api/user/history';
  static const String notesEndpoint = '/api/user/notes';
  static const String highlightsEndpoint = '/api/user/highlights';

  /// Sync configuration
  static const int syncBatchSize = 100;
  static const int syncMaxRetries = 5;
  static const int syncRetryBaseDelaySec = 2;
  static const int syncMaxBackoffSec = 60;
  static const int backgroundSyncIntervalMin = 15;

  /// Outbox configuration
  static const int outboxMaxRetries = 10;
  static const int outboxProcessIntervalSec = 30;

  /// Session
  static const int sessionRefreshThresholdMin = 30;

  /// Secure storage keys
  static const String secureStorageKey = 'ph_session_token';
  static const String secureStorageUserKey = 'ph_user_data';

  /// Local database
  static const String dbFileName = 'pradips_homeo.db';

  /// Request timeouts
  static const int connectTimeoutSec = 15;
  static const int receiveTimeoutSec = 60;
  static const int sendTimeoutSec = 30;
}
