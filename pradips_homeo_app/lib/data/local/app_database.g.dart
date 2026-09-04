// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $RemediesTable extends Remedies
    with TableInfo<$RemediesTable, RemedyRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $RemediesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
      'name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _commonMeta = const VerificationMeta('common');
  @override
  late final GeneratedColumn<String> common = GeneratedColumn<String>(
      'common', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant(''));
  static const VerificationMeta _authorMeta = const VerificationMeta('author');
  @override
  late final GeneratedColumn<String> author = GeneratedColumn<String>(
      'author', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _letterMeta = const VerificationMeta('letter');
  @override
  late final GeneratedColumn<String> letter = GeneratedColumn<String>(
      'letter', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant(''));
  static const VerificationMeta _chapterMeta =
      const VerificationMeta('chapter');
  @override
  late final GeneratedColumn<String> chapter = GeneratedColumn<String>(
      'chapter', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant(''));
  static const VerificationMeta _organMeta = const VerificationMeta('organ');
  @override
  late final GeneratedColumn<String> organ = GeneratedColumn<String>(
      'organ', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant(''));
  static const VerificationMeta _keynoteMeta =
      const VerificationMeta('keynote');
  @override
  late final GeneratedColumn<String> keynote = GeneratedColumn<String>(
      'keynote', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant(''));
  static const VerificationMeta _sourceMeta = const VerificationMeta('source');
  @override
  late final GeneratedColumn<String> source = GeneratedColumn<String>(
      'source', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
      'updated_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  static const VerificationMeta _versionMeta =
      const VerificationMeta('version');
  @override
  late final GeneratedColumn<int> version = GeneratedColumn<int>(
      'version', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(1));
  @override
  List<GeneratedColumn> get $columns => [
        id,
        name,
        common,
        author,
        letter,
        chapter,
        organ,
        keynote,
        source,
        updatedAt,
        version
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'remedies';
  @override
  VerificationContext validateIntegrity(Insertable<RemedyRow> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
          _nameMeta, name.isAcceptableOrUnknown(data['name']!, _nameMeta));
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('common')) {
      context.handle(_commonMeta,
          common.isAcceptableOrUnknown(data['common']!, _commonMeta));
    }
    if (data.containsKey('author')) {
      context.handle(_authorMeta,
          author.isAcceptableOrUnknown(data['author']!, _authorMeta));
    } else if (isInserting) {
      context.missing(_authorMeta);
    }
    if (data.containsKey('letter')) {
      context.handle(_letterMeta,
          letter.isAcceptableOrUnknown(data['letter']!, _letterMeta));
    }
    if (data.containsKey('chapter')) {
      context.handle(_chapterMeta,
          chapter.isAcceptableOrUnknown(data['chapter']!, _chapterMeta));
    }
    if (data.containsKey('organ')) {
      context.handle(
          _organMeta, organ.isAcceptableOrUnknown(data['organ']!, _organMeta));
    }
    if (data.containsKey('keynote')) {
      context.handle(_keynoteMeta,
          keynote.isAcceptableOrUnknown(data['keynote']!, _keynoteMeta));
    }
    if (data.containsKey('source')) {
      context.handle(_sourceMeta,
          source.isAcceptableOrUnknown(data['source']!, _sourceMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    if (data.containsKey('version')) {
      context.handle(_versionMeta,
          version.isAcceptableOrUnknown(data['version']!, _versionMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  RemedyRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return RemedyRow(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      name: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}name'])!,
      common: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}common'])!,
      author: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}author'])!,
      letter: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}letter'])!,
      chapter: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}chapter'])!,
      organ: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}organ'])!,
      keynote: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}keynote'])!,
      source: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}source']),
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
      version: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}version'])!,
    );
  }

  @override
  $RemediesTable createAlias(String alias) {
    return $RemediesTable(attachedDatabase, alias);
  }
}

class RemedyRow extends DataClass implements Insertable<RemedyRow> {
  final String id;
  final String name;
  final String common;
  final String author;
  final String letter;
  final String chapter;
  final String organ;
  final String keynote;
  final String? source;
  final DateTime updatedAt;
  final int version;
  const RemedyRow(
      {required this.id,
      required this.name,
      required this.common,
      required this.author,
      required this.letter,
      required this.chapter,
      required this.organ,
      required this.keynote,
      this.source,
      required this.updatedAt,
      required this.version});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['name'] = Variable<String>(name);
    map['common'] = Variable<String>(common);
    map['author'] = Variable<String>(author);
    map['letter'] = Variable<String>(letter);
    map['chapter'] = Variable<String>(chapter);
    map['organ'] = Variable<String>(organ);
    map['keynote'] = Variable<String>(keynote);
    if (!nullToAbsent || source != null) {
      map['source'] = Variable<String>(source);
    }
    map['updated_at'] = Variable<DateTime>(updatedAt);
    map['version'] = Variable<int>(version);
    return map;
  }

  RemediesCompanion toCompanion(bool nullToAbsent) {
    return RemediesCompanion(
      id: Value(id),
      name: Value(name),
      common: Value(common),
      author: Value(author),
      letter: Value(letter),
      chapter: Value(chapter),
      organ: Value(organ),
      keynote: Value(keynote),
      source:
          source == null && nullToAbsent ? const Value.absent() : Value(source),
      updatedAt: Value(updatedAt),
      version: Value(version),
    );
  }

  factory RemedyRow.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return RemedyRow(
      id: serializer.fromJson<String>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      common: serializer.fromJson<String>(json['common']),
      author: serializer.fromJson<String>(json['author']),
      letter: serializer.fromJson<String>(json['letter']),
      chapter: serializer.fromJson<String>(json['chapter']),
      organ: serializer.fromJson<String>(json['organ']),
      keynote: serializer.fromJson<String>(json['keynote']),
      source: serializer.fromJson<String?>(json['source']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      version: serializer.fromJson<int>(json['version']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'name': serializer.toJson<String>(name),
      'common': serializer.toJson<String>(common),
      'author': serializer.toJson<String>(author),
      'letter': serializer.toJson<String>(letter),
      'chapter': serializer.toJson<String>(chapter),
      'organ': serializer.toJson<String>(organ),
      'keynote': serializer.toJson<String>(keynote),
      'source': serializer.toJson<String?>(source),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'version': serializer.toJson<int>(version),
    };
  }

  RemedyRow copyWith(
          {String? id,
          String? name,
          String? common,
          String? author,
          String? letter,
          String? chapter,
          String? organ,
          String? keynote,
          Value<String?> source = const Value.absent(),
          DateTime? updatedAt,
          int? version}) =>
      RemedyRow(
        id: id ?? this.id,
        name: name ?? this.name,
        common: common ?? this.common,
        author: author ?? this.author,
        letter: letter ?? this.letter,
        chapter: chapter ?? this.chapter,
        organ: organ ?? this.organ,
        keynote: keynote ?? this.keynote,
        source: source.present ? source.value : this.source,
        updatedAt: updatedAt ?? this.updatedAt,
        version: version ?? this.version,
      );
  RemedyRow copyWithCompanion(RemediesCompanion data) {
    return RemedyRow(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      common: data.common.present ? data.common.value : this.common,
      author: data.author.present ? data.author.value : this.author,
      letter: data.letter.present ? data.letter.value : this.letter,
      chapter: data.chapter.present ? data.chapter.value : this.chapter,
      organ: data.organ.present ? data.organ.value : this.organ,
      keynote: data.keynote.present ? data.keynote.value : this.keynote,
      source: data.source.present ? data.source.value : this.source,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      version: data.version.present ? data.version.value : this.version,
    );
  }

  @override
  String toString() {
    return (StringBuffer('RemedyRow(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('common: $common, ')
          ..write('author: $author, ')
          ..write('letter: $letter, ')
          ..write('chapter: $chapter, ')
          ..write('organ: $organ, ')
          ..write('keynote: $keynote, ')
          ..write('source: $source, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('version: $version')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, name, common, author, letter, chapter,
      organ, keynote, source, updatedAt, version);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is RemedyRow &&
          other.id == this.id &&
          other.name == this.name &&
          other.common == this.common &&
          other.author == this.author &&
          other.letter == this.letter &&
          other.chapter == this.chapter &&
          other.organ == this.organ &&
          other.keynote == this.keynote &&
          other.source == this.source &&
          other.updatedAt == this.updatedAt &&
          other.version == this.version);
}

class RemediesCompanion extends UpdateCompanion<RemedyRow> {
  final Value<String> id;
  final Value<String> name;
  final Value<String> common;
  final Value<String> author;
  final Value<String> letter;
  final Value<String> chapter;
  final Value<String> organ;
  final Value<String> keynote;
  final Value<String?> source;
  final Value<DateTime> updatedAt;
  final Value<int> version;
  final Value<int> rowid;
  const RemediesCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.common = const Value.absent(),
    this.author = const Value.absent(),
    this.letter = const Value.absent(),
    this.chapter = const Value.absent(),
    this.organ = const Value.absent(),
    this.keynote = const Value.absent(),
    this.source = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.version = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  RemediesCompanion.insert({
    required String id,
    required String name,
    this.common = const Value.absent(),
    required String author,
    this.letter = const Value.absent(),
    this.chapter = const Value.absent(),
    this.organ = const Value.absent(),
    this.keynote = const Value.absent(),
    this.source = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.version = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        name = Value(name),
        author = Value(author);
  static Insertable<RemedyRow> custom({
    Expression<String>? id,
    Expression<String>? name,
    Expression<String>? common,
    Expression<String>? author,
    Expression<String>? letter,
    Expression<String>? chapter,
    Expression<String>? organ,
    Expression<String>? keynote,
    Expression<String>? source,
    Expression<DateTime>? updatedAt,
    Expression<int>? version,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (common != null) 'common': common,
      if (author != null) 'author': author,
      if (letter != null) 'letter': letter,
      if (chapter != null) 'chapter': chapter,
      if (organ != null) 'organ': organ,
      if (keynote != null) 'keynote': keynote,
      if (source != null) 'source': source,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (version != null) 'version': version,
      if (rowid != null) 'rowid': rowid,
    });
  }

  RemediesCompanion copyWith(
      {Value<String>? id,
      Value<String>? name,
      Value<String>? common,
      Value<String>? author,
      Value<String>? letter,
      Value<String>? chapter,
      Value<String>? organ,
      Value<String>? keynote,
      Value<String?>? source,
      Value<DateTime>? updatedAt,
      Value<int>? version,
      Value<int>? rowid}) {
    return RemediesCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      common: common ?? this.common,
      author: author ?? this.author,
      letter: letter ?? this.letter,
      chapter: chapter ?? this.chapter,
      organ: organ ?? this.organ,
      keynote: keynote ?? this.keynote,
      source: source ?? this.source,
      updatedAt: updatedAt ?? this.updatedAt,
      version: version ?? this.version,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (common.present) {
      map['common'] = Variable<String>(common.value);
    }
    if (author.present) {
      map['author'] = Variable<String>(author.value);
    }
    if (letter.present) {
      map['letter'] = Variable<String>(letter.value);
    }
    if (chapter.present) {
      map['chapter'] = Variable<String>(chapter.value);
    }
    if (organ.present) {
      map['organ'] = Variable<String>(organ.value);
    }
    if (keynote.present) {
      map['keynote'] = Variable<String>(keynote.value);
    }
    if (source.present) {
      map['source'] = Variable<String>(source.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (version.present) {
      map['version'] = Variable<int>(version.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('RemediesCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('common: $common, ')
          ..write('author: $author, ')
          ..write('letter: $letter, ')
          ..write('chapter: $chapter, ')
          ..write('organ: $organ, ')
          ..write('keynote: $keynote, ')
          ..write('source: $source, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('version: $version, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $RubricsTable extends Rubrics with TableInfo<$RubricsTable, RubricRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $RubricsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _mainMeta = const VerificationMeta('main');
  @override
  late final GeneratedColumn<String> main = GeneratedColumn<String>(
      'main', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _chapterMeta =
      const VerificationMeta('chapter');
  @override
  late final GeneratedColumn<String> chapter = GeneratedColumn<String>(
      'chapter', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant(''));
  static const VerificationMeta _authorMeta = const VerificationMeta('author');
  @override
  late final GeneratedColumn<String> author = GeneratedColumn<String>(
      'author', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant(''));
  static const VerificationMeta _parentIdMeta =
      const VerificationMeta('parentId');
  @override
  late final GeneratedColumn<String> parentId = GeneratedColumn<String>(
      'parent_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _remediesJsonMeta =
      const VerificationMeta('remediesJson');
  @override
  late final GeneratedColumn<String> remediesJson = GeneratedColumn<String>(
      'remedies_json', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('[]'));
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
      'updated_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  static const VerificationMeta _versionMeta =
      const VerificationMeta('version');
  @override
  late final GeneratedColumn<int> version = GeneratedColumn<int>(
      'version', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(1));
  @override
  List<GeneratedColumn> get $columns =>
      [id, main, chapter, author, parentId, remediesJson, updatedAt, version];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'rubrics';
  @override
  VerificationContext validateIntegrity(Insertable<RubricRow> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('main')) {
      context.handle(
          _mainMeta, main.isAcceptableOrUnknown(data['main']!, _mainMeta));
    } else if (isInserting) {
      context.missing(_mainMeta);
    }
    if (data.containsKey('chapter')) {
      context.handle(_chapterMeta,
          chapter.isAcceptableOrUnknown(data['chapter']!, _chapterMeta));
    }
    if (data.containsKey('author')) {
      context.handle(_authorMeta,
          author.isAcceptableOrUnknown(data['author']!, _authorMeta));
    }
    if (data.containsKey('parent_id')) {
      context.handle(_parentIdMeta,
          parentId.isAcceptableOrUnknown(data['parent_id']!, _parentIdMeta));
    }
    if (data.containsKey('remedies_json')) {
      context.handle(
          _remediesJsonMeta,
          remediesJson.isAcceptableOrUnknown(
              data['remedies_json']!, _remediesJsonMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    if (data.containsKey('version')) {
      context.handle(_versionMeta,
          version.isAcceptableOrUnknown(data['version']!, _versionMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  RubricRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return RubricRow(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      main: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}main'])!,
      chapter: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}chapter'])!,
      author: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}author'])!,
      parentId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}parent_id']),
      remediesJson: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}remedies_json'])!,
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
      version: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}version'])!,
    );
  }

  @override
  $RubricsTable createAlias(String alias) {
    return $RubricsTable(attachedDatabase, alias);
  }
}

class RubricRow extends DataClass implements Insertable<RubricRow> {
  final String id;
  final String main;
  final String chapter;
  final String author;
  final String? parentId;
  final String remediesJson;
  final DateTime updatedAt;
  final int version;
  const RubricRow(
      {required this.id,
      required this.main,
      required this.chapter,
      required this.author,
      this.parentId,
      required this.remediesJson,
      required this.updatedAt,
      required this.version});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['main'] = Variable<String>(main);
    map['chapter'] = Variable<String>(chapter);
    map['author'] = Variable<String>(author);
    if (!nullToAbsent || parentId != null) {
      map['parent_id'] = Variable<String>(parentId);
    }
    map['remedies_json'] = Variable<String>(remediesJson);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    map['version'] = Variable<int>(version);
    return map;
  }

  RubricsCompanion toCompanion(bool nullToAbsent) {
    return RubricsCompanion(
      id: Value(id),
      main: Value(main),
      chapter: Value(chapter),
      author: Value(author),
      parentId: parentId == null && nullToAbsent
          ? const Value.absent()
          : Value(parentId),
      remediesJson: Value(remediesJson),
      updatedAt: Value(updatedAt),
      version: Value(version),
    );
  }

  factory RubricRow.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return RubricRow(
      id: serializer.fromJson<String>(json['id']),
      main: serializer.fromJson<String>(json['main']),
      chapter: serializer.fromJson<String>(json['chapter']),
      author: serializer.fromJson<String>(json['author']),
      parentId: serializer.fromJson<String?>(json['parentId']),
      remediesJson: serializer.fromJson<String>(json['remediesJson']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      version: serializer.fromJson<int>(json['version']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'main': serializer.toJson<String>(main),
      'chapter': serializer.toJson<String>(chapter),
      'author': serializer.toJson<String>(author),
      'parentId': serializer.toJson<String?>(parentId),
      'remediesJson': serializer.toJson<String>(remediesJson),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'version': serializer.toJson<int>(version),
    };
  }

  RubricRow copyWith(
          {String? id,
          String? main,
          String? chapter,
          String? author,
          Value<String?> parentId = const Value.absent(),
          String? remediesJson,
          DateTime? updatedAt,
          int? version}) =>
      RubricRow(
        id: id ?? this.id,
        main: main ?? this.main,
        chapter: chapter ?? this.chapter,
        author: author ?? this.author,
        parentId: parentId.present ? parentId.value : this.parentId,
        remediesJson: remediesJson ?? this.remediesJson,
        updatedAt: updatedAt ?? this.updatedAt,
        version: version ?? this.version,
      );
  RubricRow copyWithCompanion(RubricsCompanion data) {
    return RubricRow(
      id: data.id.present ? data.id.value : this.id,
      main: data.main.present ? data.main.value : this.main,
      chapter: data.chapter.present ? data.chapter.value : this.chapter,
      author: data.author.present ? data.author.value : this.author,
      parentId: data.parentId.present ? data.parentId.value : this.parentId,
      remediesJson: data.remediesJson.present
          ? data.remediesJson.value
          : this.remediesJson,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      version: data.version.present ? data.version.value : this.version,
    );
  }

  @override
  String toString() {
    return (StringBuffer('RubricRow(')
          ..write('id: $id, ')
          ..write('main: $main, ')
          ..write('chapter: $chapter, ')
          ..write('author: $author, ')
          ..write('parentId: $parentId, ')
          ..write('remediesJson: $remediesJson, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('version: $version')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id, main, chapter, author, parentId, remediesJson, updatedAt, version);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is RubricRow &&
          other.id == this.id &&
          other.main == this.main &&
          other.chapter == this.chapter &&
          other.author == this.author &&
          other.parentId == this.parentId &&
          other.remediesJson == this.remediesJson &&
          other.updatedAt == this.updatedAt &&
          other.version == this.version);
}

class RubricsCompanion extends UpdateCompanion<RubricRow> {
  final Value<String> id;
  final Value<String> main;
  final Value<String> chapter;
  final Value<String> author;
  final Value<String?> parentId;
  final Value<String> remediesJson;
  final Value<DateTime> updatedAt;
  final Value<int> version;
  final Value<int> rowid;
  const RubricsCompanion({
    this.id = const Value.absent(),
    this.main = const Value.absent(),
    this.chapter = const Value.absent(),
    this.author = const Value.absent(),
    this.parentId = const Value.absent(),
    this.remediesJson = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.version = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  RubricsCompanion.insert({
    required String id,
    required String main,
    this.chapter = const Value.absent(),
    this.author = const Value.absent(),
    this.parentId = const Value.absent(),
    this.remediesJson = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.version = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        main = Value(main);
  static Insertable<RubricRow> custom({
    Expression<String>? id,
    Expression<String>? main,
    Expression<String>? chapter,
    Expression<String>? author,
    Expression<String>? parentId,
    Expression<String>? remediesJson,
    Expression<DateTime>? updatedAt,
    Expression<int>? version,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (main != null) 'main': main,
      if (chapter != null) 'chapter': chapter,
      if (author != null) 'author': author,
      if (parentId != null) 'parent_id': parentId,
      if (remediesJson != null) 'remedies_json': remediesJson,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (version != null) 'version': version,
      if (rowid != null) 'rowid': rowid,
    });
  }

  RubricsCompanion copyWith(
      {Value<String>? id,
      Value<String>? main,
      Value<String>? chapter,
      Value<String>? author,
      Value<String?>? parentId,
      Value<String>? remediesJson,
      Value<DateTime>? updatedAt,
      Value<int>? version,
      Value<int>? rowid}) {
    return RubricsCompanion(
      id: id ?? this.id,
      main: main ?? this.main,
      chapter: chapter ?? this.chapter,
      author: author ?? this.author,
      parentId: parentId ?? this.parentId,
      remediesJson: remediesJson ?? this.remediesJson,
      updatedAt: updatedAt ?? this.updatedAt,
      version: version ?? this.version,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (main.present) {
      map['main'] = Variable<String>(main.value);
    }
    if (chapter.present) {
      map['chapter'] = Variable<String>(chapter.value);
    }
    if (author.present) {
      map['author'] = Variable<String>(author.value);
    }
    if (parentId.present) {
      map['parent_id'] = Variable<String>(parentId.value);
    }
    if (remediesJson.present) {
      map['remedies_json'] = Variable<String>(remediesJson.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (version.present) {
      map['version'] = Variable<int>(version.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('RubricsCompanion(')
          ..write('id: $id, ')
          ..write('main: $main, ')
          ..write('chapter: $chapter, ')
          ..write('author: $author, ')
          ..write('parentId: $parentId, ')
          ..write('remediesJson: $remediesJson, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('version: $version, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $SynthesisRubricsTable extends SynthesisRubrics
    with TableInfo<$SynthesisRubricsTable, SynthesisRubric> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SynthesisRubricsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _mainMeta = const VerificationMeta('main');
  @override
  late final GeneratedColumn<String> main = GeneratedColumn<String>(
      'main', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _chapterMeta =
      const VerificationMeta('chapter');
  @override
  late final GeneratedColumn<String> chapter = GeneratedColumn<String>(
      'chapter', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant(''));
  static const VerificationMeta _authorMeta = const VerificationMeta('author');
  @override
  late final GeneratedColumn<String> author = GeneratedColumn<String>(
      'author', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant(''));
  static const VerificationMeta _parentIdMeta =
      const VerificationMeta('parentId');
  @override
  late final GeneratedColumn<String> parentId = GeneratedColumn<String>(
      'parent_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _remediesJsonMeta =
      const VerificationMeta('remediesJson');
  @override
  late final GeneratedColumn<String> remediesJson = GeneratedColumn<String>(
      'remedies_json', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('[]'));
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
      'updated_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  static const VerificationMeta _versionMeta =
      const VerificationMeta('version');
  @override
  late final GeneratedColumn<int> version = GeneratedColumn<int>(
      'version', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(1));
  @override
  List<GeneratedColumn> get $columns =>
      [id, main, chapter, author, parentId, remediesJson, updatedAt, version];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'synthesis_rubrics';
  @override
  VerificationContext validateIntegrity(Insertable<SynthesisRubric> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('main')) {
      context.handle(
          _mainMeta, main.isAcceptableOrUnknown(data['main']!, _mainMeta));
    } else if (isInserting) {
      context.missing(_mainMeta);
    }
    if (data.containsKey('chapter')) {
      context.handle(_chapterMeta,
          chapter.isAcceptableOrUnknown(data['chapter']!, _chapterMeta));
    }
    if (data.containsKey('author')) {
      context.handle(_authorMeta,
          author.isAcceptableOrUnknown(data['author']!, _authorMeta));
    }
    if (data.containsKey('parent_id')) {
      context.handle(_parentIdMeta,
          parentId.isAcceptableOrUnknown(data['parent_id']!, _parentIdMeta));
    }
    if (data.containsKey('remedies_json')) {
      context.handle(
          _remediesJsonMeta,
          remediesJson.isAcceptableOrUnknown(
              data['remedies_json']!, _remediesJsonMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    if (data.containsKey('version')) {
      context.handle(_versionMeta,
          version.isAcceptableOrUnknown(data['version']!, _versionMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  SynthesisRubric map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SynthesisRubric(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      main: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}main'])!,
      chapter: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}chapter'])!,
      author: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}author'])!,
      parentId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}parent_id']),
      remediesJson: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}remedies_json'])!,
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
      version: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}version'])!,
    );
  }

  @override
  $SynthesisRubricsTable createAlias(String alias) {
    return $SynthesisRubricsTable(attachedDatabase, alias);
  }
}

class SynthesisRubric extends DataClass implements Insertable<SynthesisRubric> {
  final String id;
  final String main;
  final String chapter;
  final String author;
  final String? parentId;
  final String remediesJson;
  final DateTime updatedAt;
  final int version;
  const SynthesisRubric(
      {required this.id,
      required this.main,
      required this.chapter,
      required this.author,
      this.parentId,
      required this.remediesJson,
      required this.updatedAt,
      required this.version});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['main'] = Variable<String>(main);
    map['chapter'] = Variable<String>(chapter);
    map['author'] = Variable<String>(author);
    if (!nullToAbsent || parentId != null) {
      map['parent_id'] = Variable<String>(parentId);
    }
    map['remedies_json'] = Variable<String>(remediesJson);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    map['version'] = Variable<int>(version);
    return map;
  }

  SynthesisRubricsCompanion toCompanion(bool nullToAbsent) {
    return SynthesisRubricsCompanion(
      id: Value(id),
      main: Value(main),
      chapter: Value(chapter),
      author: Value(author),
      parentId: parentId == null && nullToAbsent
          ? const Value.absent()
          : Value(parentId),
      remediesJson: Value(remediesJson),
      updatedAt: Value(updatedAt),
      version: Value(version),
    );
  }

  factory SynthesisRubric.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SynthesisRubric(
      id: serializer.fromJson<String>(json['id']),
      main: serializer.fromJson<String>(json['main']),
      chapter: serializer.fromJson<String>(json['chapter']),
      author: serializer.fromJson<String>(json['author']),
      parentId: serializer.fromJson<String?>(json['parentId']),
      remediesJson: serializer.fromJson<String>(json['remediesJson']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      version: serializer.fromJson<int>(json['version']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'main': serializer.toJson<String>(main),
      'chapter': serializer.toJson<String>(chapter),
      'author': serializer.toJson<String>(author),
      'parentId': serializer.toJson<String?>(parentId),
      'remediesJson': serializer.toJson<String>(remediesJson),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'version': serializer.toJson<int>(version),
    };
  }

  SynthesisRubric copyWith(
          {String? id,
          String? main,
          String? chapter,
          String? author,
          Value<String?> parentId = const Value.absent(),
          String? remediesJson,
          DateTime? updatedAt,
          int? version}) =>
      SynthesisRubric(
        id: id ?? this.id,
        main: main ?? this.main,
        chapter: chapter ?? this.chapter,
        author: author ?? this.author,
        parentId: parentId.present ? parentId.value : this.parentId,
        remediesJson: remediesJson ?? this.remediesJson,
        updatedAt: updatedAt ?? this.updatedAt,
        version: version ?? this.version,
      );
  SynthesisRubric copyWithCompanion(SynthesisRubricsCompanion data) {
    return SynthesisRubric(
      id: data.id.present ? data.id.value : this.id,
      main: data.main.present ? data.main.value : this.main,
      chapter: data.chapter.present ? data.chapter.value : this.chapter,
      author: data.author.present ? data.author.value : this.author,
      parentId: data.parentId.present ? data.parentId.value : this.parentId,
      remediesJson: data.remediesJson.present
          ? data.remediesJson.value
          : this.remediesJson,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      version: data.version.present ? data.version.value : this.version,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SynthesisRubric(')
          ..write('id: $id, ')
          ..write('main: $main, ')
          ..write('chapter: $chapter, ')
          ..write('author: $author, ')
          ..write('parentId: $parentId, ')
          ..write('remediesJson: $remediesJson, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('version: $version')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id, main, chapter, author, parentId, remediesJson, updatedAt, version);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SynthesisRubric &&
          other.id == this.id &&
          other.main == this.main &&
          other.chapter == this.chapter &&
          other.author == this.author &&
          other.parentId == this.parentId &&
          other.remediesJson == this.remediesJson &&
          other.updatedAt == this.updatedAt &&
          other.version == this.version);
}

class SynthesisRubricsCompanion extends UpdateCompanion<SynthesisRubric> {
  final Value<String> id;
  final Value<String> main;
  final Value<String> chapter;
  final Value<String> author;
  final Value<String?> parentId;
  final Value<String> remediesJson;
  final Value<DateTime> updatedAt;
  final Value<int> version;
  final Value<int> rowid;
  const SynthesisRubricsCompanion({
    this.id = const Value.absent(),
    this.main = const Value.absent(),
    this.chapter = const Value.absent(),
    this.author = const Value.absent(),
    this.parentId = const Value.absent(),
    this.remediesJson = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.version = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  SynthesisRubricsCompanion.insert({
    required String id,
    required String main,
    this.chapter = const Value.absent(),
    this.author = const Value.absent(),
    this.parentId = const Value.absent(),
    this.remediesJson = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.version = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        main = Value(main);
  static Insertable<SynthesisRubric> custom({
    Expression<String>? id,
    Expression<String>? main,
    Expression<String>? chapter,
    Expression<String>? author,
    Expression<String>? parentId,
    Expression<String>? remediesJson,
    Expression<DateTime>? updatedAt,
    Expression<int>? version,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (main != null) 'main': main,
      if (chapter != null) 'chapter': chapter,
      if (author != null) 'author': author,
      if (parentId != null) 'parent_id': parentId,
      if (remediesJson != null) 'remedies_json': remediesJson,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (version != null) 'version': version,
      if (rowid != null) 'rowid': rowid,
    });
  }

  SynthesisRubricsCompanion copyWith(
      {Value<String>? id,
      Value<String>? main,
      Value<String>? chapter,
      Value<String>? author,
      Value<String?>? parentId,
      Value<String>? remediesJson,
      Value<DateTime>? updatedAt,
      Value<int>? version,
      Value<int>? rowid}) {
    return SynthesisRubricsCompanion(
      id: id ?? this.id,
      main: main ?? this.main,
      chapter: chapter ?? this.chapter,
      author: author ?? this.author,
      parentId: parentId ?? this.parentId,
      remediesJson: remediesJson ?? this.remediesJson,
      updatedAt: updatedAt ?? this.updatedAt,
      version: version ?? this.version,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (main.present) {
      map['main'] = Variable<String>(main.value);
    }
    if (chapter.present) {
      map['chapter'] = Variable<String>(chapter.value);
    }
    if (author.present) {
      map['author'] = Variable<String>(author.value);
    }
    if (parentId.present) {
      map['parent_id'] = Variable<String>(parentId.value);
    }
    if (remediesJson.present) {
      map['remedies_json'] = Variable<String>(remediesJson.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (version.present) {
      map['version'] = Variable<int>(version.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SynthesisRubricsCompanion(')
          ..write('id: $id, ')
          ..write('main: $main, ')
          ..write('chapter: $chapter, ')
          ..write('author: $author, ')
          ..write('parentId: $parentId, ')
          ..write('remediesJson: $remediesJson, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('version: $version, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $ChaptersTable extends Chapters with TableInfo<$ChaptersTable, Chapter> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ChaptersTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
      'name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _rubricCountMeta =
      const VerificationMeta('rubricCount');
  @override
  late final GeneratedColumn<int> rubricCount = GeneratedColumn<int>(
      'rubric_count', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _authorMeta = const VerificationMeta('author');
  @override
  late final GeneratedColumn<String> author = GeneratedColumn<String>(
      'author', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant(''));
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
      'updated_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  @override
  List<GeneratedColumn> get $columns => [name, rubricCount, author, updatedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'chapters';
  @override
  VerificationContext validateIntegrity(Insertable<Chapter> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('name')) {
      context.handle(
          _nameMeta, name.isAcceptableOrUnknown(data['name']!, _nameMeta));
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('rubric_count')) {
      context.handle(
          _rubricCountMeta,
          rubricCount.isAcceptableOrUnknown(
              data['rubric_count']!, _rubricCountMeta));
    }
    if (data.containsKey('author')) {
      context.handle(_authorMeta,
          author.isAcceptableOrUnknown(data['author']!, _authorMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {name};
  @override
  Chapter map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Chapter(
      name: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}name'])!,
      rubricCount: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}rubric_count'])!,
      author: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}author'])!,
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
    );
  }

  @override
  $ChaptersTable createAlias(String alias) {
    return $ChaptersTable(attachedDatabase, alias);
  }
}

class Chapter extends DataClass implements Insertable<Chapter> {
  final String name;
  final int rubricCount;
  final String author;
  final DateTime updatedAt;
  const Chapter(
      {required this.name,
      required this.rubricCount,
      required this.author,
      required this.updatedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['name'] = Variable<String>(name);
    map['rubric_count'] = Variable<int>(rubricCount);
    map['author'] = Variable<String>(author);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  ChaptersCompanion toCompanion(bool nullToAbsent) {
    return ChaptersCompanion(
      name: Value(name),
      rubricCount: Value(rubricCount),
      author: Value(author),
      updatedAt: Value(updatedAt),
    );
  }

  factory Chapter.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Chapter(
      name: serializer.fromJson<String>(json['name']),
      rubricCount: serializer.fromJson<int>(json['rubricCount']),
      author: serializer.fromJson<String>(json['author']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'name': serializer.toJson<String>(name),
      'rubricCount': serializer.toJson<int>(rubricCount),
      'author': serializer.toJson<String>(author),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  Chapter copyWith(
          {String? name,
          int? rubricCount,
          String? author,
          DateTime? updatedAt}) =>
      Chapter(
        name: name ?? this.name,
        rubricCount: rubricCount ?? this.rubricCount,
        author: author ?? this.author,
        updatedAt: updatedAt ?? this.updatedAt,
      );
  Chapter copyWithCompanion(ChaptersCompanion data) {
    return Chapter(
      name: data.name.present ? data.name.value : this.name,
      rubricCount:
          data.rubricCount.present ? data.rubricCount.value : this.rubricCount,
      author: data.author.present ? data.author.value : this.author,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Chapter(')
          ..write('name: $name, ')
          ..write('rubricCount: $rubricCount, ')
          ..write('author: $author, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(name, rubricCount, author, updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Chapter &&
          other.name == this.name &&
          other.rubricCount == this.rubricCount &&
          other.author == this.author &&
          other.updatedAt == this.updatedAt);
}

class ChaptersCompanion extends UpdateCompanion<Chapter> {
  final Value<String> name;
  final Value<int> rubricCount;
  final Value<String> author;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const ChaptersCompanion({
    this.name = const Value.absent(),
    this.rubricCount = const Value.absent(),
    this.author = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  ChaptersCompanion.insert({
    required String name,
    this.rubricCount = const Value.absent(),
    this.author = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : name = Value(name);
  static Insertable<Chapter> custom({
    Expression<String>? name,
    Expression<int>? rubricCount,
    Expression<String>? author,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (name != null) 'name': name,
      if (rubricCount != null) 'rubric_count': rubricCount,
      if (author != null) 'author': author,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  ChaptersCompanion copyWith(
      {Value<String>? name,
      Value<int>? rubricCount,
      Value<String>? author,
      Value<DateTime>? updatedAt,
      Value<int>? rowid}) {
    return ChaptersCompanion(
      name: name ?? this.name,
      rubricCount: rubricCount ?? this.rubricCount,
      author: author ?? this.author,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (rubricCount.present) {
      map['rubric_count'] = Variable<int>(rubricCount.value);
    }
    if (author.present) {
      map['author'] = Variable<String>(author.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ChaptersCompanion(')
          ..write('name: $name, ')
          ..write('rubricCount: $rubricCount, ')
          ..write('author: $author, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $BooksTable extends Books with TableInfo<$BooksTable, Book> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $BooksTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _titleMeta = const VerificationMeta('title');
  @override
  late final GeneratedColumn<String> title = GeneratedColumn<String>(
      'title', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _authorMeta = const VerificationMeta('author');
  @override
  late final GeneratedColumn<String> author = GeneratedColumn<String>(
      'author', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant(''));
  static const VerificationMeta _descriptionMeta =
      const VerificationMeta('description');
  @override
  late final GeneratedColumn<String> description = GeneratedColumn<String>(
      'description', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant(''));
  static const VerificationMeta _remedyCountMeta =
      const VerificationMeta('remedyCount');
  @override
  late final GeneratedColumn<String> remedyCount = GeneratedColumn<String>(
      'remedy_count', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant(''));
  static const VerificationMeta _iconMeta = const VerificationMeta('icon');
  @override
  late final GeneratedColumn<String> icon = GeneratedColumn<String>(
      'icon', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('menu_book'));
  static const VerificationMeta _colorMeta = const VerificationMeta('color');
  @override
  late final GeneratedColumn<int> color = GeneratedColumn<int>(
      'color', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0xFF173B2D));
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
      'updated_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  @override
  List<GeneratedColumn> get $columns =>
      [id, title, author, description, remedyCount, icon, color, updatedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'books';
  @override
  VerificationContext validateIntegrity(Insertable<Book> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('title')) {
      context.handle(
          _titleMeta, title.isAcceptableOrUnknown(data['title']!, _titleMeta));
    } else if (isInserting) {
      context.missing(_titleMeta);
    }
    if (data.containsKey('author')) {
      context.handle(_authorMeta,
          author.isAcceptableOrUnknown(data['author']!, _authorMeta));
    }
    if (data.containsKey('description')) {
      context.handle(
          _descriptionMeta,
          description.isAcceptableOrUnknown(
              data['description']!, _descriptionMeta));
    }
    if (data.containsKey('remedy_count')) {
      context.handle(
          _remedyCountMeta,
          remedyCount.isAcceptableOrUnknown(
              data['remedy_count']!, _remedyCountMeta));
    }
    if (data.containsKey('icon')) {
      context.handle(
          _iconMeta, icon.isAcceptableOrUnknown(data['icon']!, _iconMeta));
    }
    if (data.containsKey('color')) {
      context.handle(
          _colorMeta, color.isAcceptableOrUnknown(data['color']!, _colorMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Book map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Book(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      title: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}title'])!,
      author: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}author'])!,
      description: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}description'])!,
      remedyCount: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}remedy_count'])!,
      icon: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}icon'])!,
      color: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}color'])!,
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
    );
  }

  @override
  $BooksTable createAlias(String alias) {
    return $BooksTable(attachedDatabase, alias);
  }
}

class Book extends DataClass implements Insertable<Book> {
  final String id;
  final String title;
  final String author;
  final String description;
  final String remedyCount;
  final String icon;
  final int color;
  final DateTime updatedAt;
  const Book(
      {required this.id,
      required this.title,
      required this.author,
      required this.description,
      required this.remedyCount,
      required this.icon,
      required this.color,
      required this.updatedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['title'] = Variable<String>(title);
    map['author'] = Variable<String>(author);
    map['description'] = Variable<String>(description);
    map['remedy_count'] = Variable<String>(remedyCount);
    map['icon'] = Variable<String>(icon);
    map['color'] = Variable<int>(color);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  BooksCompanion toCompanion(bool nullToAbsent) {
    return BooksCompanion(
      id: Value(id),
      title: Value(title),
      author: Value(author),
      description: Value(description),
      remedyCount: Value(remedyCount),
      icon: Value(icon),
      color: Value(color),
      updatedAt: Value(updatedAt),
    );
  }

  factory Book.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Book(
      id: serializer.fromJson<String>(json['id']),
      title: serializer.fromJson<String>(json['title']),
      author: serializer.fromJson<String>(json['author']),
      description: serializer.fromJson<String>(json['description']),
      remedyCount: serializer.fromJson<String>(json['remedyCount']),
      icon: serializer.fromJson<String>(json['icon']),
      color: serializer.fromJson<int>(json['color']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'title': serializer.toJson<String>(title),
      'author': serializer.toJson<String>(author),
      'description': serializer.toJson<String>(description),
      'remedyCount': serializer.toJson<String>(remedyCount),
      'icon': serializer.toJson<String>(icon),
      'color': serializer.toJson<int>(color),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  Book copyWith(
          {String? id,
          String? title,
          String? author,
          String? description,
          String? remedyCount,
          String? icon,
          int? color,
          DateTime? updatedAt}) =>
      Book(
        id: id ?? this.id,
        title: title ?? this.title,
        author: author ?? this.author,
        description: description ?? this.description,
        remedyCount: remedyCount ?? this.remedyCount,
        icon: icon ?? this.icon,
        color: color ?? this.color,
        updatedAt: updatedAt ?? this.updatedAt,
      );
  Book copyWithCompanion(BooksCompanion data) {
    return Book(
      id: data.id.present ? data.id.value : this.id,
      title: data.title.present ? data.title.value : this.title,
      author: data.author.present ? data.author.value : this.author,
      description:
          data.description.present ? data.description.value : this.description,
      remedyCount:
          data.remedyCount.present ? data.remedyCount.value : this.remedyCount,
      icon: data.icon.present ? data.icon.value : this.icon,
      color: data.color.present ? data.color.value : this.color,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Book(')
          ..write('id: $id, ')
          ..write('title: $title, ')
          ..write('author: $author, ')
          ..write('description: $description, ')
          ..write('remedyCount: $remedyCount, ')
          ..write('icon: $icon, ')
          ..write('color: $color, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id, title, author, description, remedyCount, icon, color, updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Book &&
          other.id == this.id &&
          other.title == this.title &&
          other.author == this.author &&
          other.description == this.description &&
          other.remedyCount == this.remedyCount &&
          other.icon == this.icon &&
          other.color == this.color &&
          other.updatedAt == this.updatedAt);
}

class BooksCompanion extends UpdateCompanion<Book> {
  final Value<String> id;
  final Value<String> title;
  final Value<String> author;
  final Value<String> description;
  final Value<String> remedyCount;
  final Value<String> icon;
  final Value<int> color;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const BooksCompanion({
    this.id = const Value.absent(),
    this.title = const Value.absent(),
    this.author = const Value.absent(),
    this.description = const Value.absent(),
    this.remedyCount = const Value.absent(),
    this.icon = const Value.absent(),
    this.color = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  BooksCompanion.insert({
    required String id,
    required String title,
    this.author = const Value.absent(),
    this.description = const Value.absent(),
    this.remedyCount = const Value.absent(),
    this.icon = const Value.absent(),
    this.color = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        title = Value(title);
  static Insertable<Book> custom({
    Expression<String>? id,
    Expression<String>? title,
    Expression<String>? author,
    Expression<String>? description,
    Expression<String>? remedyCount,
    Expression<String>? icon,
    Expression<int>? color,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (title != null) 'title': title,
      if (author != null) 'author': author,
      if (description != null) 'description': description,
      if (remedyCount != null) 'remedy_count': remedyCount,
      if (icon != null) 'icon': icon,
      if (color != null) 'color': color,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  BooksCompanion copyWith(
      {Value<String>? id,
      Value<String>? title,
      Value<String>? author,
      Value<String>? description,
      Value<String>? remedyCount,
      Value<String>? icon,
      Value<int>? color,
      Value<DateTime>? updatedAt,
      Value<int>? rowid}) {
    return BooksCompanion(
      id: id ?? this.id,
      title: title ?? this.title,
      author: author ?? this.author,
      description: description ?? this.description,
      remedyCount: remedyCount ?? this.remedyCount,
      icon: icon ?? this.icon,
      color: color ?? this.color,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (title.present) {
      map['title'] = Variable<String>(title.value);
    }
    if (author.present) {
      map['author'] = Variable<String>(author.value);
    }
    if (description.present) {
      map['description'] = Variable<String>(description.value);
    }
    if (remedyCount.present) {
      map['remedy_count'] = Variable<String>(remedyCount.value);
    }
    if (icon.present) {
      map['icon'] = Variable<String>(icon.value);
    }
    if (color.present) {
      map['color'] = Variable<int>(color.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('BooksCompanion(')
          ..write('id: $id, ')
          ..write('title: $title, ')
          ..write('author: $author, ')
          ..write('description: $description, ')
          ..write('remedyCount: $remedyCount, ')
          ..write('icon: $icon, ')
          ..write('color: $color, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $BookmarksTable extends Bookmarks
    with TableInfo<$BookmarksTable, Bookmark> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $BookmarksTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _itemIdMeta = const VerificationMeta('itemId');
  @override
  late final GeneratedColumn<String> itemId = GeneratedColumn<String>(
      'item_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _itemTypeMeta =
      const VerificationMeta('itemType');
  @override
  late final GeneratedColumn<String> itemType = GeneratedColumn<String>(
      'item_type', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _titleMeta = const VerificationMeta('title');
  @override
  late final GeneratedColumn<String> title = GeneratedColumn<String>(
      'title', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _hrefMeta = const VerificationMeta('href');
  @override
  late final GeneratedColumn<String> href = GeneratedColumn<String>(
      'href', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _authorMeta = const VerificationMeta('author');
  @override
  late final GeneratedColumn<String> author = GeneratedColumn<String>(
      'author', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  static const VerificationMeta _pendingSyncMeta =
      const VerificationMeta('pendingSync');
  @override
  late final GeneratedColumn<bool> pendingSync = GeneratedColumn<bool>(
      'pending_sync', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("pending_sync" IN (0, 1))'),
      defaultValue: const Constant(false));
  @override
  List<GeneratedColumn> get $columns =>
      [itemId, itemType, title, href, author, createdAt, pendingSync];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'bookmarks';
  @override
  VerificationContext validateIntegrity(Insertable<Bookmark> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('item_id')) {
      context.handle(_itemIdMeta,
          itemId.isAcceptableOrUnknown(data['item_id']!, _itemIdMeta));
    } else if (isInserting) {
      context.missing(_itemIdMeta);
    }
    if (data.containsKey('item_type')) {
      context.handle(_itemTypeMeta,
          itemType.isAcceptableOrUnknown(data['item_type']!, _itemTypeMeta));
    } else if (isInserting) {
      context.missing(_itemTypeMeta);
    }
    if (data.containsKey('title')) {
      context.handle(
          _titleMeta, title.isAcceptableOrUnknown(data['title']!, _titleMeta));
    } else if (isInserting) {
      context.missing(_titleMeta);
    }
    if (data.containsKey('href')) {
      context.handle(
          _hrefMeta, href.isAcceptableOrUnknown(data['href']!, _hrefMeta));
    }
    if (data.containsKey('author')) {
      context.handle(_authorMeta,
          author.isAcceptableOrUnknown(data['author']!, _authorMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    }
    if (data.containsKey('pending_sync')) {
      context.handle(
          _pendingSyncMeta,
          pendingSync.isAcceptableOrUnknown(
              data['pending_sync']!, _pendingSyncMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {itemId, itemType};
  @override
  Bookmark map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Bookmark(
      itemId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}item_id'])!,
      itemType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}item_type'])!,
      title: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}title'])!,
      href: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}href']),
      author: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}author']),
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      pendingSync: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}pending_sync'])!,
    );
  }

  @override
  $BookmarksTable createAlias(String alias) {
    return $BookmarksTable(attachedDatabase, alias);
  }
}

class Bookmark extends DataClass implements Insertable<Bookmark> {
  final String itemId;
  final String itemType;
  final String title;
  final String? href;
  final String? author;
  final DateTime createdAt;
  final bool pendingSync;
  const Bookmark(
      {required this.itemId,
      required this.itemType,
      required this.title,
      this.href,
      this.author,
      required this.createdAt,
      required this.pendingSync});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['item_id'] = Variable<String>(itemId);
    map['item_type'] = Variable<String>(itemType);
    map['title'] = Variable<String>(title);
    if (!nullToAbsent || href != null) {
      map['href'] = Variable<String>(href);
    }
    if (!nullToAbsent || author != null) {
      map['author'] = Variable<String>(author);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    map['pending_sync'] = Variable<bool>(pendingSync);
    return map;
  }

  BookmarksCompanion toCompanion(bool nullToAbsent) {
    return BookmarksCompanion(
      itemId: Value(itemId),
      itemType: Value(itemType),
      title: Value(title),
      href: href == null && nullToAbsent ? const Value.absent() : Value(href),
      author:
          author == null && nullToAbsent ? const Value.absent() : Value(author),
      createdAt: Value(createdAt),
      pendingSync: Value(pendingSync),
    );
  }

  factory Bookmark.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Bookmark(
      itemId: serializer.fromJson<String>(json['itemId']),
      itemType: serializer.fromJson<String>(json['itemType']),
      title: serializer.fromJson<String>(json['title']),
      href: serializer.fromJson<String?>(json['href']),
      author: serializer.fromJson<String?>(json['author']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      pendingSync: serializer.fromJson<bool>(json['pendingSync']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'itemId': serializer.toJson<String>(itemId),
      'itemType': serializer.toJson<String>(itemType),
      'title': serializer.toJson<String>(title),
      'href': serializer.toJson<String?>(href),
      'author': serializer.toJson<String?>(author),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'pendingSync': serializer.toJson<bool>(pendingSync),
    };
  }

  Bookmark copyWith(
          {String? itemId,
          String? itemType,
          String? title,
          Value<String?> href = const Value.absent(),
          Value<String?> author = const Value.absent(),
          DateTime? createdAt,
          bool? pendingSync}) =>
      Bookmark(
        itemId: itemId ?? this.itemId,
        itemType: itemType ?? this.itemType,
        title: title ?? this.title,
        href: href.present ? href.value : this.href,
        author: author.present ? author.value : this.author,
        createdAt: createdAt ?? this.createdAt,
        pendingSync: pendingSync ?? this.pendingSync,
      );
  Bookmark copyWithCompanion(BookmarksCompanion data) {
    return Bookmark(
      itemId: data.itemId.present ? data.itemId.value : this.itemId,
      itemType: data.itemType.present ? data.itemType.value : this.itemType,
      title: data.title.present ? data.title.value : this.title,
      href: data.href.present ? data.href.value : this.href,
      author: data.author.present ? data.author.value : this.author,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      pendingSync:
          data.pendingSync.present ? data.pendingSync.value : this.pendingSync,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Bookmark(')
          ..write('itemId: $itemId, ')
          ..write('itemType: $itemType, ')
          ..write('title: $title, ')
          ..write('href: $href, ')
          ..write('author: $author, ')
          ..write('createdAt: $createdAt, ')
          ..write('pendingSync: $pendingSync')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      itemId, itemType, title, href, author, createdAt, pendingSync);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Bookmark &&
          other.itemId == this.itemId &&
          other.itemType == this.itemType &&
          other.title == this.title &&
          other.href == this.href &&
          other.author == this.author &&
          other.createdAt == this.createdAt &&
          other.pendingSync == this.pendingSync);
}

class BookmarksCompanion extends UpdateCompanion<Bookmark> {
  final Value<String> itemId;
  final Value<String> itemType;
  final Value<String> title;
  final Value<String?> href;
  final Value<String?> author;
  final Value<DateTime> createdAt;
  final Value<bool> pendingSync;
  final Value<int> rowid;
  const BookmarksCompanion({
    this.itemId = const Value.absent(),
    this.itemType = const Value.absent(),
    this.title = const Value.absent(),
    this.href = const Value.absent(),
    this.author = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.pendingSync = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  BookmarksCompanion.insert({
    required String itemId,
    required String itemType,
    required String title,
    this.href = const Value.absent(),
    this.author = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.pendingSync = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : itemId = Value(itemId),
        itemType = Value(itemType),
        title = Value(title);
  static Insertable<Bookmark> custom({
    Expression<String>? itemId,
    Expression<String>? itemType,
    Expression<String>? title,
    Expression<String>? href,
    Expression<String>? author,
    Expression<DateTime>? createdAt,
    Expression<bool>? pendingSync,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (itemId != null) 'item_id': itemId,
      if (itemType != null) 'item_type': itemType,
      if (title != null) 'title': title,
      if (href != null) 'href': href,
      if (author != null) 'author': author,
      if (createdAt != null) 'created_at': createdAt,
      if (pendingSync != null) 'pending_sync': pendingSync,
      if (rowid != null) 'rowid': rowid,
    });
  }

  BookmarksCompanion copyWith(
      {Value<String>? itemId,
      Value<String>? itemType,
      Value<String>? title,
      Value<String?>? href,
      Value<String?>? author,
      Value<DateTime>? createdAt,
      Value<bool>? pendingSync,
      Value<int>? rowid}) {
    return BookmarksCompanion(
      itemId: itemId ?? this.itemId,
      itemType: itemType ?? this.itemType,
      title: title ?? this.title,
      href: href ?? this.href,
      author: author ?? this.author,
      createdAt: createdAt ?? this.createdAt,
      pendingSync: pendingSync ?? this.pendingSync,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (itemId.present) {
      map['item_id'] = Variable<String>(itemId.value);
    }
    if (itemType.present) {
      map['item_type'] = Variable<String>(itemType.value);
    }
    if (title.present) {
      map['title'] = Variable<String>(title.value);
    }
    if (href.present) {
      map['href'] = Variable<String>(href.value);
    }
    if (author.present) {
      map['author'] = Variable<String>(author.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (pendingSync.present) {
      map['pending_sync'] = Variable<bool>(pendingSync.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('BookmarksCompanion(')
          ..write('itemId: $itemId, ')
          ..write('itemType: $itemType, ')
          ..write('title: $title, ')
          ..write('href: $href, ')
          ..write('author: $author, ')
          ..write('createdAt: $createdAt, ')
          ..write('pendingSync: $pendingSync, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $FavoritesTable extends Favorites
    with TableInfo<$FavoritesTable, Favorite> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $FavoritesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _itemIdMeta = const VerificationMeta('itemId');
  @override
  late final GeneratedColumn<String> itemId = GeneratedColumn<String>(
      'item_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _itemTypeMeta =
      const VerificationMeta('itemType');
  @override
  late final GeneratedColumn<String> itemType = GeneratedColumn<String>(
      'item_type', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _titleMeta = const VerificationMeta('title');
  @override
  late final GeneratedColumn<String> title = GeneratedColumn<String>(
      'title', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _hrefMeta = const VerificationMeta('href');
  @override
  late final GeneratedColumn<String> href = GeneratedColumn<String>(
      'href', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  static const VerificationMeta _pendingSyncMeta =
      const VerificationMeta('pendingSync');
  @override
  late final GeneratedColumn<bool> pendingSync = GeneratedColumn<bool>(
      'pending_sync', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("pending_sync" IN (0, 1))'),
      defaultValue: const Constant(false));
  @override
  List<GeneratedColumn> get $columns =>
      [itemId, itemType, title, href, createdAt, pendingSync];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'favorites';
  @override
  VerificationContext validateIntegrity(Insertable<Favorite> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('item_id')) {
      context.handle(_itemIdMeta,
          itemId.isAcceptableOrUnknown(data['item_id']!, _itemIdMeta));
    } else if (isInserting) {
      context.missing(_itemIdMeta);
    }
    if (data.containsKey('item_type')) {
      context.handle(_itemTypeMeta,
          itemType.isAcceptableOrUnknown(data['item_type']!, _itemTypeMeta));
    } else if (isInserting) {
      context.missing(_itemTypeMeta);
    }
    if (data.containsKey('title')) {
      context.handle(
          _titleMeta, title.isAcceptableOrUnknown(data['title']!, _titleMeta));
    } else if (isInserting) {
      context.missing(_titleMeta);
    }
    if (data.containsKey('href')) {
      context.handle(
          _hrefMeta, href.isAcceptableOrUnknown(data['href']!, _hrefMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    }
    if (data.containsKey('pending_sync')) {
      context.handle(
          _pendingSyncMeta,
          pendingSync.isAcceptableOrUnknown(
              data['pending_sync']!, _pendingSyncMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {itemId, itemType};
  @override
  Favorite map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Favorite(
      itemId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}item_id'])!,
      itemType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}item_type'])!,
      title: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}title'])!,
      href: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}href']),
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      pendingSync: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}pending_sync'])!,
    );
  }

  @override
  $FavoritesTable createAlias(String alias) {
    return $FavoritesTable(attachedDatabase, alias);
  }
}

class Favorite extends DataClass implements Insertable<Favorite> {
  final String itemId;
  final String itemType;
  final String title;
  final String? href;
  final DateTime createdAt;
  final bool pendingSync;
  const Favorite(
      {required this.itemId,
      required this.itemType,
      required this.title,
      this.href,
      required this.createdAt,
      required this.pendingSync});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['item_id'] = Variable<String>(itemId);
    map['item_type'] = Variable<String>(itemType);
    map['title'] = Variable<String>(title);
    if (!nullToAbsent || href != null) {
      map['href'] = Variable<String>(href);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    map['pending_sync'] = Variable<bool>(pendingSync);
    return map;
  }

  FavoritesCompanion toCompanion(bool nullToAbsent) {
    return FavoritesCompanion(
      itemId: Value(itemId),
      itemType: Value(itemType),
      title: Value(title),
      href: href == null && nullToAbsent ? const Value.absent() : Value(href),
      createdAt: Value(createdAt),
      pendingSync: Value(pendingSync),
    );
  }

  factory Favorite.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Favorite(
      itemId: serializer.fromJson<String>(json['itemId']),
      itemType: serializer.fromJson<String>(json['itemType']),
      title: serializer.fromJson<String>(json['title']),
      href: serializer.fromJson<String?>(json['href']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      pendingSync: serializer.fromJson<bool>(json['pendingSync']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'itemId': serializer.toJson<String>(itemId),
      'itemType': serializer.toJson<String>(itemType),
      'title': serializer.toJson<String>(title),
      'href': serializer.toJson<String?>(href),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'pendingSync': serializer.toJson<bool>(pendingSync),
    };
  }

  Favorite copyWith(
          {String? itemId,
          String? itemType,
          String? title,
          Value<String?> href = const Value.absent(),
          DateTime? createdAt,
          bool? pendingSync}) =>
      Favorite(
        itemId: itemId ?? this.itemId,
        itemType: itemType ?? this.itemType,
        title: title ?? this.title,
        href: href.present ? href.value : this.href,
        createdAt: createdAt ?? this.createdAt,
        pendingSync: pendingSync ?? this.pendingSync,
      );
  Favorite copyWithCompanion(FavoritesCompanion data) {
    return Favorite(
      itemId: data.itemId.present ? data.itemId.value : this.itemId,
      itemType: data.itemType.present ? data.itemType.value : this.itemType,
      title: data.title.present ? data.title.value : this.title,
      href: data.href.present ? data.href.value : this.href,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      pendingSync:
          data.pendingSync.present ? data.pendingSync.value : this.pendingSync,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Favorite(')
          ..write('itemId: $itemId, ')
          ..write('itemType: $itemType, ')
          ..write('title: $title, ')
          ..write('href: $href, ')
          ..write('createdAt: $createdAt, ')
          ..write('pendingSync: $pendingSync')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(itemId, itemType, title, href, createdAt, pendingSync);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Favorite &&
          other.itemId == this.itemId &&
          other.itemType == this.itemType &&
          other.title == this.title &&
          other.href == this.href &&
          other.createdAt == this.createdAt &&
          other.pendingSync == this.pendingSync);
}

class FavoritesCompanion extends UpdateCompanion<Favorite> {
  final Value<String> itemId;
  final Value<String> itemType;
  final Value<String> title;
  final Value<String?> href;
  final Value<DateTime> createdAt;
  final Value<bool> pendingSync;
  final Value<int> rowid;
  const FavoritesCompanion({
    this.itemId = const Value.absent(),
    this.itemType = const Value.absent(),
    this.title = const Value.absent(),
    this.href = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.pendingSync = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  FavoritesCompanion.insert({
    required String itemId,
    required String itemType,
    required String title,
    this.href = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.pendingSync = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : itemId = Value(itemId),
        itemType = Value(itemType),
        title = Value(title);
  static Insertable<Favorite> custom({
    Expression<String>? itemId,
    Expression<String>? itemType,
    Expression<String>? title,
    Expression<String>? href,
    Expression<DateTime>? createdAt,
    Expression<bool>? pendingSync,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (itemId != null) 'item_id': itemId,
      if (itemType != null) 'item_type': itemType,
      if (title != null) 'title': title,
      if (href != null) 'href': href,
      if (createdAt != null) 'created_at': createdAt,
      if (pendingSync != null) 'pending_sync': pendingSync,
      if (rowid != null) 'rowid': rowid,
    });
  }

  FavoritesCompanion copyWith(
      {Value<String>? itemId,
      Value<String>? itemType,
      Value<String>? title,
      Value<String?>? href,
      Value<DateTime>? createdAt,
      Value<bool>? pendingSync,
      Value<int>? rowid}) {
    return FavoritesCompanion(
      itemId: itemId ?? this.itemId,
      itemType: itemType ?? this.itemType,
      title: title ?? this.title,
      href: href ?? this.href,
      createdAt: createdAt ?? this.createdAt,
      pendingSync: pendingSync ?? this.pendingSync,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (itemId.present) {
      map['item_id'] = Variable<String>(itemId.value);
    }
    if (itemType.present) {
      map['item_type'] = Variable<String>(itemType.value);
    }
    if (title.present) {
      map['title'] = Variable<String>(title.value);
    }
    if (href.present) {
      map['href'] = Variable<String>(href.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (pendingSync.present) {
      map['pending_sync'] = Variable<bool>(pendingSync.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('FavoritesCompanion(')
          ..write('itemId: $itemId, ')
          ..write('itemType: $itemType, ')
          ..write('title: $title, ')
          ..write('href: $href, ')
          ..write('createdAt: $createdAt, ')
          ..write('pendingSync: $pendingSync, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $AppNotesTable extends AppNotes with TableInfo<$AppNotesTable, AppNote> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $AppNotesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _localIdMeta =
      const VerificationMeta('localId');
  @override
  late final GeneratedColumn<int> localId = GeneratedColumn<int>(
      'local_id', aliasedName, false,
      hasAutoIncrement: true,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('PRIMARY KEY AUTOINCREMENT'));
  static const VerificationMeta _itemIdMeta = const VerificationMeta('itemId');
  @override
  late final GeneratedColumn<String> itemId = GeneratedColumn<String>(
      'item_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _itemTypeMeta =
      const VerificationMeta('itemType');
  @override
  late final GeneratedColumn<String> itemType = GeneratedColumn<String>(
      'item_type', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _contentMeta =
      const VerificationMeta('content');
  @override
  late final GeneratedColumn<String> content = GeneratedColumn<String>(
      'content', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _metadataMeta =
      const VerificationMeta('metadata');
  @override
  late final GeneratedColumn<String> metadata = GeneratedColumn<String>(
      'metadata', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
      'updated_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  static const VerificationMeta _pendingSyncMeta =
      const VerificationMeta('pendingSync');
  @override
  late final GeneratedColumn<bool> pendingSync = GeneratedColumn<bool>(
      'pending_sync', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("pending_sync" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _serverIdMeta =
      const VerificationMeta('serverId');
  @override
  late final GeneratedColumn<String> serverId = GeneratedColumn<String>(
      'server_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        localId,
        itemId,
        itemType,
        content,
        metadata,
        createdAt,
        updatedAt,
        pendingSync,
        serverId
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'app_notes';
  @override
  VerificationContext validateIntegrity(Insertable<AppNote> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('local_id')) {
      context.handle(_localIdMeta,
          localId.isAcceptableOrUnknown(data['local_id']!, _localIdMeta));
    }
    if (data.containsKey('item_id')) {
      context.handle(_itemIdMeta,
          itemId.isAcceptableOrUnknown(data['item_id']!, _itemIdMeta));
    } else if (isInserting) {
      context.missing(_itemIdMeta);
    }
    if (data.containsKey('item_type')) {
      context.handle(_itemTypeMeta,
          itemType.isAcceptableOrUnknown(data['item_type']!, _itemTypeMeta));
    } else if (isInserting) {
      context.missing(_itemTypeMeta);
    }
    if (data.containsKey('content')) {
      context.handle(_contentMeta,
          content.isAcceptableOrUnknown(data['content']!, _contentMeta));
    } else if (isInserting) {
      context.missing(_contentMeta);
    }
    if (data.containsKey('metadata')) {
      context.handle(_metadataMeta,
          metadata.isAcceptableOrUnknown(data['metadata']!, _metadataMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    if (data.containsKey('pending_sync')) {
      context.handle(
          _pendingSyncMeta,
          pendingSync.isAcceptableOrUnknown(
              data['pending_sync']!, _pendingSyncMeta));
    }
    if (data.containsKey('server_id')) {
      context.handle(_serverIdMeta,
          serverId.isAcceptableOrUnknown(data['server_id']!, _serverIdMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {localId};
  @override
  AppNote map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return AppNote(
      localId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}local_id'])!,
      itemId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}item_id'])!,
      itemType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}item_type'])!,
      content: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}content'])!,
      metadata: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}metadata']),
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
      pendingSync: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}pending_sync'])!,
      serverId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}server_id']),
    );
  }

  @override
  $AppNotesTable createAlias(String alias) {
    return $AppNotesTable(attachedDatabase, alias);
  }
}

class AppNote extends DataClass implements Insertable<AppNote> {
  final int localId;
  final String itemId;
  final String itemType;
  final String content;
  final String? metadata;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool pendingSync;
  final String? serverId;
  const AppNote(
      {required this.localId,
      required this.itemId,
      required this.itemType,
      required this.content,
      this.metadata,
      required this.createdAt,
      required this.updatedAt,
      required this.pendingSync,
      this.serverId});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['local_id'] = Variable<int>(localId);
    map['item_id'] = Variable<String>(itemId);
    map['item_type'] = Variable<String>(itemType);
    map['content'] = Variable<String>(content);
    if (!nullToAbsent || metadata != null) {
      map['metadata'] = Variable<String>(metadata);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    map['pending_sync'] = Variable<bool>(pendingSync);
    if (!nullToAbsent || serverId != null) {
      map['server_id'] = Variable<String>(serverId);
    }
    return map;
  }

  AppNotesCompanion toCompanion(bool nullToAbsent) {
    return AppNotesCompanion(
      localId: Value(localId),
      itemId: Value(itemId),
      itemType: Value(itemType),
      content: Value(content),
      metadata: metadata == null && nullToAbsent
          ? const Value.absent()
          : Value(metadata),
      createdAt: Value(createdAt),
      updatedAt: Value(updatedAt),
      pendingSync: Value(pendingSync),
      serverId: serverId == null && nullToAbsent
          ? const Value.absent()
          : Value(serverId),
    );
  }

  factory AppNote.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return AppNote(
      localId: serializer.fromJson<int>(json['localId']),
      itemId: serializer.fromJson<String>(json['itemId']),
      itemType: serializer.fromJson<String>(json['itemType']),
      content: serializer.fromJson<String>(json['content']),
      metadata: serializer.fromJson<String?>(json['metadata']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      pendingSync: serializer.fromJson<bool>(json['pendingSync']),
      serverId: serializer.fromJson<String?>(json['serverId']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'localId': serializer.toJson<int>(localId),
      'itemId': serializer.toJson<String>(itemId),
      'itemType': serializer.toJson<String>(itemType),
      'content': serializer.toJson<String>(content),
      'metadata': serializer.toJson<String?>(metadata),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'pendingSync': serializer.toJson<bool>(pendingSync),
      'serverId': serializer.toJson<String?>(serverId),
    };
  }

  AppNote copyWith(
          {int? localId,
          String? itemId,
          String? itemType,
          String? content,
          Value<String?> metadata = const Value.absent(),
          DateTime? createdAt,
          DateTime? updatedAt,
          bool? pendingSync,
          Value<String?> serverId = const Value.absent()}) =>
      AppNote(
        localId: localId ?? this.localId,
        itemId: itemId ?? this.itemId,
        itemType: itemType ?? this.itemType,
        content: content ?? this.content,
        metadata: metadata.present ? metadata.value : this.metadata,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
        pendingSync: pendingSync ?? this.pendingSync,
        serverId: serverId.present ? serverId.value : this.serverId,
      );
  AppNote copyWithCompanion(AppNotesCompanion data) {
    return AppNote(
      localId: data.localId.present ? data.localId.value : this.localId,
      itemId: data.itemId.present ? data.itemId.value : this.itemId,
      itemType: data.itemType.present ? data.itemType.value : this.itemType,
      content: data.content.present ? data.content.value : this.content,
      metadata: data.metadata.present ? data.metadata.value : this.metadata,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      pendingSync:
          data.pendingSync.present ? data.pendingSync.value : this.pendingSync,
      serverId: data.serverId.present ? data.serverId.value : this.serverId,
    );
  }

  @override
  String toString() {
    return (StringBuffer('AppNote(')
          ..write('localId: $localId, ')
          ..write('itemId: $itemId, ')
          ..write('itemType: $itemType, ')
          ..write('content: $content, ')
          ..write('metadata: $metadata, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('pendingSync: $pendingSync, ')
          ..write('serverId: $serverId')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(localId, itemId, itemType, content, metadata,
      createdAt, updatedAt, pendingSync, serverId);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is AppNote &&
          other.localId == this.localId &&
          other.itemId == this.itemId &&
          other.itemType == this.itemType &&
          other.content == this.content &&
          other.metadata == this.metadata &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt &&
          other.pendingSync == this.pendingSync &&
          other.serverId == this.serverId);
}

class AppNotesCompanion extends UpdateCompanion<AppNote> {
  final Value<int> localId;
  final Value<String> itemId;
  final Value<String> itemType;
  final Value<String> content;
  final Value<String?> metadata;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<bool> pendingSync;
  final Value<String?> serverId;
  const AppNotesCompanion({
    this.localId = const Value.absent(),
    this.itemId = const Value.absent(),
    this.itemType = const Value.absent(),
    this.content = const Value.absent(),
    this.metadata = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.pendingSync = const Value.absent(),
    this.serverId = const Value.absent(),
  });
  AppNotesCompanion.insert({
    this.localId = const Value.absent(),
    required String itemId,
    required String itemType,
    required String content,
    this.metadata = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.pendingSync = const Value.absent(),
    this.serverId = const Value.absent(),
  })  : itemId = Value(itemId),
        itemType = Value(itemType),
        content = Value(content);
  static Insertable<AppNote> custom({
    Expression<int>? localId,
    Expression<String>? itemId,
    Expression<String>? itemType,
    Expression<String>? content,
    Expression<String>? metadata,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<bool>? pendingSync,
    Expression<String>? serverId,
  }) {
    return RawValuesInsertable({
      if (localId != null) 'local_id': localId,
      if (itemId != null) 'item_id': itemId,
      if (itemType != null) 'item_type': itemType,
      if (content != null) 'content': content,
      if (metadata != null) 'metadata': metadata,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (pendingSync != null) 'pending_sync': pendingSync,
      if (serverId != null) 'server_id': serverId,
    });
  }

  AppNotesCompanion copyWith(
      {Value<int>? localId,
      Value<String>? itemId,
      Value<String>? itemType,
      Value<String>? content,
      Value<String?>? metadata,
      Value<DateTime>? createdAt,
      Value<DateTime>? updatedAt,
      Value<bool>? pendingSync,
      Value<String?>? serverId}) {
    return AppNotesCompanion(
      localId: localId ?? this.localId,
      itemId: itemId ?? this.itemId,
      itemType: itemType ?? this.itemType,
      content: content ?? this.content,
      metadata: metadata ?? this.metadata,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      pendingSync: pendingSync ?? this.pendingSync,
      serverId: serverId ?? this.serverId,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (localId.present) {
      map['local_id'] = Variable<int>(localId.value);
    }
    if (itemId.present) {
      map['item_id'] = Variable<String>(itemId.value);
    }
    if (itemType.present) {
      map['item_type'] = Variable<String>(itemType.value);
    }
    if (content.present) {
      map['content'] = Variable<String>(content.value);
    }
    if (metadata.present) {
      map['metadata'] = Variable<String>(metadata.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (pendingSync.present) {
      map['pending_sync'] = Variable<bool>(pendingSync.value);
    }
    if (serverId.present) {
      map['server_id'] = Variable<String>(serverId.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('AppNotesCompanion(')
          ..write('localId: $localId, ')
          ..write('itemId: $itemId, ')
          ..write('itemType: $itemType, ')
          ..write('content: $content, ')
          ..write('metadata: $metadata, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('pendingSync: $pendingSync, ')
          ..write('serverId: $serverId')
          ..write(')'))
        .toString();
  }
}

class $ReadingHistoryTable extends ReadingHistory
    with TableInfo<$ReadingHistoryTable, ReadingHistoryData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ReadingHistoryTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _itemIdMeta = const VerificationMeta('itemId');
  @override
  late final GeneratedColumn<String> itemId = GeneratedColumn<String>(
      'item_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _itemTypeMeta =
      const VerificationMeta('itemType');
  @override
  late final GeneratedColumn<String> itemType = GeneratedColumn<String>(
      'item_type', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _titleMeta = const VerificationMeta('title');
  @override
  late final GeneratedColumn<String> title = GeneratedColumn<String>(
      'title', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _hrefMeta = const VerificationMeta('href');
  @override
  late final GeneratedColumn<String> href = GeneratedColumn<String>(
      'href', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _viewedAtMeta =
      const VerificationMeta('viewedAt');
  @override
  late final GeneratedColumn<DateTime> viewedAt = GeneratedColumn<DateTime>(
      'viewed_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  @override
  List<GeneratedColumn> get $columns =>
      [itemId, itemType, title, href, viewedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'reading_history';
  @override
  VerificationContext validateIntegrity(Insertable<ReadingHistoryData> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('item_id')) {
      context.handle(_itemIdMeta,
          itemId.isAcceptableOrUnknown(data['item_id']!, _itemIdMeta));
    } else if (isInserting) {
      context.missing(_itemIdMeta);
    }
    if (data.containsKey('item_type')) {
      context.handle(_itemTypeMeta,
          itemType.isAcceptableOrUnknown(data['item_type']!, _itemTypeMeta));
    } else if (isInserting) {
      context.missing(_itemTypeMeta);
    }
    if (data.containsKey('title')) {
      context.handle(
          _titleMeta, title.isAcceptableOrUnknown(data['title']!, _titleMeta));
    } else if (isInserting) {
      context.missing(_titleMeta);
    }
    if (data.containsKey('href')) {
      context.handle(
          _hrefMeta, href.isAcceptableOrUnknown(data['href']!, _hrefMeta));
    }
    if (data.containsKey('viewed_at')) {
      context.handle(_viewedAtMeta,
          viewedAt.isAcceptableOrUnknown(data['viewed_at']!, _viewedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {itemId, itemType};
  @override
  ReadingHistoryData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return ReadingHistoryData(
      itemId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}item_id'])!,
      itemType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}item_type'])!,
      title: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}title'])!,
      href: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}href']),
      viewedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}viewed_at'])!,
    );
  }

  @override
  $ReadingHistoryTable createAlias(String alias) {
    return $ReadingHistoryTable(attachedDatabase, alias);
  }
}

class ReadingHistoryData extends DataClass
    implements Insertable<ReadingHistoryData> {
  final String itemId;
  final String itemType;
  final String title;
  final String? href;
  final DateTime viewedAt;
  const ReadingHistoryData(
      {required this.itemId,
      required this.itemType,
      required this.title,
      this.href,
      required this.viewedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['item_id'] = Variable<String>(itemId);
    map['item_type'] = Variable<String>(itemType);
    map['title'] = Variable<String>(title);
    if (!nullToAbsent || href != null) {
      map['href'] = Variable<String>(href);
    }
    map['viewed_at'] = Variable<DateTime>(viewedAt);
    return map;
  }

  ReadingHistoryCompanion toCompanion(bool nullToAbsent) {
    return ReadingHistoryCompanion(
      itemId: Value(itemId),
      itemType: Value(itemType),
      title: Value(title),
      href: href == null && nullToAbsent ? const Value.absent() : Value(href),
      viewedAt: Value(viewedAt),
    );
  }

  factory ReadingHistoryData.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return ReadingHistoryData(
      itemId: serializer.fromJson<String>(json['itemId']),
      itemType: serializer.fromJson<String>(json['itemType']),
      title: serializer.fromJson<String>(json['title']),
      href: serializer.fromJson<String?>(json['href']),
      viewedAt: serializer.fromJson<DateTime>(json['viewedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'itemId': serializer.toJson<String>(itemId),
      'itemType': serializer.toJson<String>(itemType),
      'title': serializer.toJson<String>(title),
      'href': serializer.toJson<String?>(href),
      'viewedAt': serializer.toJson<DateTime>(viewedAt),
    };
  }

  ReadingHistoryData copyWith(
          {String? itemId,
          String? itemType,
          String? title,
          Value<String?> href = const Value.absent(),
          DateTime? viewedAt}) =>
      ReadingHistoryData(
        itemId: itemId ?? this.itemId,
        itemType: itemType ?? this.itemType,
        title: title ?? this.title,
        href: href.present ? href.value : this.href,
        viewedAt: viewedAt ?? this.viewedAt,
      );
  ReadingHistoryData copyWithCompanion(ReadingHistoryCompanion data) {
    return ReadingHistoryData(
      itemId: data.itemId.present ? data.itemId.value : this.itemId,
      itemType: data.itemType.present ? data.itemType.value : this.itemType,
      title: data.title.present ? data.title.value : this.title,
      href: data.href.present ? data.href.value : this.href,
      viewedAt: data.viewedAt.present ? data.viewedAt.value : this.viewedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('ReadingHistoryData(')
          ..write('itemId: $itemId, ')
          ..write('itemType: $itemType, ')
          ..write('title: $title, ')
          ..write('href: $href, ')
          ..write('viewedAt: $viewedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(itemId, itemType, title, href, viewedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is ReadingHistoryData &&
          other.itemId == this.itemId &&
          other.itemType == this.itemType &&
          other.title == this.title &&
          other.href == this.href &&
          other.viewedAt == this.viewedAt);
}

class ReadingHistoryCompanion extends UpdateCompanion<ReadingHistoryData> {
  final Value<String> itemId;
  final Value<String> itemType;
  final Value<String> title;
  final Value<String?> href;
  final Value<DateTime> viewedAt;
  final Value<int> rowid;
  const ReadingHistoryCompanion({
    this.itemId = const Value.absent(),
    this.itemType = const Value.absent(),
    this.title = const Value.absent(),
    this.href = const Value.absent(),
    this.viewedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  ReadingHistoryCompanion.insert({
    required String itemId,
    required String itemType,
    required String title,
    this.href = const Value.absent(),
    this.viewedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : itemId = Value(itemId),
        itemType = Value(itemType),
        title = Value(title);
  static Insertable<ReadingHistoryData> custom({
    Expression<String>? itemId,
    Expression<String>? itemType,
    Expression<String>? title,
    Expression<String>? href,
    Expression<DateTime>? viewedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (itemId != null) 'item_id': itemId,
      if (itemType != null) 'item_type': itemType,
      if (title != null) 'title': title,
      if (href != null) 'href': href,
      if (viewedAt != null) 'viewed_at': viewedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  ReadingHistoryCompanion copyWith(
      {Value<String>? itemId,
      Value<String>? itemType,
      Value<String>? title,
      Value<String?>? href,
      Value<DateTime>? viewedAt,
      Value<int>? rowid}) {
    return ReadingHistoryCompanion(
      itemId: itemId ?? this.itemId,
      itemType: itemType ?? this.itemType,
      title: title ?? this.title,
      href: href ?? this.href,
      viewedAt: viewedAt ?? this.viewedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (itemId.present) {
      map['item_id'] = Variable<String>(itemId.value);
    }
    if (itemType.present) {
      map['item_type'] = Variable<String>(itemType.value);
    }
    if (title.present) {
      map['title'] = Variable<String>(title.value);
    }
    if (href.present) {
      map['href'] = Variable<String>(href.value);
    }
    if (viewedAt.present) {
      map['viewed_at'] = Variable<DateTime>(viewedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ReadingHistoryCompanion(')
          ..write('itemId: $itemId, ')
          ..write('itemType: $itemType, ')
          ..write('title: $title, ')
          ..write('href: $href, ')
          ..write('viewedAt: $viewedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $SearchHistoryTable extends SearchHistory
    with TableInfo<$SearchHistoryTable, SearchHistoryData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SearchHistoryTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      hasAutoIncrement: true,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('PRIMARY KEY AUTOINCREMENT'));
  static const VerificationMeta _queryMeta = const VerificationMeta('query');
  @override
  late final GeneratedColumn<String> query = GeneratedColumn<String>(
      'query', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _modeMeta = const VerificationMeta('mode');
  @override
  late final GeneratedColumn<String> mode = GeneratedColumn<String>(
      'mode', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('global'));
  static const VerificationMeta _searchedAtMeta =
      const VerificationMeta('searchedAt');
  @override
  late final GeneratedColumn<DateTime> searchedAt = GeneratedColumn<DateTime>(
      'searched_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  @override
  List<GeneratedColumn> get $columns => [id, query, mode, searchedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'search_history';
  @override
  VerificationContext validateIntegrity(Insertable<SearchHistoryData> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('query')) {
      context.handle(
          _queryMeta, query.isAcceptableOrUnknown(data['query']!, _queryMeta));
    } else if (isInserting) {
      context.missing(_queryMeta);
    }
    if (data.containsKey('mode')) {
      context.handle(
          _modeMeta, mode.isAcceptableOrUnknown(data['mode']!, _modeMeta));
    }
    if (data.containsKey('searched_at')) {
      context.handle(
          _searchedAtMeta,
          searchedAt.isAcceptableOrUnknown(
              data['searched_at']!, _searchedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  SearchHistoryData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SearchHistoryData(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      query: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}query'])!,
      mode: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}mode'])!,
      searchedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}searched_at'])!,
    );
  }

  @override
  $SearchHistoryTable createAlias(String alias) {
    return $SearchHistoryTable(attachedDatabase, alias);
  }
}

class SearchHistoryData extends DataClass
    implements Insertable<SearchHistoryData> {
  final int id;
  final String query;
  final String mode;
  final DateTime searchedAt;
  const SearchHistoryData(
      {required this.id,
      required this.query,
      required this.mode,
      required this.searchedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['query'] = Variable<String>(query);
    map['mode'] = Variable<String>(mode);
    map['searched_at'] = Variable<DateTime>(searchedAt);
    return map;
  }

  SearchHistoryCompanion toCompanion(bool nullToAbsent) {
    return SearchHistoryCompanion(
      id: Value(id),
      query: Value(query),
      mode: Value(mode),
      searchedAt: Value(searchedAt),
    );
  }

  factory SearchHistoryData.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SearchHistoryData(
      id: serializer.fromJson<int>(json['id']),
      query: serializer.fromJson<String>(json['query']),
      mode: serializer.fromJson<String>(json['mode']),
      searchedAt: serializer.fromJson<DateTime>(json['searchedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'query': serializer.toJson<String>(query),
      'mode': serializer.toJson<String>(mode),
      'searchedAt': serializer.toJson<DateTime>(searchedAt),
    };
  }

  SearchHistoryData copyWith(
          {int? id, String? query, String? mode, DateTime? searchedAt}) =>
      SearchHistoryData(
        id: id ?? this.id,
        query: query ?? this.query,
        mode: mode ?? this.mode,
        searchedAt: searchedAt ?? this.searchedAt,
      );
  SearchHistoryData copyWithCompanion(SearchHistoryCompanion data) {
    return SearchHistoryData(
      id: data.id.present ? data.id.value : this.id,
      query: data.query.present ? data.query.value : this.query,
      mode: data.mode.present ? data.mode.value : this.mode,
      searchedAt:
          data.searchedAt.present ? data.searchedAt.value : this.searchedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SearchHistoryData(')
          ..write('id: $id, ')
          ..write('query: $query, ')
          ..write('mode: $mode, ')
          ..write('searchedAt: $searchedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, query, mode, searchedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SearchHistoryData &&
          other.id == this.id &&
          other.query == this.query &&
          other.mode == this.mode &&
          other.searchedAt == this.searchedAt);
}

class SearchHistoryCompanion extends UpdateCompanion<SearchHistoryData> {
  final Value<int> id;
  final Value<String> query;
  final Value<String> mode;
  final Value<DateTime> searchedAt;
  const SearchHistoryCompanion({
    this.id = const Value.absent(),
    this.query = const Value.absent(),
    this.mode = const Value.absent(),
    this.searchedAt = const Value.absent(),
  });
  SearchHistoryCompanion.insert({
    this.id = const Value.absent(),
    required String query,
    this.mode = const Value.absent(),
    this.searchedAt = const Value.absent(),
  }) : query = Value(query);
  static Insertable<SearchHistoryData> custom({
    Expression<int>? id,
    Expression<String>? query,
    Expression<String>? mode,
    Expression<DateTime>? searchedAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (query != null) 'query': query,
      if (mode != null) 'mode': mode,
      if (searchedAt != null) 'searched_at': searchedAt,
    });
  }

  SearchHistoryCompanion copyWith(
      {Value<int>? id,
      Value<String>? query,
      Value<String>? mode,
      Value<DateTime>? searchedAt}) {
    return SearchHistoryCompanion(
      id: id ?? this.id,
      query: query ?? this.query,
      mode: mode ?? this.mode,
      searchedAt: searchedAt ?? this.searchedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (query.present) {
      map['query'] = Variable<String>(query.value);
    }
    if (mode.present) {
      map['mode'] = Variable<String>(mode.value);
    }
    if (searchedAt.present) {
      map['searched_at'] = Variable<DateTime>(searchedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SearchHistoryCompanion(')
          ..write('id: $id, ')
          ..write('query: $query, ')
          ..write('mode: $mode, ')
          ..write('searchedAt: $searchedAt')
          ..write(')'))
        .toString();
  }
}

class $SyncMetadataTable extends SyncMetadata
    with TableInfo<$SyncMetadataTable, SyncMetadataData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SyncMetadataTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _dataTypeMeta =
      const VerificationMeta('dataType');
  @override
  late final GeneratedColumn<String> dataType = GeneratedColumn<String>(
      'data_type', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _lastSyncAtMeta =
      const VerificationMeta('lastSyncAt');
  @override
  late final GeneratedColumn<DateTime> lastSyncAt = GeneratedColumn<DateTime>(
      'last_sync_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _totalRecordsMeta =
      const VerificationMeta('totalRecords');
  @override
  late final GeneratedColumn<int> totalRecords = GeneratedColumn<int>(
      'total_records', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _lastErrorMeta =
      const VerificationMeta('lastError');
  @override
  late final GeneratedColumn<String> lastError = GeneratedColumn<String>(
      'last_error', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
      'status', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('never'));
  @override
  List<GeneratedColumn> get $columns =>
      [dataType, lastSyncAt, totalRecords, lastError, status];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'sync_metadata';
  @override
  VerificationContext validateIntegrity(Insertable<SyncMetadataData> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('data_type')) {
      context.handle(_dataTypeMeta,
          dataType.isAcceptableOrUnknown(data['data_type']!, _dataTypeMeta));
    } else if (isInserting) {
      context.missing(_dataTypeMeta);
    }
    if (data.containsKey('last_sync_at')) {
      context.handle(
          _lastSyncAtMeta,
          lastSyncAt.isAcceptableOrUnknown(
              data['last_sync_at']!, _lastSyncAtMeta));
    }
    if (data.containsKey('total_records')) {
      context.handle(
          _totalRecordsMeta,
          totalRecords.isAcceptableOrUnknown(
              data['total_records']!, _totalRecordsMeta));
    }
    if (data.containsKey('last_error')) {
      context.handle(_lastErrorMeta,
          lastError.isAcceptableOrUnknown(data['last_error']!, _lastErrorMeta));
    }
    if (data.containsKey('status')) {
      context.handle(_statusMeta,
          status.isAcceptableOrUnknown(data['status']!, _statusMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {dataType};
  @override
  SyncMetadataData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SyncMetadataData(
      dataType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}data_type'])!,
      lastSyncAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}last_sync_at']),
      totalRecords: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}total_records'])!,
      lastError: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}last_error']),
      status: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}status'])!,
    );
  }

  @override
  $SyncMetadataTable createAlias(String alias) {
    return $SyncMetadataTable(attachedDatabase, alias);
  }
}

class SyncMetadataData extends DataClass
    implements Insertable<SyncMetadataData> {
  final String dataType;
  final DateTime? lastSyncAt;
  final int totalRecords;
  final String? lastError;
  final String status;
  const SyncMetadataData(
      {required this.dataType,
      this.lastSyncAt,
      required this.totalRecords,
      this.lastError,
      required this.status});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['data_type'] = Variable<String>(dataType);
    if (!nullToAbsent || lastSyncAt != null) {
      map['last_sync_at'] = Variable<DateTime>(lastSyncAt);
    }
    map['total_records'] = Variable<int>(totalRecords);
    if (!nullToAbsent || lastError != null) {
      map['last_error'] = Variable<String>(lastError);
    }
    map['status'] = Variable<String>(status);
    return map;
  }

  SyncMetadataCompanion toCompanion(bool nullToAbsent) {
    return SyncMetadataCompanion(
      dataType: Value(dataType),
      lastSyncAt: lastSyncAt == null && nullToAbsent
          ? const Value.absent()
          : Value(lastSyncAt),
      totalRecords: Value(totalRecords),
      lastError: lastError == null && nullToAbsent
          ? const Value.absent()
          : Value(lastError),
      status: Value(status),
    );
  }

  factory SyncMetadataData.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SyncMetadataData(
      dataType: serializer.fromJson<String>(json['dataType']),
      lastSyncAt: serializer.fromJson<DateTime?>(json['lastSyncAt']),
      totalRecords: serializer.fromJson<int>(json['totalRecords']),
      lastError: serializer.fromJson<String?>(json['lastError']),
      status: serializer.fromJson<String>(json['status']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'dataType': serializer.toJson<String>(dataType),
      'lastSyncAt': serializer.toJson<DateTime?>(lastSyncAt),
      'totalRecords': serializer.toJson<int>(totalRecords),
      'lastError': serializer.toJson<String?>(lastError),
      'status': serializer.toJson<String>(status),
    };
  }

  SyncMetadataData copyWith(
          {String? dataType,
          Value<DateTime?> lastSyncAt = const Value.absent(),
          int? totalRecords,
          Value<String?> lastError = const Value.absent(),
          String? status}) =>
      SyncMetadataData(
        dataType: dataType ?? this.dataType,
        lastSyncAt: lastSyncAt.present ? lastSyncAt.value : this.lastSyncAt,
        totalRecords: totalRecords ?? this.totalRecords,
        lastError: lastError.present ? lastError.value : this.lastError,
        status: status ?? this.status,
      );
  SyncMetadataData copyWithCompanion(SyncMetadataCompanion data) {
    return SyncMetadataData(
      dataType: data.dataType.present ? data.dataType.value : this.dataType,
      lastSyncAt:
          data.lastSyncAt.present ? data.lastSyncAt.value : this.lastSyncAt,
      totalRecords: data.totalRecords.present
          ? data.totalRecords.value
          : this.totalRecords,
      lastError: data.lastError.present ? data.lastError.value : this.lastError,
      status: data.status.present ? data.status.value : this.status,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SyncMetadataData(')
          ..write('dataType: $dataType, ')
          ..write('lastSyncAt: $lastSyncAt, ')
          ..write('totalRecords: $totalRecords, ')
          ..write('lastError: $lastError, ')
          ..write('status: $status')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(dataType, lastSyncAt, totalRecords, lastError, status);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SyncMetadataData &&
          other.dataType == this.dataType &&
          other.lastSyncAt == this.lastSyncAt &&
          other.totalRecords == this.totalRecords &&
          other.lastError == this.lastError &&
          other.status == this.status);
}

class SyncMetadataCompanion extends UpdateCompanion<SyncMetadataData> {
  final Value<String> dataType;
  final Value<DateTime?> lastSyncAt;
  final Value<int> totalRecords;
  final Value<String?> lastError;
  final Value<String> status;
  final Value<int> rowid;
  const SyncMetadataCompanion({
    this.dataType = const Value.absent(),
    this.lastSyncAt = const Value.absent(),
    this.totalRecords = const Value.absent(),
    this.lastError = const Value.absent(),
    this.status = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  SyncMetadataCompanion.insert({
    required String dataType,
    this.lastSyncAt = const Value.absent(),
    this.totalRecords = const Value.absent(),
    this.lastError = const Value.absent(),
    this.status = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : dataType = Value(dataType);
  static Insertable<SyncMetadataData> custom({
    Expression<String>? dataType,
    Expression<DateTime>? lastSyncAt,
    Expression<int>? totalRecords,
    Expression<String>? lastError,
    Expression<String>? status,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (dataType != null) 'data_type': dataType,
      if (lastSyncAt != null) 'last_sync_at': lastSyncAt,
      if (totalRecords != null) 'total_records': totalRecords,
      if (lastError != null) 'last_error': lastError,
      if (status != null) 'status': status,
      if (rowid != null) 'rowid': rowid,
    });
  }

  SyncMetadataCompanion copyWith(
      {Value<String>? dataType,
      Value<DateTime?>? lastSyncAt,
      Value<int>? totalRecords,
      Value<String?>? lastError,
      Value<String>? status,
      Value<int>? rowid}) {
    return SyncMetadataCompanion(
      dataType: dataType ?? this.dataType,
      lastSyncAt: lastSyncAt ?? this.lastSyncAt,
      totalRecords: totalRecords ?? this.totalRecords,
      lastError: lastError ?? this.lastError,
      status: status ?? this.status,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (dataType.present) {
      map['data_type'] = Variable<String>(dataType.value);
    }
    if (lastSyncAt.present) {
      map['last_sync_at'] = Variable<DateTime>(lastSyncAt.value);
    }
    if (totalRecords.present) {
      map['total_records'] = Variable<int>(totalRecords.value);
    }
    if (lastError.present) {
      map['last_error'] = Variable<String>(lastError.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SyncMetadataCompanion(')
          ..write('dataType: $dataType, ')
          ..write('lastSyncAt: $lastSyncAt, ')
          ..write('totalRecords: $totalRecords, ')
          ..write('lastError: $lastError, ')
          ..write('status: $status, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $PendingChangesTable extends PendingChanges
    with TableInfo<$PendingChangesTable, PendingChange> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $PendingChangesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      hasAutoIncrement: true,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('PRIMARY KEY AUTOINCREMENT'));
  static const VerificationMeta _entityTypeMeta =
      const VerificationMeta('entityType');
  @override
  late final GeneratedColumn<String> entityType = GeneratedColumn<String>(
      'entity_type', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _entityIdMeta =
      const VerificationMeta('entityId');
  @override
  late final GeneratedColumn<String> entityId = GeneratedColumn<String>(
      'entity_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _operationMeta =
      const VerificationMeta('operation');
  @override
  late final GeneratedColumn<String> operation = GeneratedColumn<String>(
      'operation', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _payloadMeta =
      const VerificationMeta('payload');
  @override
  late final GeneratedColumn<String> payload = GeneratedColumn<String>(
      'payload', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  static const VerificationMeta _retryCountMeta =
      const VerificationMeta('retryCount');
  @override
  late final GeneratedColumn<int> retryCount = GeneratedColumn<int>(
      'retry_count', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  @override
  List<GeneratedColumn> get $columns =>
      [id, entityType, entityId, operation, payload, createdAt, retryCount];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'pending_changes';
  @override
  VerificationContext validateIntegrity(Insertable<PendingChange> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('entity_type')) {
      context.handle(
          _entityTypeMeta,
          entityType.isAcceptableOrUnknown(
              data['entity_type']!, _entityTypeMeta));
    } else if (isInserting) {
      context.missing(_entityTypeMeta);
    }
    if (data.containsKey('entity_id')) {
      context.handle(_entityIdMeta,
          entityId.isAcceptableOrUnknown(data['entity_id']!, _entityIdMeta));
    } else if (isInserting) {
      context.missing(_entityIdMeta);
    }
    if (data.containsKey('operation')) {
      context.handle(_operationMeta,
          operation.isAcceptableOrUnknown(data['operation']!, _operationMeta));
    } else if (isInserting) {
      context.missing(_operationMeta);
    }
    if (data.containsKey('payload')) {
      context.handle(_payloadMeta,
          payload.isAcceptableOrUnknown(data['payload']!, _payloadMeta));
    } else if (isInserting) {
      context.missing(_payloadMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    }
    if (data.containsKey('retry_count')) {
      context.handle(
          _retryCountMeta,
          retryCount.isAcceptableOrUnknown(
              data['retry_count']!, _retryCountMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  PendingChange map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return PendingChange(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      entityType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}entity_type'])!,
      entityId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}entity_id'])!,
      operation: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}operation'])!,
      payload: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}payload'])!,
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      retryCount: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}retry_count'])!,
    );
  }

  @override
  $PendingChangesTable createAlias(String alias) {
    return $PendingChangesTable(attachedDatabase, alias);
  }
}

class PendingChange extends DataClass implements Insertable<PendingChange> {
  final int id;
  final String entityType;
  final String entityId;
  final String operation;
  final String payload;
  final DateTime createdAt;
  final int retryCount;
  const PendingChange(
      {required this.id,
      required this.entityType,
      required this.entityId,
      required this.operation,
      required this.payload,
      required this.createdAt,
      required this.retryCount});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['entity_type'] = Variable<String>(entityType);
    map['entity_id'] = Variable<String>(entityId);
    map['operation'] = Variable<String>(operation);
    map['payload'] = Variable<String>(payload);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['retry_count'] = Variable<int>(retryCount);
    return map;
  }

  PendingChangesCompanion toCompanion(bool nullToAbsent) {
    return PendingChangesCompanion(
      id: Value(id),
      entityType: Value(entityType),
      entityId: Value(entityId),
      operation: Value(operation),
      payload: Value(payload),
      createdAt: Value(createdAt),
      retryCount: Value(retryCount),
    );
  }

  factory PendingChange.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return PendingChange(
      id: serializer.fromJson<int>(json['id']),
      entityType: serializer.fromJson<String>(json['entityType']),
      entityId: serializer.fromJson<String>(json['entityId']),
      operation: serializer.fromJson<String>(json['operation']),
      payload: serializer.fromJson<String>(json['payload']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      retryCount: serializer.fromJson<int>(json['retryCount']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'entityType': serializer.toJson<String>(entityType),
      'entityId': serializer.toJson<String>(entityId),
      'operation': serializer.toJson<String>(operation),
      'payload': serializer.toJson<String>(payload),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'retryCount': serializer.toJson<int>(retryCount),
    };
  }

  PendingChange copyWith(
          {int? id,
          String? entityType,
          String? entityId,
          String? operation,
          String? payload,
          DateTime? createdAt,
          int? retryCount}) =>
      PendingChange(
        id: id ?? this.id,
        entityType: entityType ?? this.entityType,
        entityId: entityId ?? this.entityId,
        operation: operation ?? this.operation,
        payload: payload ?? this.payload,
        createdAt: createdAt ?? this.createdAt,
        retryCount: retryCount ?? this.retryCount,
      );
  PendingChange copyWithCompanion(PendingChangesCompanion data) {
    return PendingChange(
      id: data.id.present ? data.id.value : this.id,
      entityType:
          data.entityType.present ? data.entityType.value : this.entityType,
      entityId: data.entityId.present ? data.entityId.value : this.entityId,
      operation: data.operation.present ? data.operation.value : this.operation,
      payload: data.payload.present ? data.payload.value : this.payload,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      retryCount:
          data.retryCount.present ? data.retryCount.value : this.retryCount,
    );
  }

  @override
  String toString() {
    return (StringBuffer('PendingChange(')
          ..write('id: $id, ')
          ..write('entityType: $entityType, ')
          ..write('entityId: $entityId, ')
          ..write('operation: $operation, ')
          ..write('payload: $payload, ')
          ..write('createdAt: $createdAt, ')
          ..write('retryCount: $retryCount')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id, entityType, entityId, operation, payload, createdAt, retryCount);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is PendingChange &&
          other.id == this.id &&
          other.entityType == this.entityType &&
          other.entityId == this.entityId &&
          other.operation == this.operation &&
          other.payload == this.payload &&
          other.createdAt == this.createdAt &&
          other.retryCount == this.retryCount);
}

class PendingChangesCompanion extends UpdateCompanion<PendingChange> {
  final Value<int> id;
  final Value<String> entityType;
  final Value<String> entityId;
  final Value<String> operation;
  final Value<String> payload;
  final Value<DateTime> createdAt;
  final Value<int> retryCount;
  const PendingChangesCompanion({
    this.id = const Value.absent(),
    this.entityType = const Value.absent(),
    this.entityId = const Value.absent(),
    this.operation = const Value.absent(),
    this.payload = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.retryCount = const Value.absent(),
  });
  PendingChangesCompanion.insert({
    this.id = const Value.absent(),
    required String entityType,
    required String entityId,
    required String operation,
    required String payload,
    this.createdAt = const Value.absent(),
    this.retryCount = const Value.absent(),
  })  : entityType = Value(entityType),
        entityId = Value(entityId),
        operation = Value(operation),
        payload = Value(payload);
  static Insertable<PendingChange> custom({
    Expression<int>? id,
    Expression<String>? entityType,
    Expression<String>? entityId,
    Expression<String>? operation,
    Expression<String>? payload,
    Expression<DateTime>? createdAt,
    Expression<int>? retryCount,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (entityType != null) 'entity_type': entityType,
      if (entityId != null) 'entity_id': entityId,
      if (operation != null) 'operation': operation,
      if (payload != null) 'payload': payload,
      if (createdAt != null) 'created_at': createdAt,
      if (retryCount != null) 'retry_count': retryCount,
    });
  }

  PendingChangesCompanion copyWith(
      {Value<int>? id,
      Value<String>? entityType,
      Value<String>? entityId,
      Value<String>? operation,
      Value<String>? payload,
      Value<DateTime>? createdAt,
      Value<int>? retryCount}) {
    return PendingChangesCompanion(
      id: id ?? this.id,
      entityType: entityType ?? this.entityType,
      entityId: entityId ?? this.entityId,
      operation: operation ?? this.operation,
      payload: payload ?? this.payload,
      createdAt: createdAt ?? this.createdAt,
      retryCount: retryCount ?? this.retryCount,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (entityType.present) {
      map['entity_type'] = Variable<String>(entityType.value);
    }
    if (entityId.present) {
      map['entity_id'] = Variable<String>(entityId.value);
    }
    if (operation.present) {
      map['operation'] = Variable<String>(operation.value);
    }
    if (payload.present) {
      map['payload'] = Variable<String>(payload.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (retryCount.present) {
      map['retry_count'] = Variable<int>(retryCount.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('PendingChangesCompanion(')
          ..write('id: $id, ')
          ..write('entityType: $entityType, ')
          ..write('entityId: $entityId, ')
          ..write('operation: $operation, ')
          ..write('payload: $payload, ')
          ..write('createdAt: $createdAt, ')
          ..write('retryCount: $retryCount')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $RemediesTable remedies = $RemediesTable(this);
  late final $RubricsTable rubrics = $RubricsTable(this);
  late final $SynthesisRubricsTable synthesisRubrics =
      $SynthesisRubricsTable(this);
  late final $ChaptersTable chapters = $ChaptersTable(this);
  late final $BooksTable books = $BooksTable(this);
  late final $BookmarksTable bookmarks = $BookmarksTable(this);
  late final $FavoritesTable favorites = $FavoritesTable(this);
  late final $AppNotesTable appNotes = $AppNotesTable(this);
  late final $ReadingHistoryTable readingHistory = $ReadingHistoryTable(this);
  late final $SearchHistoryTable searchHistory = $SearchHistoryTable(this);
  late final $SyncMetadataTable syncMetadata = $SyncMetadataTable(this);
  late final $PendingChangesTable pendingChanges = $PendingChangesTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
        remedies,
        rubrics,
        synthesisRubrics,
        chapters,
        books,
        bookmarks,
        favorites,
        appNotes,
        readingHistory,
        searchHistory,
        syncMetadata,
        pendingChanges
      ];
}

typedef $$RemediesTableCreateCompanionBuilder = RemediesCompanion Function({
  required String id,
  required String name,
  Value<String> common,
  required String author,
  Value<String> letter,
  Value<String> chapter,
  Value<String> organ,
  Value<String> keynote,
  Value<String?> source,
  Value<DateTime> updatedAt,
  Value<int> version,
  Value<int> rowid,
});
typedef $$RemediesTableUpdateCompanionBuilder = RemediesCompanion Function({
  Value<String> id,
  Value<String> name,
  Value<String> common,
  Value<String> author,
  Value<String> letter,
  Value<String> chapter,
  Value<String> organ,
  Value<String> keynote,
  Value<String?> source,
  Value<DateTime> updatedAt,
  Value<int> version,
  Value<int> rowid,
});

class $$RemediesTableFilterComposer
    extends Composer<_$AppDatabase, $RemediesTable> {
  $$RemediesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get common => $composableBuilder(
      column: $table.common, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get author => $composableBuilder(
      column: $table.author, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get letter => $composableBuilder(
      column: $table.letter, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get chapter => $composableBuilder(
      column: $table.chapter, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get organ => $composableBuilder(
      column: $table.organ, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get keynote => $composableBuilder(
      column: $table.keynote, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get source => $composableBuilder(
      column: $table.source, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get version => $composableBuilder(
      column: $table.version, builder: (column) => ColumnFilters(column));
}

class $$RemediesTableOrderingComposer
    extends Composer<_$AppDatabase, $RemediesTable> {
  $$RemediesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get common => $composableBuilder(
      column: $table.common, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get author => $composableBuilder(
      column: $table.author, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get letter => $composableBuilder(
      column: $table.letter, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get chapter => $composableBuilder(
      column: $table.chapter, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get organ => $composableBuilder(
      column: $table.organ, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get keynote => $composableBuilder(
      column: $table.keynote, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get source => $composableBuilder(
      column: $table.source, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get version => $composableBuilder(
      column: $table.version, builder: (column) => ColumnOrderings(column));
}

class $$RemediesTableAnnotationComposer
    extends Composer<_$AppDatabase, $RemediesTable> {
  $$RemediesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get common =>
      $composableBuilder(column: $table.common, builder: (column) => column);

  GeneratedColumn<String> get author =>
      $composableBuilder(column: $table.author, builder: (column) => column);

  GeneratedColumn<String> get letter =>
      $composableBuilder(column: $table.letter, builder: (column) => column);

  GeneratedColumn<String> get chapter =>
      $composableBuilder(column: $table.chapter, builder: (column) => column);

  GeneratedColumn<String> get organ =>
      $composableBuilder(column: $table.organ, builder: (column) => column);

  GeneratedColumn<String> get keynote =>
      $composableBuilder(column: $table.keynote, builder: (column) => column);

  GeneratedColumn<String> get source =>
      $composableBuilder(column: $table.source, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  GeneratedColumn<int> get version =>
      $composableBuilder(column: $table.version, builder: (column) => column);
}

class $$RemediesTableTableManager extends RootTableManager<
    _$AppDatabase,
    $RemediesTable,
    RemedyRow,
    $$RemediesTableFilterComposer,
    $$RemediesTableOrderingComposer,
    $$RemediesTableAnnotationComposer,
    $$RemediesTableCreateCompanionBuilder,
    $$RemediesTableUpdateCompanionBuilder,
    (RemedyRow, BaseReferences<_$AppDatabase, $RemediesTable, RemedyRow>),
    RemedyRow,
    PrefetchHooks Function()> {
  $$RemediesTableTableManager(_$AppDatabase db, $RemediesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$RemediesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$RemediesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$RemediesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> name = const Value.absent(),
            Value<String> common = const Value.absent(),
            Value<String> author = const Value.absent(),
            Value<String> letter = const Value.absent(),
            Value<String> chapter = const Value.absent(),
            Value<String> organ = const Value.absent(),
            Value<String> keynote = const Value.absent(),
            Value<String?> source = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
            Value<int> version = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              RemediesCompanion(
            id: id,
            name: name,
            common: common,
            author: author,
            letter: letter,
            chapter: chapter,
            organ: organ,
            keynote: keynote,
            source: source,
            updatedAt: updatedAt,
            version: version,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String name,
            Value<String> common = const Value.absent(),
            required String author,
            Value<String> letter = const Value.absent(),
            Value<String> chapter = const Value.absent(),
            Value<String> organ = const Value.absent(),
            Value<String> keynote = const Value.absent(),
            Value<String?> source = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
            Value<int> version = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              RemediesCompanion.insert(
            id: id,
            name: name,
            common: common,
            author: author,
            letter: letter,
            chapter: chapter,
            organ: organ,
            keynote: keynote,
            source: source,
            updatedAt: updatedAt,
            version: version,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$RemediesTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $RemediesTable,
    RemedyRow,
    $$RemediesTableFilterComposer,
    $$RemediesTableOrderingComposer,
    $$RemediesTableAnnotationComposer,
    $$RemediesTableCreateCompanionBuilder,
    $$RemediesTableUpdateCompanionBuilder,
    (RemedyRow, BaseReferences<_$AppDatabase, $RemediesTable, RemedyRow>),
    RemedyRow,
    PrefetchHooks Function()>;
typedef $$RubricsTableCreateCompanionBuilder = RubricsCompanion Function({
  required String id,
  required String main,
  Value<String> chapter,
  Value<String> author,
  Value<String?> parentId,
  Value<String> remediesJson,
  Value<DateTime> updatedAt,
  Value<int> version,
  Value<int> rowid,
});
typedef $$RubricsTableUpdateCompanionBuilder = RubricsCompanion Function({
  Value<String> id,
  Value<String> main,
  Value<String> chapter,
  Value<String> author,
  Value<String?> parentId,
  Value<String> remediesJson,
  Value<DateTime> updatedAt,
  Value<int> version,
  Value<int> rowid,
});

class $$RubricsTableFilterComposer
    extends Composer<_$AppDatabase, $RubricsTable> {
  $$RubricsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get main => $composableBuilder(
      column: $table.main, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get chapter => $composableBuilder(
      column: $table.chapter, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get author => $composableBuilder(
      column: $table.author, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get parentId => $composableBuilder(
      column: $table.parentId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get remediesJson => $composableBuilder(
      column: $table.remediesJson, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get version => $composableBuilder(
      column: $table.version, builder: (column) => ColumnFilters(column));
}

class $$RubricsTableOrderingComposer
    extends Composer<_$AppDatabase, $RubricsTable> {
  $$RubricsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get main => $composableBuilder(
      column: $table.main, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get chapter => $composableBuilder(
      column: $table.chapter, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get author => $composableBuilder(
      column: $table.author, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get parentId => $composableBuilder(
      column: $table.parentId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get remediesJson => $composableBuilder(
      column: $table.remediesJson,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get version => $composableBuilder(
      column: $table.version, builder: (column) => ColumnOrderings(column));
}

class $$RubricsTableAnnotationComposer
    extends Composer<_$AppDatabase, $RubricsTable> {
  $$RubricsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get main =>
      $composableBuilder(column: $table.main, builder: (column) => column);

  GeneratedColumn<String> get chapter =>
      $composableBuilder(column: $table.chapter, builder: (column) => column);

  GeneratedColumn<String> get author =>
      $composableBuilder(column: $table.author, builder: (column) => column);

  GeneratedColumn<String> get parentId =>
      $composableBuilder(column: $table.parentId, builder: (column) => column);

  GeneratedColumn<String> get remediesJson => $composableBuilder(
      column: $table.remediesJson, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  GeneratedColumn<int> get version =>
      $composableBuilder(column: $table.version, builder: (column) => column);
}

class $$RubricsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $RubricsTable,
    RubricRow,
    $$RubricsTableFilterComposer,
    $$RubricsTableOrderingComposer,
    $$RubricsTableAnnotationComposer,
    $$RubricsTableCreateCompanionBuilder,
    $$RubricsTableUpdateCompanionBuilder,
    (RubricRow, BaseReferences<_$AppDatabase, $RubricsTable, RubricRow>),
    RubricRow,
    PrefetchHooks Function()> {
  $$RubricsTableTableManager(_$AppDatabase db, $RubricsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$RubricsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$RubricsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$RubricsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> main = const Value.absent(),
            Value<String> chapter = const Value.absent(),
            Value<String> author = const Value.absent(),
            Value<String?> parentId = const Value.absent(),
            Value<String> remediesJson = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
            Value<int> version = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              RubricsCompanion(
            id: id,
            main: main,
            chapter: chapter,
            author: author,
            parentId: parentId,
            remediesJson: remediesJson,
            updatedAt: updatedAt,
            version: version,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String main,
            Value<String> chapter = const Value.absent(),
            Value<String> author = const Value.absent(),
            Value<String?> parentId = const Value.absent(),
            Value<String> remediesJson = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
            Value<int> version = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              RubricsCompanion.insert(
            id: id,
            main: main,
            chapter: chapter,
            author: author,
            parentId: parentId,
            remediesJson: remediesJson,
            updatedAt: updatedAt,
            version: version,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$RubricsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $RubricsTable,
    RubricRow,
    $$RubricsTableFilterComposer,
    $$RubricsTableOrderingComposer,
    $$RubricsTableAnnotationComposer,
    $$RubricsTableCreateCompanionBuilder,
    $$RubricsTableUpdateCompanionBuilder,
    (RubricRow, BaseReferences<_$AppDatabase, $RubricsTable, RubricRow>),
    RubricRow,
    PrefetchHooks Function()>;
typedef $$SynthesisRubricsTableCreateCompanionBuilder
    = SynthesisRubricsCompanion Function({
  required String id,
  required String main,
  Value<String> chapter,
  Value<String> author,
  Value<String?> parentId,
  Value<String> remediesJson,
  Value<DateTime> updatedAt,
  Value<int> version,
  Value<int> rowid,
});
typedef $$SynthesisRubricsTableUpdateCompanionBuilder
    = SynthesisRubricsCompanion Function({
  Value<String> id,
  Value<String> main,
  Value<String> chapter,
  Value<String> author,
  Value<String?> parentId,
  Value<String> remediesJson,
  Value<DateTime> updatedAt,
  Value<int> version,
  Value<int> rowid,
});

class $$SynthesisRubricsTableFilterComposer
    extends Composer<_$AppDatabase, $SynthesisRubricsTable> {
  $$SynthesisRubricsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get main => $composableBuilder(
      column: $table.main, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get chapter => $composableBuilder(
      column: $table.chapter, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get author => $composableBuilder(
      column: $table.author, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get parentId => $composableBuilder(
      column: $table.parentId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get remediesJson => $composableBuilder(
      column: $table.remediesJson, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get version => $composableBuilder(
      column: $table.version, builder: (column) => ColumnFilters(column));
}

class $$SynthesisRubricsTableOrderingComposer
    extends Composer<_$AppDatabase, $SynthesisRubricsTable> {
  $$SynthesisRubricsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get main => $composableBuilder(
      column: $table.main, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get chapter => $composableBuilder(
      column: $table.chapter, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get author => $composableBuilder(
      column: $table.author, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get parentId => $composableBuilder(
      column: $table.parentId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get remediesJson => $composableBuilder(
      column: $table.remediesJson,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get version => $composableBuilder(
      column: $table.version, builder: (column) => ColumnOrderings(column));
}

class $$SynthesisRubricsTableAnnotationComposer
    extends Composer<_$AppDatabase, $SynthesisRubricsTable> {
  $$SynthesisRubricsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get main =>
      $composableBuilder(column: $table.main, builder: (column) => column);

  GeneratedColumn<String> get chapter =>
      $composableBuilder(column: $table.chapter, builder: (column) => column);

  GeneratedColumn<String> get author =>
      $composableBuilder(column: $table.author, builder: (column) => column);

  GeneratedColumn<String> get parentId =>
      $composableBuilder(column: $table.parentId, builder: (column) => column);

  GeneratedColumn<String> get remediesJson => $composableBuilder(
      column: $table.remediesJson, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  GeneratedColumn<int> get version =>
      $composableBuilder(column: $table.version, builder: (column) => column);
}

class $$SynthesisRubricsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $SynthesisRubricsTable,
    SynthesisRubric,
    $$SynthesisRubricsTableFilterComposer,
    $$SynthesisRubricsTableOrderingComposer,
    $$SynthesisRubricsTableAnnotationComposer,
    $$SynthesisRubricsTableCreateCompanionBuilder,
    $$SynthesisRubricsTableUpdateCompanionBuilder,
    (
      SynthesisRubric,
      BaseReferences<_$AppDatabase, $SynthesisRubricsTable, SynthesisRubric>
    ),
    SynthesisRubric,
    PrefetchHooks Function()> {
  $$SynthesisRubricsTableTableManager(
      _$AppDatabase db, $SynthesisRubricsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SynthesisRubricsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SynthesisRubricsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SynthesisRubricsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> main = const Value.absent(),
            Value<String> chapter = const Value.absent(),
            Value<String> author = const Value.absent(),
            Value<String?> parentId = const Value.absent(),
            Value<String> remediesJson = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
            Value<int> version = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              SynthesisRubricsCompanion(
            id: id,
            main: main,
            chapter: chapter,
            author: author,
            parentId: parentId,
            remediesJson: remediesJson,
            updatedAt: updatedAt,
            version: version,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String main,
            Value<String> chapter = const Value.absent(),
            Value<String> author = const Value.absent(),
            Value<String?> parentId = const Value.absent(),
            Value<String> remediesJson = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
            Value<int> version = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              SynthesisRubricsCompanion.insert(
            id: id,
            main: main,
            chapter: chapter,
            author: author,
            parentId: parentId,
            remediesJson: remediesJson,
            updatedAt: updatedAt,
            version: version,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$SynthesisRubricsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $SynthesisRubricsTable,
    SynthesisRubric,
    $$SynthesisRubricsTableFilterComposer,
    $$SynthesisRubricsTableOrderingComposer,
    $$SynthesisRubricsTableAnnotationComposer,
    $$SynthesisRubricsTableCreateCompanionBuilder,
    $$SynthesisRubricsTableUpdateCompanionBuilder,
    (
      SynthesisRubric,
      BaseReferences<_$AppDatabase, $SynthesisRubricsTable, SynthesisRubric>
    ),
    SynthesisRubric,
    PrefetchHooks Function()>;
typedef $$ChaptersTableCreateCompanionBuilder = ChaptersCompanion Function({
  required String name,
  Value<int> rubricCount,
  Value<String> author,
  Value<DateTime> updatedAt,
  Value<int> rowid,
});
typedef $$ChaptersTableUpdateCompanionBuilder = ChaptersCompanion Function({
  Value<String> name,
  Value<int> rubricCount,
  Value<String> author,
  Value<DateTime> updatedAt,
  Value<int> rowid,
});

class $$ChaptersTableFilterComposer
    extends Composer<_$AppDatabase, $ChaptersTable> {
  $$ChaptersTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get rubricCount => $composableBuilder(
      column: $table.rubricCount, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get author => $composableBuilder(
      column: $table.author, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));
}

class $$ChaptersTableOrderingComposer
    extends Composer<_$AppDatabase, $ChaptersTable> {
  $$ChaptersTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get rubricCount => $composableBuilder(
      column: $table.rubricCount, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get author => $composableBuilder(
      column: $table.author, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));
}

class $$ChaptersTableAnnotationComposer
    extends Composer<_$AppDatabase, $ChaptersTable> {
  $$ChaptersTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<int> get rubricCount => $composableBuilder(
      column: $table.rubricCount, builder: (column) => column);

  GeneratedColumn<String> get author =>
      $composableBuilder(column: $table.author, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$ChaptersTableTableManager extends RootTableManager<
    _$AppDatabase,
    $ChaptersTable,
    Chapter,
    $$ChaptersTableFilterComposer,
    $$ChaptersTableOrderingComposer,
    $$ChaptersTableAnnotationComposer,
    $$ChaptersTableCreateCompanionBuilder,
    $$ChaptersTableUpdateCompanionBuilder,
    (Chapter, BaseReferences<_$AppDatabase, $ChaptersTable, Chapter>),
    Chapter,
    PrefetchHooks Function()> {
  $$ChaptersTableTableManager(_$AppDatabase db, $ChaptersTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$ChaptersTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$ChaptersTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$ChaptersTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> name = const Value.absent(),
            Value<int> rubricCount = const Value.absent(),
            Value<String> author = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              ChaptersCompanion(
            name: name,
            rubricCount: rubricCount,
            author: author,
            updatedAt: updatedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String name,
            Value<int> rubricCount = const Value.absent(),
            Value<String> author = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              ChaptersCompanion.insert(
            name: name,
            rubricCount: rubricCount,
            author: author,
            updatedAt: updatedAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$ChaptersTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $ChaptersTable,
    Chapter,
    $$ChaptersTableFilterComposer,
    $$ChaptersTableOrderingComposer,
    $$ChaptersTableAnnotationComposer,
    $$ChaptersTableCreateCompanionBuilder,
    $$ChaptersTableUpdateCompanionBuilder,
    (Chapter, BaseReferences<_$AppDatabase, $ChaptersTable, Chapter>),
    Chapter,
    PrefetchHooks Function()>;
typedef $$BooksTableCreateCompanionBuilder = BooksCompanion Function({
  required String id,
  required String title,
  Value<String> author,
  Value<String> description,
  Value<String> remedyCount,
  Value<String> icon,
  Value<int> color,
  Value<DateTime> updatedAt,
  Value<int> rowid,
});
typedef $$BooksTableUpdateCompanionBuilder = BooksCompanion Function({
  Value<String> id,
  Value<String> title,
  Value<String> author,
  Value<String> description,
  Value<String> remedyCount,
  Value<String> icon,
  Value<int> color,
  Value<DateTime> updatedAt,
  Value<int> rowid,
});

class $$BooksTableFilterComposer extends Composer<_$AppDatabase, $BooksTable> {
  $$BooksTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get title => $composableBuilder(
      column: $table.title, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get author => $composableBuilder(
      column: $table.author, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get description => $composableBuilder(
      column: $table.description, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get remedyCount => $composableBuilder(
      column: $table.remedyCount, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get icon => $composableBuilder(
      column: $table.icon, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get color => $composableBuilder(
      column: $table.color, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));
}

class $$BooksTableOrderingComposer
    extends Composer<_$AppDatabase, $BooksTable> {
  $$BooksTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get title => $composableBuilder(
      column: $table.title, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get author => $composableBuilder(
      column: $table.author, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get description => $composableBuilder(
      column: $table.description, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get remedyCount => $composableBuilder(
      column: $table.remedyCount, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get icon => $composableBuilder(
      column: $table.icon, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get color => $composableBuilder(
      column: $table.color, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));
}

class $$BooksTableAnnotationComposer
    extends Composer<_$AppDatabase, $BooksTable> {
  $$BooksTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get title =>
      $composableBuilder(column: $table.title, builder: (column) => column);

  GeneratedColumn<String> get author =>
      $composableBuilder(column: $table.author, builder: (column) => column);

  GeneratedColumn<String> get description => $composableBuilder(
      column: $table.description, builder: (column) => column);

  GeneratedColumn<String> get remedyCount => $composableBuilder(
      column: $table.remedyCount, builder: (column) => column);

  GeneratedColumn<String> get icon =>
      $composableBuilder(column: $table.icon, builder: (column) => column);

  GeneratedColumn<int> get color =>
      $composableBuilder(column: $table.color, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$BooksTableTableManager extends RootTableManager<
    _$AppDatabase,
    $BooksTable,
    Book,
    $$BooksTableFilterComposer,
    $$BooksTableOrderingComposer,
    $$BooksTableAnnotationComposer,
    $$BooksTableCreateCompanionBuilder,
    $$BooksTableUpdateCompanionBuilder,
    (Book, BaseReferences<_$AppDatabase, $BooksTable, Book>),
    Book,
    PrefetchHooks Function()> {
  $$BooksTableTableManager(_$AppDatabase db, $BooksTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$BooksTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$BooksTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$BooksTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> title = const Value.absent(),
            Value<String> author = const Value.absent(),
            Value<String> description = const Value.absent(),
            Value<String> remedyCount = const Value.absent(),
            Value<String> icon = const Value.absent(),
            Value<int> color = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              BooksCompanion(
            id: id,
            title: title,
            author: author,
            description: description,
            remedyCount: remedyCount,
            icon: icon,
            color: color,
            updatedAt: updatedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String title,
            Value<String> author = const Value.absent(),
            Value<String> description = const Value.absent(),
            Value<String> remedyCount = const Value.absent(),
            Value<String> icon = const Value.absent(),
            Value<int> color = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              BooksCompanion.insert(
            id: id,
            title: title,
            author: author,
            description: description,
            remedyCount: remedyCount,
            icon: icon,
            color: color,
            updatedAt: updatedAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$BooksTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $BooksTable,
    Book,
    $$BooksTableFilterComposer,
    $$BooksTableOrderingComposer,
    $$BooksTableAnnotationComposer,
    $$BooksTableCreateCompanionBuilder,
    $$BooksTableUpdateCompanionBuilder,
    (Book, BaseReferences<_$AppDatabase, $BooksTable, Book>),
    Book,
    PrefetchHooks Function()>;
typedef $$BookmarksTableCreateCompanionBuilder = BookmarksCompanion Function({
  required String itemId,
  required String itemType,
  required String title,
  Value<String?> href,
  Value<String?> author,
  Value<DateTime> createdAt,
  Value<bool> pendingSync,
  Value<int> rowid,
});
typedef $$BookmarksTableUpdateCompanionBuilder = BookmarksCompanion Function({
  Value<String> itemId,
  Value<String> itemType,
  Value<String> title,
  Value<String?> href,
  Value<String?> author,
  Value<DateTime> createdAt,
  Value<bool> pendingSync,
  Value<int> rowid,
});

class $$BookmarksTableFilterComposer
    extends Composer<_$AppDatabase, $BookmarksTable> {
  $$BookmarksTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get itemId => $composableBuilder(
      column: $table.itemId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get itemType => $composableBuilder(
      column: $table.itemType, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get title => $composableBuilder(
      column: $table.title, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get href => $composableBuilder(
      column: $table.href, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get author => $composableBuilder(
      column: $table.author, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get pendingSync => $composableBuilder(
      column: $table.pendingSync, builder: (column) => ColumnFilters(column));
}

class $$BookmarksTableOrderingComposer
    extends Composer<_$AppDatabase, $BookmarksTable> {
  $$BookmarksTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get itemId => $composableBuilder(
      column: $table.itemId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get itemType => $composableBuilder(
      column: $table.itemType, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get title => $composableBuilder(
      column: $table.title, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get href => $composableBuilder(
      column: $table.href, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get author => $composableBuilder(
      column: $table.author, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get pendingSync => $composableBuilder(
      column: $table.pendingSync, builder: (column) => ColumnOrderings(column));
}

class $$BookmarksTableAnnotationComposer
    extends Composer<_$AppDatabase, $BookmarksTable> {
  $$BookmarksTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get itemId =>
      $composableBuilder(column: $table.itemId, builder: (column) => column);

  GeneratedColumn<String> get itemType =>
      $composableBuilder(column: $table.itemType, builder: (column) => column);

  GeneratedColumn<String> get title =>
      $composableBuilder(column: $table.title, builder: (column) => column);

  GeneratedColumn<String> get href =>
      $composableBuilder(column: $table.href, builder: (column) => column);

  GeneratedColumn<String> get author =>
      $composableBuilder(column: $table.author, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<bool> get pendingSync => $composableBuilder(
      column: $table.pendingSync, builder: (column) => column);
}

class $$BookmarksTableTableManager extends RootTableManager<
    _$AppDatabase,
    $BookmarksTable,
    Bookmark,
    $$BookmarksTableFilterComposer,
    $$BookmarksTableOrderingComposer,
    $$BookmarksTableAnnotationComposer,
    $$BookmarksTableCreateCompanionBuilder,
    $$BookmarksTableUpdateCompanionBuilder,
    (Bookmark, BaseReferences<_$AppDatabase, $BookmarksTable, Bookmark>),
    Bookmark,
    PrefetchHooks Function()> {
  $$BookmarksTableTableManager(_$AppDatabase db, $BookmarksTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$BookmarksTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$BookmarksTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$BookmarksTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> itemId = const Value.absent(),
            Value<String> itemType = const Value.absent(),
            Value<String> title = const Value.absent(),
            Value<String?> href = const Value.absent(),
            Value<String?> author = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<bool> pendingSync = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              BookmarksCompanion(
            itemId: itemId,
            itemType: itemType,
            title: title,
            href: href,
            author: author,
            createdAt: createdAt,
            pendingSync: pendingSync,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String itemId,
            required String itemType,
            required String title,
            Value<String?> href = const Value.absent(),
            Value<String?> author = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<bool> pendingSync = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              BookmarksCompanion.insert(
            itemId: itemId,
            itemType: itemType,
            title: title,
            href: href,
            author: author,
            createdAt: createdAt,
            pendingSync: pendingSync,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$BookmarksTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $BookmarksTable,
    Bookmark,
    $$BookmarksTableFilterComposer,
    $$BookmarksTableOrderingComposer,
    $$BookmarksTableAnnotationComposer,
    $$BookmarksTableCreateCompanionBuilder,
    $$BookmarksTableUpdateCompanionBuilder,
    (Bookmark, BaseReferences<_$AppDatabase, $BookmarksTable, Bookmark>),
    Bookmark,
    PrefetchHooks Function()>;
typedef $$FavoritesTableCreateCompanionBuilder = FavoritesCompanion Function({
  required String itemId,
  required String itemType,
  required String title,
  Value<String?> href,
  Value<DateTime> createdAt,
  Value<bool> pendingSync,
  Value<int> rowid,
});
typedef $$FavoritesTableUpdateCompanionBuilder = FavoritesCompanion Function({
  Value<String> itemId,
  Value<String> itemType,
  Value<String> title,
  Value<String?> href,
  Value<DateTime> createdAt,
  Value<bool> pendingSync,
  Value<int> rowid,
});

class $$FavoritesTableFilterComposer
    extends Composer<_$AppDatabase, $FavoritesTable> {
  $$FavoritesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get itemId => $composableBuilder(
      column: $table.itemId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get itemType => $composableBuilder(
      column: $table.itemType, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get title => $composableBuilder(
      column: $table.title, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get href => $composableBuilder(
      column: $table.href, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get pendingSync => $composableBuilder(
      column: $table.pendingSync, builder: (column) => ColumnFilters(column));
}

class $$FavoritesTableOrderingComposer
    extends Composer<_$AppDatabase, $FavoritesTable> {
  $$FavoritesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get itemId => $composableBuilder(
      column: $table.itemId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get itemType => $composableBuilder(
      column: $table.itemType, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get title => $composableBuilder(
      column: $table.title, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get href => $composableBuilder(
      column: $table.href, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get pendingSync => $composableBuilder(
      column: $table.pendingSync, builder: (column) => ColumnOrderings(column));
}

class $$FavoritesTableAnnotationComposer
    extends Composer<_$AppDatabase, $FavoritesTable> {
  $$FavoritesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get itemId =>
      $composableBuilder(column: $table.itemId, builder: (column) => column);

  GeneratedColumn<String> get itemType =>
      $composableBuilder(column: $table.itemType, builder: (column) => column);

  GeneratedColumn<String> get title =>
      $composableBuilder(column: $table.title, builder: (column) => column);

  GeneratedColumn<String> get href =>
      $composableBuilder(column: $table.href, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<bool> get pendingSync => $composableBuilder(
      column: $table.pendingSync, builder: (column) => column);
}

class $$FavoritesTableTableManager extends RootTableManager<
    _$AppDatabase,
    $FavoritesTable,
    Favorite,
    $$FavoritesTableFilterComposer,
    $$FavoritesTableOrderingComposer,
    $$FavoritesTableAnnotationComposer,
    $$FavoritesTableCreateCompanionBuilder,
    $$FavoritesTableUpdateCompanionBuilder,
    (Favorite, BaseReferences<_$AppDatabase, $FavoritesTable, Favorite>),
    Favorite,
    PrefetchHooks Function()> {
  $$FavoritesTableTableManager(_$AppDatabase db, $FavoritesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$FavoritesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$FavoritesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$FavoritesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> itemId = const Value.absent(),
            Value<String> itemType = const Value.absent(),
            Value<String> title = const Value.absent(),
            Value<String?> href = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<bool> pendingSync = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              FavoritesCompanion(
            itemId: itemId,
            itemType: itemType,
            title: title,
            href: href,
            createdAt: createdAt,
            pendingSync: pendingSync,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String itemId,
            required String itemType,
            required String title,
            Value<String?> href = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<bool> pendingSync = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              FavoritesCompanion.insert(
            itemId: itemId,
            itemType: itemType,
            title: title,
            href: href,
            createdAt: createdAt,
            pendingSync: pendingSync,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$FavoritesTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $FavoritesTable,
    Favorite,
    $$FavoritesTableFilterComposer,
    $$FavoritesTableOrderingComposer,
    $$FavoritesTableAnnotationComposer,
    $$FavoritesTableCreateCompanionBuilder,
    $$FavoritesTableUpdateCompanionBuilder,
    (Favorite, BaseReferences<_$AppDatabase, $FavoritesTable, Favorite>),
    Favorite,
    PrefetchHooks Function()>;
typedef $$AppNotesTableCreateCompanionBuilder = AppNotesCompanion Function({
  Value<int> localId,
  required String itemId,
  required String itemType,
  required String content,
  Value<String?> metadata,
  Value<DateTime> createdAt,
  Value<DateTime> updatedAt,
  Value<bool> pendingSync,
  Value<String?> serverId,
});
typedef $$AppNotesTableUpdateCompanionBuilder = AppNotesCompanion Function({
  Value<int> localId,
  Value<String> itemId,
  Value<String> itemType,
  Value<String> content,
  Value<String?> metadata,
  Value<DateTime> createdAt,
  Value<DateTime> updatedAt,
  Value<bool> pendingSync,
  Value<String?> serverId,
});

class $$AppNotesTableFilterComposer
    extends Composer<_$AppDatabase, $AppNotesTable> {
  $$AppNotesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get localId => $composableBuilder(
      column: $table.localId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get itemId => $composableBuilder(
      column: $table.itemId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get itemType => $composableBuilder(
      column: $table.itemType, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get content => $composableBuilder(
      column: $table.content, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get metadata => $composableBuilder(
      column: $table.metadata, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get pendingSync => $composableBuilder(
      column: $table.pendingSync, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get serverId => $composableBuilder(
      column: $table.serverId, builder: (column) => ColumnFilters(column));
}

class $$AppNotesTableOrderingComposer
    extends Composer<_$AppDatabase, $AppNotesTable> {
  $$AppNotesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get localId => $composableBuilder(
      column: $table.localId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get itemId => $composableBuilder(
      column: $table.itemId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get itemType => $composableBuilder(
      column: $table.itemType, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get content => $composableBuilder(
      column: $table.content, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get metadata => $composableBuilder(
      column: $table.metadata, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get pendingSync => $composableBuilder(
      column: $table.pendingSync, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get serverId => $composableBuilder(
      column: $table.serverId, builder: (column) => ColumnOrderings(column));
}

class $$AppNotesTableAnnotationComposer
    extends Composer<_$AppDatabase, $AppNotesTable> {
  $$AppNotesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get localId =>
      $composableBuilder(column: $table.localId, builder: (column) => column);

  GeneratedColumn<String> get itemId =>
      $composableBuilder(column: $table.itemId, builder: (column) => column);

  GeneratedColumn<String> get itemType =>
      $composableBuilder(column: $table.itemType, builder: (column) => column);

  GeneratedColumn<String> get content =>
      $composableBuilder(column: $table.content, builder: (column) => column);

  GeneratedColumn<String> get metadata =>
      $composableBuilder(column: $table.metadata, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  GeneratedColumn<bool> get pendingSync => $composableBuilder(
      column: $table.pendingSync, builder: (column) => column);

  GeneratedColumn<String> get serverId =>
      $composableBuilder(column: $table.serverId, builder: (column) => column);
}

class $$AppNotesTableTableManager extends RootTableManager<
    _$AppDatabase,
    $AppNotesTable,
    AppNote,
    $$AppNotesTableFilterComposer,
    $$AppNotesTableOrderingComposer,
    $$AppNotesTableAnnotationComposer,
    $$AppNotesTableCreateCompanionBuilder,
    $$AppNotesTableUpdateCompanionBuilder,
    (AppNote, BaseReferences<_$AppDatabase, $AppNotesTable, AppNote>),
    AppNote,
    PrefetchHooks Function()> {
  $$AppNotesTableTableManager(_$AppDatabase db, $AppNotesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$AppNotesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$AppNotesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$AppNotesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> localId = const Value.absent(),
            Value<String> itemId = const Value.absent(),
            Value<String> itemType = const Value.absent(),
            Value<String> content = const Value.absent(),
            Value<String?> metadata = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
            Value<bool> pendingSync = const Value.absent(),
            Value<String?> serverId = const Value.absent(),
          }) =>
              AppNotesCompanion(
            localId: localId,
            itemId: itemId,
            itemType: itemType,
            content: content,
            metadata: metadata,
            createdAt: createdAt,
            updatedAt: updatedAt,
            pendingSync: pendingSync,
            serverId: serverId,
          ),
          createCompanionCallback: ({
            Value<int> localId = const Value.absent(),
            required String itemId,
            required String itemType,
            required String content,
            Value<String?> metadata = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
            Value<bool> pendingSync = const Value.absent(),
            Value<String?> serverId = const Value.absent(),
          }) =>
              AppNotesCompanion.insert(
            localId: localId,
            itemId: itemId,
            itemType: itemType,
            content: content,
            metadata: metadata,
            createdAt: createdAt,
            updatedAt: updatedAt,
            pendingSync: pendingSync,
            serverId: serverId,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$AppNotesTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $AppNotesTable,
    AppNote,
    $$AppNotesTableFilterComposer,
    $$AppNotesTableOrderingComposer,
    $$AppNotesTableAnnotationComposer,
    $$AppNotesTableCreateCompanionBuilder,
    $$AppNotesTableUpdateCompanionBuilder,
    (AppNote, BaseReferences<_$AppDatabase, $AppNotesTable, AppNote>),
    AppNote,
    PrefetchHooks Function()>;
typedef $$ReadingHistoryTableCreateCompanionBuilder = ReadingHistoryCompanion
    Function({
  required String itemId,
  required String itemType,
  required String title,
  Value<String?> href,
  Value<DateTime> viewedAt,
  Value<int> rowid,
});
typedef $$ReadingHistoryTableUpdateCompanionBuilder = ReadingHistoryCompanion
    Function({
  Value<String> itemId,
  Value<String> itemType,
  Value<String> title,
  Value<String?> href,
  Value<DateTime> viewedAt,
  Value<int> rowid,
});

class $$ReadingHistoryTableFilterComposer
    extends Composer<_$AppDatabase, $ReadingHistoryTable> {
  $$ReadingHistoryTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get itemId => $composableBuilder(
      column: $table.itemId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get itemType => $composableBuilder(
      column: $table.itemType, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get title => $composableBuilder(
      column: $table.title, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get href => $composableBuilder(
      column: $table.href, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get viewedAt => $composableBuilder(
      column: $table.viewedAt, builder: (column) => ColumnFilters(column));
}

class $$ReadingHistoryTableOrderingComposer
    extends Composer<_$AppDatabase, $ReadingHistoryTable> {
  $$ReadingHistoryTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get itemId => $composableBuilder(
      column: $table.itemId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get itemType => $composableBuilder(
      column: $table.itemType, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get title => $composableBuilder(
      column: $table.title, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get href => $composableBuilder(
      column: $table.href, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get viewedAt => $composableBuilder(
      column: $table.viewedAt, builder: (column) => ColumnOrderings(column));
}

class $$ReadingHistoryTableAnnotationComposer
    extends Composer<_$AppDatabase, $ReadingHistoryTable> {
  $$ReadingHistoryTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get itemId =>
      $composableBuilder(column: $table.itemId, builder: (column) => column);

  GeneratedColumn<String> get itemType =>
      $composableBuilder(column: $table.itemType, builder: (column) => column);

  GeneratedColumn<String> get title =>
      $composableBuilder(column: $table.title, builder: (column) => column);

  GeneratedColumn<String> get href =>
      $composableBuilder(column: $table.href, builder: (column) => column);

  GeneratedColumn<DateTime> get viewedAt =>
      $composableBuilder(column: $table.viewedAt, builder: (column) => column);
}

class $$ReadingHistoryTableTableManager extends RootTableManager<
    _$AppDatabase,
    $ReadingHistoryTable,
    ReadingHistoryData,
    $$ReadingHistoryTableFilterComposer,
    $$ReadingHistoryTableOrderingComposer,
    $$ReadingHistoryTableAnnotationComposer,
    $$ReadingHistoryTableCreateCompanionBuilder,
    $$ReadingHistoryTableUpdateCompanionBuilder,
    (
      ReadingHistoryData,
      BaseReferences<_$AppDatabase, $ReadingHistoryTable, ReadingHistoryData>
    ),
    ReadingHistoryData,
    PrefetchHooks Function()> {
  $$ReadingHistoryTableTableManager(
      _$AppDatabase db, $ReadingHistoryTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$ReadingHistoryTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$ReadingHistoryTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$ReadingHistoryTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> itemId = const Value.absent(),
            Value<String> itemType = const Value.absent(),
            Value<String> title = const Value.absent(),
            Value<String?> href = const Value.absent(),
            Value<DateTime> viewedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              ReadingHistoryCompanion(
            itemId: itemId,
            itemType: itemType,
            title: title,
            href: href,
            viewedAt: viewedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String itemId,
            required String itemType,
            required String title,
            Value<String?> href = const Value.absent(),
            Value<DateTime> viewedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              ReadingHistoryCompanion.insert(
            itemId: itemId,
            itemType: itemType,
            title: title,
            href: href,
            viewedAt: viewedAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$ReadingHistoryTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $ReadingHistoryTable,
    ReadingHistoryData,
    $$ReadingHistoryTableFilterComposer,
    $$ReadingHistoryTableOrderingComposer,
    $$ReadingHistoryTableAnnotationComposer,
    $$ReadingHistoryTableCreateCompanionBuilder,
    $$ReadingHistoryTableUpdateCompanionBuilder,
    (
      ReadingHistoryData,
      BaseReferences<_$AppDatabase, $ReadingHistoryTable, ReadingHistoryData>
    ),
    ReadingHistoryData,
    PrefetchHooks Function()>;
typedef $$SearchHistoryTableCreateCompanionBuilder = SearchHistoryCompanion
    Function({
  Value<int> id,
  required String query,
  Value<String> mode,
  Value<DateTime> searchedAt,
});
typedef $$SearchHistoryTableUpdateCompanionBuilder = SearchHistoryCompanion
    Function({
  Value<int> id,
  Value<String> query,
  Value<String> mode,
  Value<DateTime> searchedAt,
});

class $$SearchHistoryTableFilterComposer
    extends Composer<_$AppDatabase, $SearchHistoryTable> {
  $$SearchHistoryTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get query => $composableBuilder(
      column: $table.query, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get mode => $composableBuilder(
      column: $table.mode, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get searchedAt => $composableBuilder(
      column: $table.searchedAt, builder: (column) => ColumnFilters(column));
}

class $$SearchHistoryTableOrderingComposer
    extends Composer<_$AppDatabase, $SearchHistoryTable> {
  $$SearchHistoryTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get query => $composableBuilder(
      column: $table.query, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get mode => $composableBuilder(
      column: $table.mode, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get searchedAt => $composableBuilder(
      column: $table.searchedAt, builder: (column) => ColumnOrderings(column));
}

class $$SearchHistoryTableAnnotationComposer
    extends Composer<_$AppDatabase, $SearchHistoryTable> {
  $$SearchHistoryTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get query =>
      $composableBuilder(column: $table.query, builder: (column) => column);

  GeneratedColumn<String> get mode =>
      $composableBuilder(column: $table.mode, builder: (column) => column);

  GeneratedColumn<DateTime> get searchedAt => $composableBuilder(
      column: $table.searchedAt, builder: (column) => column);
}

class $$SearchHistoryTableTableManager extends RootTableManager<
    _$AppDatabase,
    $SearchHistoryTable,
    SearchHistoryData,
    $$SearchHistoryTableFilterComposer,
    $$SearchHistoryTableOrderingComposer,
    $$SearchHistoryTableAnnotationComposer,
    $$SearchHistoryTableCreateCompanionBuilder,
    $$SearchHistoryTableUpdateCompanionBuilder,
    (
      SearchHistoryData,
      BaseReferences<_$AppDatabase, $SearchHistoryTable, SearchHistoryData>
    ),
    SearchHistoryData,
    PrefetchHooks Function()> {
  $$SearchHistoryTableTableManager(_$AppDatabase db, $SearchHistoryTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SearchHistoryTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SearchHistoryTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SearchHistoryTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String> query = const Value.absent(),
            Value<String> mode = const Value.absent(),
            Value<DateTime> searchedAt = const Value.absent(),
          }) =>
              SearchHistoryCompanion(
            id: id,
            query: query,
            mode: mode,
            searchedAt: searchedAt,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required String query,
            Value<String> mode = const Value.absent(),
            Value<DateTime> searchedAt = const Value.absent(),
          }) =>
              SearchHistoryCompanion.insert(
            id: id,
            query: query,
            mode: mode,
            searchedAt: searchedAt,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$SearchHistoryTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $SearchHistoryTable,
    SearchHistoryData,
    $$SearchHistoryTableFilterComposer,
    $$SearchHistoryTableOrderingComposer,
    $$SearchHistoryTableAnnotationComposer,
    $$SearchHistoryTableCreateCompanionBuilder,
    $$SearchHistoryTableUpdateCompanionBuilder,
    (
      SearchHistoryData,
      BaseReferences<_$AppDatabase, $SearchHistoryTable, SearchHistoryData>
    ),
    SearchHistoryData,
    PrefetchHooks Function()>;
typedef $$SyncMetadataTableCreateCompanionBuilder = SyncMetadataCompanion
    Function({
  required String dataType,
  Value<DateTime?> lastSyncAt,
  Value<int> totalRecords,
  Value<String?> lastError,
  Value<String> status,
  Value<int> rowid,
});
typedef $$SyncMetadataTableUpdateCompanionBuilder = SyncMetadataCompanion
    Function({
  Value<String> dataType,
  Value<DateTime?> lastSyncAt,
  Value<int> totalRecords,
  Value<String?> lastError,
  Value<String> status,
  Value<int> rowid,
});

class $$SyncMetadataTableFilterComposer
    extends Composer<_$AppDatabase, $SyncMetadataTable> {
  $$SyncMetadataTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get dataType => $composableBuilder(
      column: $table.dataType, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get lastSyncAt => $composableBuilder(
      column: $table.lastSyncAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get totalRecords => $composableBuilder(
      column: $table.totalRecords, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get lastError => $composableBuilder(
      column: $table.lastError, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnFilters(column));
}

class $$SyncMetadataTableOrderingComposer
    extends Composer<_$AppDatabase, $SyncMetadataTable> {
  $$SyncMetadataTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get dataType => $composableBuilder(
      column: $table.dataType, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get lastSyncAt => $composableBuilder(
      column: $table.lastSyncAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get totalRecords => $composableBuilder(
      column: $table.totalRecords,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get lastError => $composableBuilder(
      column: $table.lastError, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnOrderings(column));
}

class $$SyncMetadataTableAnnotationComposer
    extends Composer<_$AppDatabase, $SyncMetadataTable> {
  $$SyncMetadataTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get dataType =>
      $composableBuilder(column: $table.dataType, builder: (column) => column);

  GeneratedColumn<DateTime> get lastSyncAt => $composableBuilder(
      column: $table.lastSyncAt, builder: (column) => column);

  GeneratedColumn<int> get totalRecords => $composableBuilder(
      column: $table.totalRecords, builder: (column) => column);

  GeneratedColumn<String> get lastError =>
      $composableBuilder(column: $table.lastError, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);
}

class $$SyncMetadataTableTableManager extends RootTableManager<
    _$AppDatabase,
    $SyncMetadataTable,
    SyncMetadataData,
    $$SyncMetadataTableFilterComposer,
    $$SyncMetadataTableOrderingComposer,
    $$SyncMetadataTableAnnotationComposer,
    $$SyncMetadataTableCreateCompanionBuilder,
    $$SyncMetadataTableUpdateCompanionBuilder,
    (
      SyncMetadataData,
      BaseReferences<_$AppDatabase, $SyncMetadataTable, SyncMetadataData>
    ),
    SyncMetadataData,
    PrefetchHooks Function()> {
  $$SyncMetadataTableTableManager(_$AppDatabase db, $SyncMetadataTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SyncMetadataTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SyncMetadataTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SyncMetadataTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> dataType = const Value.absent(),
            Value<DateTime?> lastSyncAt = const Value.absent(),
            Value<int> totalRecords = const Value.absent(),
            Value<String?> lastError = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              SyncMetadataCompanion(
            dataType: dataType,
            lastSyncAt: lastSyncAt,
            totalRecords: totalRecords,
            lastError: lastError,
            status: status,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String dataType,
            Value<DateTime?> lastSyncAt = const Value.absent(),
            Value<int> totalRecords = const Value.absent(),
            Value<String?> lastError = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              SyncMetadataCompanion.insert(
            dataType: dataType,
            lastSyncAt: lastSyncAt,
            totalRecords: totalRecords,
            lastError: lastError,
            status: status,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$SyncMetadataTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $SyncMetadataTable,
    SyncMetadataData,
    $$SyncMetadataTableFilterComposer,
    $$SyncMetadataTableOrderingComposer,
    $$SyncMetadataTableAnnotationComposer,
    $$SyncMetadataTableCreateCompanionBuilder,
    $$SyncMetadataTableUpdateCompanionBuilder,
    (
      SyncMetadataData,
      BaseReferences<_$AppDatabase, $SyncMetadataTable, SyncMetadataData>
    ),
    SyncMetadataData,
    PrefetchHooks Function()>;
typedef $$PendingChangesTableCreateCompanionBuilder = PendingChangesCompanion
    Function({
  Value<int> id,
  required String entityType,
  required String entityId,
  required String operation,
  required String payload,
  Value<DateTime> createdAt,
  Value<int> retryCount,
});
typedef $$PendingChangesTableUpdateCompanionBuilder = PendingChangesCompanion
    Function({
  Value<int> id,
  Value<String> entityType,
  Value<String> entityId,
  Value<String> operation,
  Value<String> payload,
  Value<DateTime> createdAt,
  Value<int> retryCount,
});

class $$PendingChangesTableFilterComposer
    extends Composer<_$AppDatabase, $PendingChangesTable> {
  $$PendingChangesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get entityType => $composableBuilder(
      column: $table.entityType, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get entityId => $composableBuilder(
      column: $table.entityId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get operation => $composableBuilder(
      column: $table.operation, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get payload => $composableBuilder(
      column: $table.payload, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get retryCount => $composableBuilder(
      column: $table.retryCount, builder: (column) => ColumnFilters(column));
}

class $$PendingChangesTableOrderingComposer
    extends Composer<_$AppDatabase, $PendingChangesTable> {
  $$PendingChangesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get entityType => $composableBuilder(
      column: $table.entityType, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get entityId => $composableBuilder(
      column: $table.entityId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get operation => $composableBuilder(
      column: $table.operation, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get payload => $composableBuilder(
      column: $table.payload, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get retryCount => $composableBuilder(
      column: $table.retryCount, builder: (column) => ColumnOrderings(column));
}

class $$PendingChangesTableAnnotationComposer
    extends Composer<_$AppDatabase, $PendingChangesTable> {
  $$PendingChangesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get entityType => $composableBuilder(
      column: $table.entityType, builder: (column) => column);

  GeneratedColumn<String> get entityId =>
      $composableBuilder(column: $table.entityId, builder: (column) => column);

  GeneratedColumn<String> get operation =>
      $composableBuilder(column: $table.operation, builder: (column) => column);

  GeneratedColumn<String> get payload =>
      $composableBuilder(column: $table.payload, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<int> get retryCount => $composableBuilder(
      column: $table.retryCount, builder: (column) => column);
}

class $$PendingChangesTableTableManager extends RootTableManager<
    _$AppDatabase,
    $PendingChangesTable,
    PendingChange,
    $$PendingChangesTableFilterComposer,
    $$PendingChangesTableOrderingComposer,
    $$PendingChangesTableAnnotationComposer,
    $$PendingChangesTableCreateCompanionBuilder,
    $$PendingChangesTableUpdateCompanionBuilder,
    (
      PendingChange,
      BaseReferences<_$AppDatabase, $PendingChangesTable, PendingChange>
    ),
    PendingChange,
    PrefetchHooks Function()> {
  $$PendingChangesTableTableManager(
      _$AppDatabase db, $PendingChangesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$PendingChangesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$PendingChangesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$PendingChangesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String> entityType = const Value.absent(),
            Value<String> entityId = const Value.absent(),
            Value<String> operation = const Value.absent(),
            Value<String> payload = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<int> retryCount = const Value.absent(),
          }) =>
              PendingChangesCompanion(
            id: id,
            entityType: entityType,
            entityId: entityId,
            operation: operation,
            payload: payload,
            createdAt: createdAt,
            retryCount: retryCount,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required String entityType,
            required String entityId,
            required String operation,
            required String payload,
            Value<DateTime> createdAt = const Value.absent(),
            Value<int> retryCount = const Value.absent(),
          }) =>
              PendingChangesCompanion.insert(
            id: id,
            entityType: entityType,
            entityId: entityId,
            operation: operation,
            payload: payload,
            createdAt: createdAt,
            retryCount: retryCount,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$PendingChangesTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $PendingChangesTable,
    PendingChange,
    $$PendingChangesTableFilterComposer,
    $$PendingChangesTableOrderingComposer,
    $$PendingChangesTableAnnotationComposer,
    $$PendingChangesTableCreateCompanionBuilder,
    $$PendingChangesTableUpdateCompanionBuilder,
    (
      PendingChange,
      BaseReferences<_$AppDatabase, $PendingChangesTable, PendingChange>
    ),
    PendingChange,
    PrefetchHooks Function()>;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$RemediesTableTableManager get remedies =>
      $$RemediesTableTableManager(_db, _db.remedies);
  $$RubricsTableTableManager get rubrics =>
      $$RubricsTableTableManager(_db, _db.rubrics);
  $$SynthesisRubricsTableTableManager get synthesisRubrics =>
      $$SynthesisRubricsTableTableManager(_db, _db.synthesisRubrics);
  $$ChaptersTableTableManager get chapters =>
      $$ChaptersTableTableManager(_db, _db.chapters);
  $$BooksTableTableManager get books =>
      $$BooksTableTableManager(_db, _db.books);
  $$BookmarksTableTableManager get bookmarks =>
      $$BookmarksTableTableManager(_db, _db.bookmarks);
  $$FavoritesTableTableManager get favorites =>
      $$FavoritesTableTableManager(_db, _db.favorites);
  $$AppNotesTableTableManager get appNotes =>
      $$AppNotesTableTableManager(_db, _db.appNotes);
  $$ReadingHistoryTableTableManager get readingHistory =>
      $$ReadingHistoryTableTableManager(_db, _db.readingHistory);
  $$SearchHistoryTableTableManager get searchHistory =>
      $$SearchHistoryTableTableManager(_db, _db.searchHistory);
  $$SyncMetadataTableTableManager get syncMetadata =>
      $$SyncMetadataTableTableManager(_db, _db.syncMetadata);
  $$PendingChangesTableTableManager get pendingChanges =>
      $$PendingChangesTableTableManager(_db, _db.pendingChanges);
}
