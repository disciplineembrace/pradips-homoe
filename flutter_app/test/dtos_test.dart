import 'package:flutter_test/flutter_test.dart';
import 'package:pradips_homeo/data/remote/dtos/dtos.dart';

void main() {
  group('RemedyDto', () {
    test('fromJson parses all fields correctly', () {
      final json = {
        'id': 'boericke-belladonna',
        'name': 'Belladonna',
        'author': 'Boericke',
        'source_book': "Boericke's Materia Medica",
        'keynote': 'Deadly Nightshade',
        'full': 'Acts upon every part of the nervous system...',
        'source_pages': 'p. 123',
      };
      final dto = RemedyDto.fromJson(json);
      expect(dto.id, 'boericke-belladonna');
      expect(dto.name, 'Belladonna');
      expect(dto.author, 'Boericke');
      expect(dto.sourceBook, "Boericke's Materia Medica");
      expect(dto.keynote, 'Deadly Nightshade');
      expect(dto.full, contains('nervous system'));
      expect(dto.sourcePages, 'p. 123');
    });

    test('fromJson handles missing fields with defaults', () {
      final dto = RemedyDto.fromJson({});
      expect(dto.id, '');
      expect(dto.name, '');
      expect(dto.author, '');
      expect(dto.sourceBook, isNull);
    });

    test('toJson produces valid JSON', () {
      final dto = RemedyDto(
        id: 'test',
        name: 'Test',
        author: 'Author',
      );
      final json = dto.toJson();
      expect(json['id'], 'test');
      expect(json['name'], 'Test');
      expect(json['author'], 'Author');
    });
  });

  group('RubricDto', () {
    test('fromJson parses rubric with string remedies', () {
      final json = {
        'id': 'kent-mind-fear',
        'source': 'Kent',
        'chapter': 'Mind',
        'title': 'FEAR',
        'fullPath': 'MIND - FEAR',
        'level': 1,
        'remedies': ['Acon|3', 'Bell|4', 'Phos|2'],
        'remedyCount': 3,
      };
      final dto = RubricDto.fromJson(json);
      expect(dto.id, 'kent-mind-fear');
      expect(dto.source, 'Kent');
      expect(dto.title, 'FEAR');
      expect(dto.fullPath, 'MIND - FEAR');
      expect(dto.level, 1);
      expect(dto.remedies.length, 3);
      expect(dto.remedies[0].abbrev, 'Acon');
      expect(dto.remedies[0].grade, 3);
      expect(dto.remedies[1].grade, 4);
    });

    test('fromJson parses rubric with object remedies', () {
      final json = {
        'id': 'test',
        'source': 'Kent',
        'title': 'Test',
        'fullPath': 'TEST',
        'level': 0,
        'remedies': [
          {'abbrev': 'Bell', 'grade': 4},
        ],
      };
      final dto = RubricDto.fromJson(json);
      expect(dto.remedies.length, 1);
      expect(dto.remedies[0].abbrev, 'Bell');
      expect(dto.remedies[0].grade, 4);
    });

    test('remediesJson produces valid JSON string', () {
      final dto = RubricDto(
        id: 'test',
        source: 'Kent',
        chapter: 'Mind',
        title: 'Test',
        fullPath: 'Test',
        level: 0,
        remedies: [ParsedRemedyDto(abbrev: 'Bell', grade: 4)],
        remedyCount: 1,
        byGrade: {},
      );
      expect(dto.remediesJson, contains('"abbrev"'));
      expect(dto.remediesJson, contains('"Bell"'));
      expect(dto.remediesJson, contains('"grade"'));
    });
  });

  group('SearchResultDto', () {
    test('fromJson parses search result', () {
      final json = {
        'type': 'remedy',
        'id': 'belladonna',
        'name': 'Belladonna',
        'author': 'Boericke',
        'source': 'Boericke',
        'matchType': 'exact',
        'matchText': 'Exact remedy name match',
        'snippet': 'Acts upon every part of the nervous system...',
        'href': '/remedy/belladonna',
      };
      final dto = SearchResultDto.fromJson(json);
      expect(dto.type, 'remedy');
      expect(dto.name, 'Belladonna');
      expect(dto.author, 'Boericke');
      expect(dto.matchType, 'exact');
      expect(dto.href, '/remedy/belladonna');
    });
  });

  group('LoginResponse', () {
    test('fromJson parses successful login', () {
      final json = {
        'success': true,
        'user': {
          'id': 'user123',
          'name': 'Test User',
          'email': 'test@example.com',
          'role': 'admin',
        },
        'redirect': '/admin',
      };
      final dto = LoginResponse.fromJson(json);
      expect(dto.success, true);
      expect(dto.user?.id, 'user123');
      expect(dto.user?.name, 'Test User');
      expect(dto.user?.role, 'admin');
      expect(dto.redirect, '/admin');
    });

    test('fromJson parses failed login', () {
      final json = {
        'success': false,
        'error': 'Invalid email or PIN',
      };
      final dto = LoginResponse.fromJson(json);
      expect(dto.success, false);
      expect(dto.error, 'Invalid email or PIN');
      expect(dto.user, isNull);
    });
  });

  group('SessionResponse', () {
    test('authenticated true', () {
      final dto = SessionResponse.fromJson({'authenticated': true});
      expect(dto.authenticated, true);
    });

    test('authenticated false', () {
      final dto = SessionResponse.fromJson({'authenticated': false});
      expect(dto.authenticated, false);
    });
  });

  group('BookDto', () {
    test('fromJson parses book', () {
      final json = {
        'id': 'book1',
        'title': 'Kent Repertory',
        'subtitle': 'A Reference',
        'author': 'James Tyler Kent',
        'category': 'Repertory',
        'totalChapters': 40,
      };
      final dto = BookDto.fromJson(json);
      expect(dto.id, 'book1');
      expect(dto.title, 'Kent Repertory');
      expect(dto.totalChapters, 40);
    });
  });
}
