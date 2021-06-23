# aaargh

Many awesome cli tools exist that have plenty of options available on their
command lines but have no option to load in a configuration file to apply all
those arguments without having to write them each time.  This package seeks to
solve that problem.

## Usage

Let's say you want to run [esbuild](https://npmjs.com/package/esbuild) in a
certain way each time, but you want other people to be able to run that command
as well without littering your package.json with the wealth of arguments, or you
simply want to support zsh-like globs in your command.

```json
{
  "$": {
    "join": {
      "long": "="
    }
  },
  "outdir": "dist/",
  "target": "es2020",
  "_": [
    "src/**/*.js"
  ]
}
```

```sh
esbuild $(aaargh esbuild.config.json)
```
