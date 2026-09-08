import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

/// App Theme - Material 3 with deep green + cream premium look
class AppTheme {
  AppTheme._();

  static ThemeData get lightTheme {
    final ColorScheme colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      brightness: Brightness.light,
      primary: AppColors.primary,
      secondary: AppColors.accent,
      surface: AppColors.surface,
      error: AppColors.error,
      onPrimary: AppColors.textOnPrimary,
      onSecondary: AppColors.textOnPrimary,
      onSurface: AppColors.textPrimary,
      onError: Colors.white,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AppColors.background,
      canvasColor: AppColors.background,

      // Typography
      textTheme: GoogleFonts.latoTextTheme().copyWith(
        displayLarge: GoogleFonts.playfairDisplay(
          fontSize: 32, fontWeight: FontWeight.bold,
          color: AppColors.primary,
        ),
        displayMedium: GoogleFonts.playfairDisplay(
          fontSize: 28, fontWeight: FontWeight.bold,
          color: AppColors.primary,
        ),
        displaySmall: GoogleFonts.playfairDisplay(
          fontSize: 24, fontWeight: FontWeight.w600,
          color: AppColors.headingMaroon,
        ),
        headlineLarge: GoogleFonts.playfairDisplay(
          fontSize: 22, fontWeight: FontWeight.w600,
          color: AppColors.primary,
        ),
        headlineMedium: GoogleFonts.playfairDisplay(
          fontSize: 20, fontWeight: FontWeight.w600,
          color: AppColors.primary,
        ),
        headlineSmall: GoogleFonts.playfairDisplay(
          fontSize: 18, fontWeight: FontWeight.w600,
          color: AppColors.headingMaroon,
        ),
        titleLarge: GoogleFonts.lato(
          fontSize: 18, fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
        titleMedium: GoogleFonts.lato(
          fontSize: 16, fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
        titleSmall: GoogleFonts.lato(
          fontSize: 14, fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
        bodyLarge: GoogleFonts.lato(
          fontSize: 16, fontWeight: FontWeight.normal,
          color: AppColors.textPrimary, height: 1.5,
        ),
        bodyMedium: GoogleFonts.lato(
          fontSize: 14, fontWeight: FontWeight.normal,
          color: AppColors.textPrimary, height: 1.5,
        ),
        bodySmall: GoogleFonts.lato(
          fontSize: 12, fontWeight: FontWeight.normal,
          color: AppColors.textSecondary, height: 1.4,
        ),
        labelLarge: GoogleFonts.lato(
          fontSize: 14, fontWeight: FontWeight.w600,
          color: AppColors.textOnPrimary,
        ),
        labelMedium: GoogleFonts.lato(
          fontSize: 12, fontWeight: FontWeight.w500,
          color: AppColors.textSecondary,
        ),
        labelSmall: GoogleFonts.lato(
          fontSize: 11, fontWeight: FontWeight.w500,
          color: AppColors.textHint,
        ),
      ),

      // AppBar
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.textOnPrimary,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.playfairDisplay(
          fontSize: 20, fontWeight: FontWeight.w600,
          color: AppColors.textOnPrimary,
        ),
        iconTheme: const IconThemeData(color: AppColors.textOnPrimary),
      ),

      // Cards
      cardTheme: CardThemeData(
        color: AppColors.surface,
        elevation: 2,
        shadowColor: AppColors.primary.withAlpha(40),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: AppColors.borderLight, width: 0.5),
        ),
        margin: const EdgeInsets.symmetric(horizontal: 0, vertical: 4),
      ),

      // Elevated buttons
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.textOnPrimary,
          elevation: 2,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          textStyle: GoogleFonts.lato(
            fontSize: 16, fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // Outlined buttons
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          side: const BorderSide(color: AppColors.primary, width: 1.5),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          textStyle: GoogleFonts.lato(
            fontSize: 16, fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // Text buttons
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          textStyle: GoogleFonts.lato(
            fontSize: 14, fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // Input fields
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.border, width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.border, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.error, width: 1),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.error, width: 2),
        ),
        labelStyle: GoogleFonts.lato(
          color: AppColors.textSecondary, fontSize: 14,
        ),
        hintStyle: GoogleFonts.lato(
          color: AppColors.textHint, fontSize: 14,
        ),
      ),

      // Chip theme
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.surfaceVariant,
        selectedColor: AppColors.primary,
        labelStyle: GoogleFonts.lato(
          fontSize: 13, color: AppColors.textPrimary,
        ),
        side: const BorderSide(color: AppColors.border, width: 0.5),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),

      // Bottom navigation
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: AppColors.surface,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textHint,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        selectedLabelStyle: GoogleFonts.lato(
          fontSize: 12, fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: GoogleFonts.lato(
          fontSize: 12, fontWeight: FontWeight.normal,
        ),
      ),

      // Drawer
      drawerTheme: DrawerThemeData(
        backgroundColor: AppColors.surface,
        elevation: 4,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.only(
            topRight: Radius.circular(0),
            bottomRight: Radius.circular(0),
          ),
        ),
      ),

      // ListTile
      listTileTheme: ListTileThemeData(
        iconColor: AppColors.primary,
        textColor: AppColors.textPrimary,
        titleTextStyle: GoogleFonts.lato(
          fontSize: 15, fontWeight: FontWeight.w500,
          color: AppColors.textPrimary,
        ),
        subtitleTextStyle: GoogleFonts.lato(
          fontSize: 13, color: AppColors.textSecondary,
        ),
      ),

      // Divider
      dividerTheme: const DividerThemeData(
        color: AppColors.divider,
        thickness: 1,
        space: 1,
      ),

      // SnackBar
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.primary,
        contentTextStyle: GoogleFonts.lato(
          color: AppColors.textOnPrimary, fontSize: 14,
        ),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),

      // Progress indicators
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.primary,
        linearTrackColor: AppColors.surfaceVariant,
      ),

      // Floating action button
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.textOnPrimary,
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),

      // Tab bar
      tabBarTheme: TabBarThemeData(
        labelColor: AppColors.primary,
        unselectedLabelColor: AppColors.textHint,
        indicatorColor: AppColors.accent,
        labelStyle: GoogleFonts.lato(
          fontSize: 14, fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: GoogleFonts.lato(
          fontSize: 14, fontWeight: FontWeight.normal,
        ),
      ),
    );
  }

  /// Dark theme (for future use)
  static ThemeData get darkTheme {
    return lightTheme.copyWith(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.primaryDark,
    );
  }
}
