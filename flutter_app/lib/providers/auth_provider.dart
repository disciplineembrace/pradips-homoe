import 'package:flutter/material.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _api;
  
  bool _isLoading = true;
  bool _isAuthenticated = false;
  String? _userName;
  String? _userRole;
  String? _errorMessage;
  String? _sessionCookie;
  
  AuthProvider(this._api) {
    _init();
  }
  
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  String? get userName => _userName;
  String? get userRole => _userRole;
  String? get errorMessage => _errorMessage;
  
  Future<void> _init() async {
    _isLoading = true;
    notifyListeners();
    
    _isLoading = false;
    notifyListeners();
  }
  
  Future<bool> login(String email, String pin) async {
    _errorMessage = null;
    notifyListeners();
    
    try {
      final result = await _api.login(email, pin);
      if (result['success'] == true) {
        _isAuthenticated = true;
        _userName = result['user']?['name'];
        _userRole = result['user']?['role'];
        notifyListeners();
        return true;
      } else {
        _errorMessage = result['error'] ?? 'Login failed';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = 'Network error: $e';
      notifyListeners();
      return false;
    }
  }
  
  Future<void> logout() async {
    await _api.logout();
    _isAuthenticated = false;
    _userName = null;
    _userRole = null;
    notifyListeners();
  }
}
