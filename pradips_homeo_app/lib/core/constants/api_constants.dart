/// API Constants for Pradip's Homeo App
/// All endpoints connect to the existing Next.js backend at pradips-homoe.vercel.app
class ApiConstants {
  ApiConstants._();

  /// Base URL for the production website
  static const String websiteUrl = 'https://pradips-homoe.vercel.app';

  /// API base URL
  static const String apiBaseUrl = 'https://pradips-homoe.vercel.app/api';

  // ======================
  // Authentication
  // ======================
  static const String login = '$apiBaseUrl/auth/login';
  static const String logout = '$apiBaseUrl/auth/logout';
  static const String session = '$apiBaseUrl/auth/session';

  // ======================
  // Content APIs
  // ======================
  static const String remedies = '$apiBaseUrl/remedies';
  static const String rubricsTree = '$apiBaseUrl/rubrics/tree';
  static const String rubricsChapters = '$apiBaseUrl/rubrics/chapters';
  static const String search = '$apiBaseUrl/search';
  static const String clinicalSearch = '$apiBaseUrl/clinical-search';
  static const String synthesis = '$apiBaseUrl/synthesis';
  static const String books = '$apiBaseUrl/books';
  static const String analysisCalculate = '$apiBaseUrl/analysis/calculate';

  // ======================
  // User Feature APIs
  // ======================
  static const String userNotes = '$apiBaseUrl/user/notes';
  static const String userBookmarks = '$apiBaseUrl/user/bookmarks';
  static const String userFavorites = '$apiBaseUrl/user/favorites';
  static const String userHistory = '$apiBaseUrl/user/history';
  static const String userHighlights = '$apiBaseUrl/user/highlights';
  static const String userReaderFeatures = '$apiBaseUrl/user/reader-features';

  // ======================
  // Analytics
  // ======================
  static const String analyticsStats = '$apiBaseUrl/analytics/stats';
  static const String analyticsTrack = '$apiBaseUrl/analytics/track';

  // ======================
  // Question Bank
  // ======================
  static const String questionBankSubmit = '$apiBaseUrl/question-bank/submit';
  static const String questionBankBookmark = '$apiBaseUrl/question-bank/bookmark';
  static const String questionBankReview = '$apiBaseUrl/question-bank/review';

  // ======================
  // Storage Keys
  // ======================
  static const String sessionCookieKey = 'pradips_homeo_session';
  static const String userEmailKey = 'pradips_homeo_user_email';
  static const String userNameKey = 'pradips_homeo_user_name';
  static const String userRoleKey = 'pradips_homeo_user_role';

  // ======================
  // App Info
  // ======================
  static const String appName = "Pradip's Homeo";
  static const String appVersion = '1.0.0';
  static const int appBuildNumber = 1;

  // ======================
  // Grade system colors
  // ======================
  /// Grade 4 = Highest (red), Grade 3 = Strong (green),
  /// Grade 2 = Moderate (blue), Grade 1 = Lower (gray)
  static const Map<int, String> gradeLabels = {
    4: 'Grade 4 - Highest',
    3: 'Grade 3 - Strong',
    2: 'Grade 2 - Moderate',
    1: 'Grade 1 - Lower',
  };
}
