// Turns coverage/lcov.info into the per-file table used as coverage evidence,
// and fails if the project drops below the required line coverage.
//
//   flutter test --coverage
//   dart run tool/coverage_summary.dart
//
// Pass --min=<percent> to change the gate (default 75, the assignment floor),
// and --out=<path> to also write the table to a file.
//
// Written against lcov.info directly rather than shelling out to `lcov`/
// `genhtml`, which are not installed by default on Windows.

import 'dart:io';

void main(List<String> args) {
  final min = double.parse(_arg(args, 'min') ?? '75');
  final outPath = _arg(args, 'out');
  final lcov = File('coverage/lcov.info');

  if (!lcov.existsSync()) {
    stderr.writeln('coverage/lcov.info not found — run `flutter test --coverage` first.');
    exit(2);
  }

  final files = _parse(lcov.readAsLinesSync());
  if (files.isEmpty) {
    stderr.writeln('coverage/lcov.info contained no records.');
    exit(2);
  }

  final totalFound = files.fold<int>(0, (s, f) => s + f.found);
  final totalHit = files.fold<int>(0, (s, f) => s + f.hit);
  final total = totalHit * 100 / totalFound;

  files.sort((a, b) => a.pct.compareTo(b.pct));

  final buf = StringBuffer()
    ..writeln('Line coverage — CareConnect (Flutter)')
    ..writeln('Generated ${DateTime.now().toUtc().toIso8601String().substring(0, 16)}Z '
        'from coverage/lcov.info')
    ..writeln('Regenerate: flutter test --coverage && dart run tool/coverage_summary.dart')
    ..writeln()
    ..writeln('  covered  lines  file')
    ..writeln('  ${'-' * 68}');

  for (final f in files) {
    buf.writeln('  ${f.pct.toStringAsFixed(2).padLeft(6)}%  '
        '${'${f.hit}/${f.found}'.padRight(9)}  ${f.path}');
  }

  buf
    ..writeln('  ${'-' * 68}')
    ..writeln('  ${total.toStringAsFixed(2).padLeft(6)}%  '
        '${'$totalHit/$totalFound'.padRight(9)}  TOTAL (${files.length} files)')
    ..writeln()
    ..writeln('Required: ${min.toStringAsFixed(0)}%  —  '
        '${total >= min ? 'PASS' : 'FAIL'} by '
        '${(total - min).abs().toStringAsFixed(2)} points');

  stdout.write(buf);
  if (outPath != null) {
    File(outPath)
      ..createSync(recursive: true)
      ..writeAsStringSync(buf.toString());
    stdout.writeln('\nWritten to $outPath');
  }

  if (total < min) {
    stderr.writeln('\nLine coverage ${total.toStringAsFixed(2)}% is below the '
        '${min.toStringAsFixed(0)}% floor.');
    exit(1);
  }
}

String? _arg(List<String> args, String name) {
  for (final a in args) {
    if (a.startsWith('--$name=')) return a.substring(name.length + 3);
  }
  return null;
}

class _FileCoverage {
  final String path;
  final int found;
  final int hit;
  _FileCoverage(this.path, this.found, this.hit);
  double get pct => found == 0 ? 0 : hit * 100 / found;
}

/// lcov.info is a flat record stream: `SF:` opens a file, each `DA:<line>,<n>`
/// gives an instrumented line and how many times it ran, `end_of_record`
/// closes it. Summary lines (`LF:`/`LH:`) are ignored in favour of counting
/// the `DA:` entries, so the totals cannot disagree with the detail.
List<_FileCoverage> _parse(List<String> lines) {
  final out = <_FileCoverage>[];
  String? path;
  var found = 0, hit = 0;

  for (final line in lines) {
    if (line.startsWith('SF:')) {
      path = line.substring(3).replaceAll(r'\', '/');
      found = 0;
      hit = 0;
    } else if (line.startsWith('DA:') && path != null) {
      final parts = line.substring(3).split(',');
      if (parts.length < 2) continue;
      found++;
      if ((int.tryParse(parts[1]) ?? 0) > 0) hit++;
    } else if (line.startsWith('end_of_record') && path != null) {
      out.add(_FileCoverage(path, found, hit));
      path = null;
    }
  }
  return out;
}
