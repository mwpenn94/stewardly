// Round 12.2: stub that replaces the 2.6 MB `mermaid` module pulled in by
// streamdown's diagram code path. Our app does not render mermaid diagrams,
// so this no-op keeps streamdown happy without bundling cytoscape, dagre,
// elkjs, khroma and friends. If we ever need real mermaid rendering, drop
// this stub and remove the alias in vite.config.ts.
const stub = {
  initialize: () => {},
  render: async (_id: string, _src: string) => ({ svg: "" }),
  parse: () => true,
  contentLoaded: () => {},
  parseError: undefined,
  default: {
    initialize: () => {},
    render: async (_id: string, _src: string) => ({ svg: "" }),
    parse: () => true,
    contentLoaded: () => {},
  },
};
export default stub;
export const initialize = stub.initialize;
export const render = stub.render;
export const parse = stub.parse;
export const contentLoaded = stub.contentLoaded;
