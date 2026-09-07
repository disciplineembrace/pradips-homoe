import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Brand Colors
  static const Color primaryGreen = Color(0xFF173B2D);
  static const Color darkGreen = Color(0xFF0D2820);
  static const Color cream = Color(0xFFF5EFE0);
  static const Color gold = Color(0xFFC8A24A);
  static const Color darkMaroon = Color(0xFF6E2A3A);
  static const Color charcoal = Color(0xFF2C2C2C);
  
  static ThemeData get lightTheme => ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    primaryColor: primaryGreen,
    scaffoldBackgroundColor: cream,
    colorScheme: const ColorScheme.light(
      primary: primaryGreen,
      secondary: gold,
      surface: Colors.white,
      error: darkMaroon,
      onPrimary: Colors.white,
      onSecondary: primaryGreen,
      onSurface: charcoal,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: primaryGreen,
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: GoogleFonts.fraunces(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: Colors.white,
      ),
    ),
    textTheme: TextTheme(
      headlineLarge: GoogleFonts.fraunces(fontSize: 28, fontWeight: FontWeight.bold, color: primaryGreen),
      headlineMedium: GoogleFonts.fraunces(fontSize: 24, fontWeight: FontWeight.w600, color: primaryGreen),
      titleLarge: GoogleFonts.fraunces(fontSize: 20, fontWeight: FontWeight.w600, color: primaryGreen),
      bodyLarge: GoogleFonts.inter(fontSize: 16, color: charcoal),
      bodyMedium: GoogleFonts.inter(fontSize: 14, color: charcoal),
      bodySmall: GoogleFonts.inter(fontSize: 12, color: Colors.grey),
    ),
    cardTheme: CardTheme(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      color: Colors.white,
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: Colors.white,
      selectedItemColor: primaryGreen,
      unselectedItemColor: Colors.grey,
      type: BottomNavigationBarType.fixed,
    ),
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      filled: true,
      fillColor: Colors.white,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryGreen,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
      ),
    ),
  );
  
  static ThemeData get darkTheme => ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    primaryColor: primaryGreen,
    scaffoldBackgroundColor: const Color(0xFF1A1A1A),
    colorScheme: const ColorScheme.dark(
      primary: gold,
      secondary: primaryGreen,
      surface: Color(0xFF2A2A2A),
      error: Colors.redAccent,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: const Color(0xFF1A1A1A),
      foregroundColor: Colors.white,
      elevation: 0,
    ),
    cardTheme: CardTheme(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      color: const Color(0xFF2A2A2A),
    ),
  );
}
