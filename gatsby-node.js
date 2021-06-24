"use strict";

require("source-map-support").install();
require("ts-node").register({
  compilerOptions: {
    module: "commonjs",
    target: "es2017",
    esModuleInterop: true,
    strict: true,
    resolveJsonModule: true,
  },
});

const tsnode = require("./node-services/gatsby-node");

exports.onCreateNode = tsnode.onCreateNode;
exports.createPages = tsnode.createPages;
