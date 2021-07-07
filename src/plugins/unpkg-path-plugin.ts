import * as esbuild from "esbuild-wasm";

export const unpkgPathPlugin = () => {
  return {
    name: "unpkg-path-plugin", //for debugging purposes
    //setup function will be automatically called by esbuild with a single argument, build represents bundling process: finding some file, loading, parsing, transpile, join different files together
    setup(build: esbuild.PluginBuild) {
      //Handle root entry file of 'index.js'
      build.onResolve({ filter: /(^index\.js$)/ }, () => {
        //namespace is similar to filter, which can be specified to apply onResolve to a specific file
        return { path: "index.js", namespace: "a" };
      });
      //attach event listeners to listen to onResolve and onLoad events to interact with the build process
      //onResolve figures out where index.js file is stored
      //filter is gonna be implemented against file names

      //Handle relative paths in a module
      build.onResolve({ filter: /^\.+\// }, (args: any) => {
        return {
          namespace: "a",
          path: new URL(args.path, "https://unpkg.com" + args.resolveDir + "/")
            .href,
        };
      });

      //Handle main file of a module
      build.onResolve({ filter: /.*/ }, (args: any) => {
        return {
          namespace: "a",
          path: `https://unpkg.com/${args.path}`,
        };
      });
    },
  };
};
