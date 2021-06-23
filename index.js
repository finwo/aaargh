#!/usr/bin/env node

const argv        = require('minimist')(process.argv.slice(2));
const path        = require('path');
const glob        = require('glob');
const merge       = require('deepmerge');
const configfiles = argv._;

// Our own options
let opts = {
  join: {
    long: "split",
    short: "split",
  },
  dash: {
    long: "--",
    short: "-",
  },
};

// Show help/usage
if (argv.help || argv.h) {
  process.stdout.write(`\n`);
  process.stdout.write(`Usage: ${process.argv[1]} [options] configfile [configfile...]\n`);
  process.stdout.write(`\n`);
  process.exit(0);
}

// Ensure we have config files
if (!configfiles.length) {
  process.stdout.write(`No config files were given.\n`);
  process.stdout.write(`Run '${process.argv[1]} --help' to see usage.\n`);
  process.exit(1);
}

// Catch for multi-config
if (configfiles.length > 1) {
  process.stdout.write(`Multiple config files are not supported.\n`);
  process.stdout.write(`Run '${process.argv[1]} --help' to see usage.\n`);
  process.exit(1);
}

// Load
let cfg = {};
for(const filename of configfiles) {
  cfg = merge(cfg, require(path.resolve(filename)));
}

// Load own options
if (cfg['$']) {
  opts = merge(opts, cfg['$']);
  delete cfg['$'];
}

// Escape helper function
function shell_escape(str) {
  return str
    .split('\\').join('\\\\')
    .split(' ').join('\\ ')
    ;
}

// Build arguments
const args = [];
async function parseArgument(key, value) {

  // Handle globs
  if ('string' === typeof value && ~value.indexOf('*')) {
    const entries = await new Promise((s,f) => {
      glob(value, function(err, files) {
        if (err) return f(err);
        s(files);
      });
    });
    if (entries.length > 1) {
      for(const entry of entries) {
        await parseArgument(key, entry)
      }
      return;
    }
    value = entries[0];
  }

  // Minimist-like direct arguments
  if ('_' == key) {
    args.push(value);
    return;
  }

  // Fetch how to render args
  const isLong = key.length > 1 ? opts.join.long : opts.join.short;
  const join = isLong ? opts.join.long : opts.join.short;
  const dash = isLong ? opts.dash.long : opts.dash.short;


  // Handle boolean like a flag
  if (value === false) return;
  if (value === true) {
    args.push(dash + key);
    return;
  }

  // Custom split join
  if ('split' == join) {
    args.push(dash + key);
    args.push(value);
    return;
  }

  // Merge
  args.push(dash + key + join + value);
}
(async () => {
  for (const key in cfg) {
    let opt = cfg[key];
    if (!Array.isArray(opt)) opt = [opt];
    for(const arg of opt) {
      await parseArgument(key, arg);
    }
  }

  process.stderr.write(
    args
      .map(arg => shell_escape(arg))
      .join(' ')
  );
  process.stderr.write('\n');

  process.stdout.write(
    args
      .map(arg => shell_escape(arg))
      .join(' ')
  );
  process.stdout.write('\n');

})();
