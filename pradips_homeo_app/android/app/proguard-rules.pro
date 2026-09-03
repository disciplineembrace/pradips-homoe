# Flutter / Android ProGuard rules for Pradip's Homeo

# Keep Flutter engine classes
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Keep native plugin classes
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.embedding.** { *; }

# Keep all classes in the app package
-keep class com.pradipshomeo.pradips_homeo.** { *; }
-keep class com.pradipshomeo.pradips_homeo.MainActivity { *; }

# Keep Parcelable creators
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator CREATOR;
}

# Keep R classes for resource access
-keepclassmembers class **.R$* {
    public *;
}

# Suppress warnings for missing optional Google services
-dontwarn com.google.android.gms.**

# Keep shared preferences (used for session storage)
-keep class androidx.security.** { *; }

# URL launcher
-keep class io.flutter.plugins.urllauncher.** { *; }

# HTTP client (http package)
-keep class io.flutter.plugins.urllauncher.** { *; }
-dontwarn io.flutter.plugins.urllauncher.**

# Shared preferences
-keep class io.flutter.plugins.sharedpreferences.** { *; }
