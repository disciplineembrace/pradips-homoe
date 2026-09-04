import 'package:flutter_test/flutter_test.dart';
import 'package:pradips_homeo/sync/conflict_resolver.dart';

void main() {
  group('ConflictResolver', () {
    final resolver = ConflictResolver();

    group('resolveUserOwned', () {
      test('server deleted, local active → applyServerDelete', () {
        final result = resolver.resolveUserOwned(
          serverRecord: {'deletedAt': '2026-01-01T00:00:00Z'},
          localRecord: {'deletedAt': null},
        );
        expect(result, ConflictResolution.applyServerDelete);
      });

      test('local deleted, server active → keepLocal', () {
        final result = resolver.resolveUserOwned(
          serverRecord: {'deletedAt': null},
          localRecord: {'deletedAt': '2026-01-01T00:00:00Z'},
        );
        expect(result, ConflictResolution.keepLocal);
      });

      test('both deleted → alreadyInSync', () {
        final result = resolver.resolveUserOwned(
          serverRecord: {'deletedAt': '2026-01-01T00:00:00Z'},
          localRecord: {'deletedAt': '2026-01-01T00:00:00Z'},
        );
        expect(result, ConflictResolution.alreadyInSync);
      });

      test('local has pending sync → keepLocal', () {
        final result = resolver.resolveUserOwned(
          serverRecord: {
            'deletedAt': null,
            'updatedAt': '2026-06-01T00:00:00Z',
          },
          localRecord: {
            'deletedAt': null,
            'updatedAt': '2026-01-01T00:00:00Z',
            'syncStatus': 'pending',
          },
        );
        expect(result, ConflictResolution.keepLocal);
      });

      test('server newer, local synced → applyServer', () {
        final result = resolver.resolveUserOwned(
          serverRecord: {
            'deletedAt': null,
            'updatedAt': '2026-06-01T00:00:00Z',
          },
          localRecord: {
            'deletedAt': null,
            'updatedAt': '2026-01-01T00:00:00Z',
            'syncStatus': 'synced',
          },
        );
        expect(result, ConflictResolution.applyServer);
      });

      test('local newer, synced → keepLocal', () {
        final result = resolver.resolveUserOwned(
          serverRecord: {
            'deletedAt': null,
            'updatedAt': '2026-01-01T00:00:00Z',
          },
          localRecord: {
            'deletedAt': null,
            'updatedAt': '2026-06-01T00:00:00Z',
            'syncStatus': 'synced',
          },
        );
        expect(result, ConflictResolution.keepLocal);
      });
    });

    group('isMassDeletionSuspicious', () {
      test('0 deletions → not suspicious', () {
        expect(resolver.isMassDeletionSuspicious(deletionCount: 0, localCount: 1000), false);
      });

      test('5% deletions → not suspicious', () {
        expect(resolver.isMassDeletionSuspicious(deletionCount: 50, localCount: 1000), false);
      });

      test('15% deletions → suspicious', () {
        expect(resolver.isMassDeletionSuspicious(deletionCount: 150, localCount: 1000), true);
      });

      test('0 local count → not suspicious', () {
        expect(resolver.isMassDeletionSuspicious(deletionCount: 100, localCount: 0), false);
      });
    });

    group('resolveServerOwned', () {
      test('no local record → server wins', () async {
        final result = await resolver.resolveServerOwned(
          entityType: 'remedies',
          serverRecord: {'updatedAt': '2026-01-01T00:00:00Z'},
          localRecord: null,
        );
        expect(result, true);
      });

      test('server newer → server wins', () async {
        final result = await resolver.resolveServerOwned(
          entityType: 'remedies',
          serverRecord: {'updatedAt': '2026-06-01T00:00:00Z'},
          localRecord: {'updatedAt': '2026-01-01T00:00:00Z'},
        );
        expect(result, true);
      });

      test('local newer → keep local', () async {
        final result = await resolver.resolveServerOwned(
          entityType: 'remedies',
          serverRecord: {'updatedAt': '2026-01-01T00:00:00Z'},
          localRecord: {'updatedAt': '2026-06-01T00:00:00Z'},
        );
        expect(result, false);
      });
    });
  });
}
