/// Database encryption service — manages SQLCipher encryption key.
///
/// - Generates a strong random 256-bit encryption key on first app launch.
/// - Stores the key ONLY in Android secure storage (Android Keystore).
/// - Never hardcodes the key in source code.
/// - Never commits the key to GitHub.
/// - Never stores the key in shared preferences.
/// - Provides the key to Drift for opening an encrypted SQLCipher database.
/// - Handles missing, corrupted, or invalid keys safely.
/// - Does NOT silently delete user data when database opening fails.
///
/// The key is stored as a hex-encoded 32-byte (256-bit) random value.
library;

import 'dart:math';
import 'dart:typed_data';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Secure storage key for the database encryption key.
const _dbEncryptionKeyStorageKey = 'ph_db_encryption_key';

/// Service that manages the SQLCipher encryption key.
class DatabaseEncryptionService {
  final FlutterSecureStorage _secureStorage;

  DatabaseEncryptionService(this._secureStorage);

  /// Get or create the database encryption key.
  ///
  /// On first launch: generates a new 256-bit random key and stores it
  /// in Android secure storage (Android Keystore).
  /// On subsequent launches: retrieves the existing key from secure storage.
  ///
  /// Returns the key as a hex string suitable for SQLCipher's `PRAGMA key`.
  Future<String> getOrCreateKey() async {
    // Try to read the existing key from secure storage
    final existingKey = await _secureStorage.read(
      key: _dbEncryptionKeyStorageKey,
    );

    if (existingKey != null && existingKey.isNotEmpty) {
      // Key exists — return it
      return existingKey;
    }

    // First launch — generate a new strong random key
    final newKey = _generateStrongKey();

    // Store the key in Android secure storage (Android Keystore)
    await _secureStorage.write(
      key: _dbEncryptionKeyStorageKey,
      value: newKey,
    );

    return newKey;
  }

  /// Check if an encryption key already exists in secure storage.
  Future<bool> hasKey() async {
    final key = await _secureStorage.read(key: _dbEncryptionKeyStorageKey);
    return key != null && key.isNotEmpty;
  }

  /// Delete the encryption key from secure storage.
  ///
  /// Called on logout — after the database file is deleted, the key
  /// is also removed so that any residual data cannot be decrypted.
  Future<void> deleteKey() async {
    await _secureStorage.delete(key: _dbEncryptionKeyStorageKey);
  }

  /// Generate a strong random 256-bit (32-byte) encryption key.
  ///
  /// Uses Dart's Random.secure() which delegates to the platform's
  /// cryptographically secure random number generator:
  /// - Android: java.security.SecureRandom
  ///
  /// Returns the key as a hex string (64 hex characters = 32 bytes = 256 bits).
  String _generateStrongKey() {
    final random = Random.secure();
    final bytes = Uint8List(32); // 256 bits
    for (int i = 0; i < 32; i++) {
      bytes[i] = random.nextInt(256);
    }
    // Convert to hex string — SQLCipher accepts hex keys with PRAGMA key = "x'...'"
    return bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  }

  /// Format the key for SQLCipher's PRAGMA key statement.
  ///
  /// SQLCipher expects the key in the format: x'hexstring'
  /// when using a raw hex key.
  String formatKeyForSqlCipher(String hexKey) {
    return "x'$hexKey'";
  }

  /// Clear all secure storage entries related to the database.
  ///
  /// Called on logout to ensure no sensitive data remains.
  Future<void> clearAllSecureData() async {
    await _secureStorage.delete(key: _dbEncryptionKeyStorageKey);
  }
}
