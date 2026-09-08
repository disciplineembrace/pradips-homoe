import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  final String baseUrl;
  String? _sessionCookie;
  
  ApiService({required this.baseUrl});
  
  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (_sessionCookie != null) 'Cookie': 'ph_session=$_sessionCookie',
  };
  
  Future<Map<String, dynamic>> login(String email, String pin) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/login'),
      headers: _headers,
      body: jsonEncode({'email': email, 'pin': pin}),
    );
    
    final setCookie = response.headers['set-cookie'];
    if (setCookie != null) {
      final match = RegExp(r'ph_session=([^;]+)').firstMatch(setCookie);
      if (match != null) {
        _sessionCookie = match.group(1);
      }
    }
    
    return jsonDecode(response.body);
  }
  
  Future<void> restoreSession() async {}
  
  Future<void> logout() async {
    await http.post(Uri.parse('$baseUrl/api/auth/logout'), headers: _headers);
    _sessionCookie = null;
  }
  
  Future<Map<String, dynamic>> getSession() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/auth/session'),
      headers: _headers,
    );
    return jsonDecode(response.body);
  }
  
  Future<Map<String, dynamic>> getRemedies({
    String author = '', String letter = '', String q = '',
    int page = 1, int pageSize = 50,
  }) async {
    final params = <String, String>{
      'page': page.toString(), 'pageSize': pageSize.toString(),
    };
    if (author.isNotEmpty) params['author'] = author;
    if (letter.isNotEmpty) params['letter'] = letter;
    if (q.isNotEmpty) params['q'] = q;
    
    final response = await http.get(
      Uri.parse('$baseUrl/api/remedies').replace(queryParameters: params),
      headers: _headers,
    );
    return jsonDecode(response.body);
  }
  
  Future<Map<String, dynamic>> getRemedy(String id) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/remedies/$id'),
      headers: _headers,
    );
    return jsonDecode(response.body);
  }
  
  Future<Map<String, dynamic>> getRubricTree({
    String author = '', String chapter = '', String q = '',
    int page = 1, int pageSize = 20,
  }) async {
    final params = <String, String>{
      'page': page.toString(), 'pageSize': pageSize.toString(),
    };
    if (author.isNotEmpty) params['author'] = author;
    if (chapter.isNotEmpty) params['chapter'] = chapter;
    if (q.isNotEmpty) params['q'] = q;
    
    final response = await http.get(
      Uri.parse('$baseUrl/api/rubrics/tree').replace(queryParameters: params),
      headers: _headers,
    );
    return jsonDecode(response.body);
  }
  
  Future<Map<String, dynamic>> getRubricChapters(String author) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/rubrics/chapters?author=$author'),
      headers: _headers,
    );
    return jsonDecode(response.body);
  }
  
  Future<Map<String, dynamic>> search(String query) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/search?q=${Uri.encodeQueryComponent(query)}'),
      headers: _headers,
    );
    return jsonDecode(response.body);
  }
  
  Future<Map<String, dynamic>> clinicalSearch(String query) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/clinical-search?q=${Uri.encodeQueryComponent(query)}'),
      headers: _headers,
    );
    return jsonDecode(response.body);
  }
  
  Future<Map<String, dynamic>> getTherapeutics() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/therapeutics'),
      headers: _headers,
    );
    return jsonDecode(response.body);
  }
  
  Future<Map<String, dynamic>> getSynthesisStats() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/synthesis?action=stats'),
      headers: _headers,
    );
    return jsonDecode(response.body);
  }
}
