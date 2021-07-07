import * as esbuild from "esbuild-wasm";
import axios from "axios";
import localForage from "localforage";

const fileCache = localForage.createInstance({
  name: "fileCache",
});

export const fetchPlugin = (inputCode: string) => {
  return {
    name: "plugin",
    setup(build: esbuild.PluginBuild) {
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
        const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(
          args.path
        );

        // if it is, return it immediately
        // otherwise, we will allow the request to happen
        if (cachedResult) {
          return cachedResult;
        }

        const { data, request } = await axios.get(args.path);

        const fileType = args.path.match(/.css$/) ? "css" : "jsx";
        const content =
          fileType === "css"
            ? `
        const style = document.createElement('style');
        style.innerText = 'body'
      `
            : data;
        const result: esbuild.OnLoadResult = {
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
