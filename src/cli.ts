#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { resolve, relative, extname } from 'path';
import { globSync } from 'glob';
import { Linter } from './linter/index.js';
import { Formatter } from './formatter/index.js';
import { loadConfig } from './config.js';
import type { LintResult } from './types.js';

interface CLIOptions {
  config?: string;
  fix?: boolean;
  check?: boolean;
  write?: boolean;
  quiet?: boolean;
  format?: 'stylish' | 'json' | 'compact';
  help?: boolean;
  version?: boolean;
}

function printHelp(): void {
  console.log(`
gtlint - A linter and formatter for GuidedTrack

Usage:
  gtlint lint [options] [files...]    Lint GuidedTrack files
  gtlint format [options] [files...]  Format GuidedTrack files

Lint Options:
  --fix                Auto-fix fixable problems
  --quiet              Only report errors, not warnings
  --format <type>      Output format: stylish (default), json, compact

Format Options:
  --check              Check formatting without modifying files
  --write              Format and write back to files (default)

Common Options:
  --config <path>      Path to config file
  --help, -h           Show this help message
  --version, -v        Show version number

Examples:
  gtlint lint .                    Lint all .gt files in current directory
  gtlint lint src/                 Lint all .gt files in src directory
  gtlint lint program.gt           Lint a specific file
  gtlint lint --fix .              Lint and auto-fix all files
  gtlint format --check .          Check if files are formatted
  gtlint format --write .          Format all files in place
`);
}

function printVersion(): void {
  console.log('gtlint v0.1.0');
}

function parseArgs(args: string[]): { command: string; files: string[]; options: CLIOptions } {
  const options: CLIOptions = {};
  const files: string[] = [];
  let command = '';

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === 'lint' || arg === 'format') {
      command = arg;
    } else if (arg === '--config' && args[i + 1]) {
      options.config = args[++i];
    } else if (arg === '--fix') {
      options.fix = true;
    } else if (arg === '--check') {
      options.check = true;
    } else if (arg === '--write') {
      options.write = true;
    } else if (arg === '--quiet') {
      options.quiet = true;
    } else if (arg === '--format' && args[i + 1]) {
      options.format = args[++i] as 'stylish' | 'json' | 'compact';
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--version' || arg === '-v') {
      options.version = true;
    } else if (!arg.startsWith('-')) {
      files.push(arg);
    }

    i++;
  }

  return { command, files, options };
}

function findFiles(patterns: string[], ignore: string[]): string[] {
  const files: string[] = [];

  for (const pattern of patterns) {
    const resolved = resolve(pattern);

    if (existsSync(resolved) && statSync(resolved).isFile()) {
      if (extname(resolved) === '.gt') {
        files.push(resolved);
      }
    } else if (existsSync(resolved) && statSync(resolved).isDirectory()) {
      // Find all .gt files in directory
      const globPattern = `${resolved}/**/*.gt`;
      const found = globSync(globPattern, { ignore });
      files.push(...found);
    } else {
      // Treat as glob pattern
      const found = globSync(pattern, { ignore });
      files.push(...found.filter(f => extname(f) === '.gt'));
    }
  }

  return [...new Set(files)]; // Remove duplicates
}

function formatStylish(results: LintResult[]): string {
  const lines: string[] = [];
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const result of results) {
    if (result.messages.length === 0) continue;

    lines.push('');
    lines.push(result.filePath);

    for (const msg of result.messages) {
      const severity = msg.severity === 'error' ? '\x1b[31merror\x1b[0m' : '\x1b[33mwarning\x1b[0m';
      const location = `${msg.line}:${msg.column}`;
      lines.push(`  ${location.padEnd(8)} ${severity.padEnd(17)} ${msg.message}  \x1b[90m${msg.ruleId}\x1b[0m`);
    }

    totalErrors += result.errorCount;
    totalWarnings += result.warningCount;
  }

  if (totalErrors > 0 || totalWarnings > 0) {
    lines.push('');
    const summary: string[] = [];
    if (totalErrors > 0) summary.push(`${totalErrors} error${totalErrors === 1 ? '' : 's'}`);
    if (totalWarnings > 0) summary.push(`${totalWarnings} warning${totalWarnings === 1 ? '' : 's'}`);
    lines.push(`\x1b[1m${summary.join(', ')}\x1b[0m`);
  }

  return lines.join('\n');
}

function formatCompact(results: LintResult[]): string {
  const lines: string[] = [];

  for (const result of results) {
    for (const msg of result.messages) {
      lines.push(`${result.filePath}:${msg.line}:${msg.column}: ${msg.severity}: ${msg.message} [${msg.ruleId}]`);
    }
  }

  return lines.join('\n');
}

function formatJson(results: LintResult[]): string {
  return JSON.stringify(results, null, 2);
}

async function runLint(files: string[], options: CLIOptions): Promise<number> {
  const cwd = process.cwd();
  const configPath = options.config || cwd;
  const { linter: linterConfig, ignore } = await loadConfig(configPath);

  const targetFiles = files.length > 0 ? files : ['.'];
  const filePaths = findFiles(targetFiles, ignore);

  if (filePaths.length === 0) {
    console.log('No .gt files found');
    return 0;
  }

  const linter = new Linter(linterConfig);
  const results: LintResult[] = [];

  for (const filePath of filePaths) {
    const source = readFileSync(filePath, 'utf-8');
    const relativePath = relative(cwd, filePath);

    if (options.fix) {
      const fixed = linter.fix(source);
      if (fixed !== source) {
        writeFileSync(filePath, fixed, 'utf-8');
      }
      // Re-lint to get remaining issues
      const result = linter.lint(fixed, relativePath);
      results.push(result);
    } else {
      const result = linter.lint(source, relativePath);
      results.push(result);
    }
  }

  // Filter warnings if quiet mode
  if (options.quiet) {
    for (const result of results) {
      result.messages = result.messages.filter(m => m.severity === 'error');
      result.warningCount = 0;
    }
  }

  // Format output
  let output: string;
  switch (options.format) {
    case 'json':
      output = formatJson(results);
      break;
    case 'compact':
      output = formatCompact(results);
      break;
    default:
      output = formatStylish(results);
  }

  if (output.trim()) {
    console.log(output);
  }

  // Return exit code
  const hasErrors = results.some(r => r.errorCount > 0);
  return hasErrors ? 1 : 0;
}

async function runFormat(files: string[], options: CLIOptions): Promise<number> {
  const cwd = process.cwd();
  const configPath = options.config || cwd;
  const { formatter: formatterConfig, ignore } = await loadConfig(configPath);

  const targetFiles = files.length > 0 ? files : ['.'];
  const filePaths = findFiles(targetFiles, ignore);

  if (filePaths.length === 0) {
    console.log('No .gt files found');
    return 0;
  }

  const formatter = new Formatter(formatterConfig);
  let hasChanges = false;
  const changedFiles: string[] = [];

  for (const filePath of filePaths) {
    const source = readFileSync(filePath, 'utf-8');
    const formatted = formatter.format(source);
    const relativePath = relative(cwd, filePath);

    if (source !== formatted) {
      hasChanges = true;
      changedFiles.push(relativePath);

      if (!options.check) {
        writeFileSync(filePath, formatted, 'utf-8');
        console.log(`Formatted: ${relativePath}`);
      }
    }
  }

  if (options.check) {
    if (hasChanges) {
      console.log('The following files would be reformatted:');
      for (const file of changedFiles) {
        console.log(`  ${file}`);
      }
      return 1;
    } else {
      console.log('All files are properly formatted');
      return 0;
    }
  }

  if (!hasChanges) {
    console.log('All files are already properly formatted');
  }

  return 0;
}

export async function main(args: string[] = process.argv.slice(2)): Promise<void> {
  const { command, files, options } = parseArgs(args);

  if (options.help || (!command && !options.version)) {
    printHelp();
    process.exit(0);
  }

  if (options.version) {
    printVersion();
    process.exit(0);
  }

  try {
    let exitCode = 0;

    switch (command) {
      case 'lint':
        exitCode = await runLint(files, options);
        break;
      case 'format':
        exitCode = await runFormat(files, options);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        exitCode = 1;
    }

    process.exit(exitCode);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
