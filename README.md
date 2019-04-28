# React FRP

A Functional Reactive Programming architecture with [xstream](http://staltz.github.io/xstream/), built for React apps used by Lookback's frontend. Heavily inspired by [CycleJS](https://cycle.js.org).

## Examples

See `examples` directory for more code. Knowledge of how to program with streams is assumed.

We use:

- **React** as view, but you can use any view library that can draw from a single state object.
- **Typescript**, because we're not insane.
- **xstream**, because it's a minimal streams library which includes just what we need.

## Develop

```bash
npm install
npm run build # Build Typescript into "build"
npm run bundle # Build example bundle into "dist"
open dist/index.html # Test
```

## To Do

- [x] Working example
- [x] Proper types
- [ ] More examples?
- [ ] More documentation
