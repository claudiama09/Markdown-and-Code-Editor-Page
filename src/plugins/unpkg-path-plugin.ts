import * as esbuild from "esbuild-wasm";
import axios from "axios";
import localForage from "localforage";

const fileCache = localForage.createInstance({
  name: "fileCache",
});

(async () => {
  await fileCache.setItem("color", "red");

  const color = await fileCache.getItem("color");

  console.log(color);
})();

export const unpkgPathPlugin = () => {
  return {
    name: "unpkg-path-plugin", //for debugging purposes
    //setup function will be automatically called by esbuild with a single argument, build represents bundling process: finding some file, loading, parsing, transpile, join different files together
    setup(build: esbuild.PluginBuild) {
      //attach event listeners to listen to onResolve and onLoad events to interact with the build process
      //onResolve figures out where index.js file is stored
      //filter is gonna be implemented against file names
      build.onResolve({ filter: /.*/ }, async (args: any) => {
        console.log("onResolve", args);
        if (args.path === "index.js") {
          //namespace is similar to filter, which can be specified to apply onResolve to a specific file
          return { path: args.path, namespace: "a" };
        }

        if (args.path.includes("./") || args.path.includes("../")) {
          return {
            namespace: "a",
            path: new URL(
              args.path,
              "https://unpkg.com" + args.resolveDir + "/"
            ).href,
          };
        }
        return {
          namespace: "a",
          path: `https://unpkg.com/${args.path}`,
        };
      });
      build.onLoad({ filter: /.*/ }, async (args: any) => {
        //tries to load up index.js file
        console.log("onLoad", args);

        if (args.path === "index.js") {
          return {
            loader: "jsx",
            contents: `
              import React, { useState } from 'react@16.0.0';
              import ReactDOM from 'react-dom';
              console.log(React, useState, ReactDOM); 
            `, //this overwrites whatever inside index.js file
          };
        }

        // check to see if we have already fetched the file
        // and if it is in the cache
        const cachedResult = await fileCache.getItem(args.path);

        // if it is, return it immediately
        // otherwise, we will allow the request to happen
        if (cachedResult) {
          return cachedResult;
        }

        const { data, request } = await axios.get(args.path);

        const result = {
          loader: "jsx",
          contents: data,
          resolveDir: new URL("./", request.responseURL).pathname,
        };
        // store response in cache
        await fileCache.setItem(args.path, result);

        return result;
      });
    },
  };
};
