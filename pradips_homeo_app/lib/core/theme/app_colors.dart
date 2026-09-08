import 'package:flutter/material.dart';

/// App Color Palette - matches the website's deep green + cream theme
/// Source: pradips-homoe.vercel.app
class AppColors {
  AppColors._();

  // Primary brand colors
  static const Color primary = Color(0xFF173B2D);       // Deep forest green
  static const Color primaryLight = Color(0xFF2A5C46);  // Lighter green
  static const Color primaryDark = Color(0xFF0E2A20);   // Darker green

  // Backgrounds
  static const Color background = Color(0xFFF5EFE0);    // Cream
  static const Color surface = Color(0xFFFFFBF2);       // Lighter cream
  static const Color surfaceVariant = Color(0xFFEDE5D0); // Subtle cream

  // Accents
  static const Color accent = Color(0xFFC8A24A);        // Gold
  static const Color accentLight = Color(0xFFE0BC6F);   // Light gold
  static const Color accentDark = Color(0xFF9A7B30);    // Dark gold

  // Text
  static const Color textPrimary = Color(0xFF1A1A1A);
  static const Color textSecondary = Color(0xFF4A4A4A);
  static const Color textHint = Color(0xFF8A8A8A);
  static const Color textOnPrimary = Color(0xFFF5EFE0);
  static const Color headingMaroon = Color(0xFF5B2C2C); // Dark maroon for headings

  // Status
  static const Color success = Color(0xFF1B7F3B);
  static const Color warning = Color(0xFFB8860B);
  static const Color error = Color(0xFFA02020);
  static const Color info = Color(0xFF1F5F8B);

  // Grade colors (matching website)
  static const Color grade4 = Color(0xFFC62828); // Red - highest
  static const Color grade3 = Color(0xFF2E7D32); // Green - strong
  static const Color grade2 = Color(0xFF1565C0); // Blue - moderate
  static const Color grade1 = Color(0xFF616161); // Gray - lower

  // Dividers and borders
  static const Color divider = Color(0xFFD4C998);
  static const Color border = Color(0xFFB8AC7A);
  static const Color borderLight = Color(0xFFE8DFB8);

  // Shimmer
  static const Color shimmerBase = Color(0xFFE0E0E0);
  static const Color shimmerHighlight = Color(0xFFF5F5F5);

  // Get grade color
  static Color getGradeColor(int grade) {
    switch (grade) {
      case 4: return grade4;
      case 3: return grade3;
      case 2: return grade2;
      case 1: return grade1;
      default: return textSecondary;
    }
  }
}
