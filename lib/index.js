"use strict";

const fs = require("fs");
const fspath = require("path");
const read = require("fs-readdir-recursive");
var xmldoc = require("xmldoc");
const mkdirp = require("mkdirp");

module.exports.testsuiteCount = 0;
module.exports.testsuites = [];
module.exports.testSuiteSummary = [];

/**
 * Read XML from file
 * @param {string} fileName
 */
function parseXmlFromFile(fileName) {
  try {
    var xmlFile = fs.readFileSync(fileName, "utf8");
    var xmlDoc = new xmldoc.XmlDocument(xmlFile);

    // Single testsuite, not wrapped in a testsuites
    if (xmlDoc.name === "testsuite") {
      module.exports.testsuites = xmlDoc;
      module.exports.testsuiteCount = 1;
    } else if(xmlDoc.name === "testsuites") {
      //Testsuitesummary
      module.exports.testsuiteSummary = xmlDoc;
      module.exports.testsuites = xmlDoc.childrenNamed("testsuite");
      module.exports.testsuiteCount = module.exports.testsuites.length;
    }
    else{
      module.exports.testsuites = xmlDoc.childrenNamed("testsuite");
      module.exports.testsuiteCount = module.exports.testsuites.length;
    }

    return xmlDoc;
  } catch (e) {
    if (e.code === "ENOENT") {
      // Bad directory
      return "File not found";
    }
    // Unknown error
    return e;
  }
}

/**
 * List all XML files in directory
 * @param {*} path
 * @param {*} recursive
 */
function listXmlFiles(path, recursive) {
  try {
    var allFiles = recursive ? read(path) : fs.readdirSync(path);

    var xmlFiles = allFiles
      .map(function(file) {
        return fspath.join(path, file);
      })
      // Fiter out non-files
      .filter(function(file) {
        return fs.statSync(file).isFile();
      })
      // Only return files ending in '.xml'
      .filter(function(file) {
        return file.slice(-4) === ".xml";
      });
    // No files returned
    if (!xmlFiles.length > 0) {
      return new Error("No xml files found");
    } else {
      // Return the array of files ending in '.xml'
      return xmlFiles;
    }
  } catch (e) {
    throw e;
  }
}

/**
 * Extract JUNIT test suites from XML
 * @param {*} filename
 */
function getTestsuites(filename) {
  var xmlFile = parseXmlFromFile(filename);
  if (xmlFile === "File not found") {
    throw new Error("File not found");
  } else {
    try {
      var testsuites = "";
      // Single testsuite, not wrapped in a testsuites
      if (xmlFile.name === "testsuite") {
        return [xmlFile];
      } else {
        // Multiple testsuites, wrapped in a parent
        return xmlFile.childrenNamed("testsuite");
      }
    } catch (e) {
      if (e.message === "xmlFile.childrenNamed is not a function") {
        throw new Error("No tests found");
      } else {
        return e;
      }
    }
  }
}

/**
 * Extract JUNIT test suites parent <testsuites> from XML
 * @param {*} filename
 */
 function getTestsuiteSummary(filename) {
  var xmlFile = parseXmlFromFile(filename);
  if (xmlFile === "File not found") {
    throw new Error("File not found");
  } else {
    try {
      // Single testsuite, not wrapped in a testsuites
      if (xmlFile.name === "testsuites") {
        return [xmlFile];
      } else {
        // Multiple testsuites, wrapped in a parent
        return xmlFile.childrenNamed("testsuites");
      }
    } catch (e) {
      if (e.message === "xmlFile.childrenNamed is not a function") {
        throw new Error("No tests found");
      } else {
        return e;
      }
    }
  }
}

function anyFileHasTestSuiteSummary(files){
  let hasTestSuiteSummary = false;
  files.forEach(function(file){
    var xmlFile = parseXmlFromFile(file);
    if (xmlFile === "File not found") {
      throw new Error("File not found");
    } else {
        hasTestSuiteSummary =  (xmlFile.name === "testsuites")
    };
  });
  return hasTestSuiteSummary;
}

function mergeFiles(files, outputName) {
  var mergedTestSuites = "";
  var time = 0;
  var name = outputName.replace('.xml','');
  var tests = 0;
  var failures = 0; 
  if(anyFileHasTestSuiteSummary(files)){
    files.forEach(function(file) {
      try {
        var mergedFile = "";
        var testsuiteSummary = getTestsuiteSummary(file);
        testsuiteSummary.forEach(function(testsuiteSummary){
          time+= parseFloat(Number(parseFloat(testsuiteSummary.attr.time).toFixed(6)));
          tests+= parseInt(testsuiteSummary.attr.tests);
          failures += parseInt(testsuiteSummary.attr.failures);
        });
  
        var fileTestSuites = getTestsuites(file);
        fileTestSuites.forEach(function(testSuite){
          mergedFile += testSuite.toString();
        });
       
        mergedTestSuites += mergedFile;
        if (mergedTestSuites === "") {
          throw new Error("No tests found");
        }
      } catch (err) {
        if (err.message != "No tests found") {
          console.error(err);
          throw err;
        }
      }
    });
  }
  else{
    files.forEach(function(file) {
      try {
        var mergedFile = "";
        var fileTestSuites = getTestsuites(file);
        fileTestSuites.forEach(function(testSuite){
          mergedFile += testSuite.toString();
            time+= parseFloat(Number(parseFloat(testSuite.attr.time).toFixed(6)));
            tests+= parseInt(testSuite.attr.tests);
            failures += parseInt(testSuite.attr.failures);
        });
       
        mergedTestSuites += mergedFile;
        if (mergedTestSuites === "") {
          throw new Error("No tests found");
        }
      } catch (err) {
        if (err.message != "No tests found") {
          console.error(err);
          throw err;
        }
      }
    });
  }

  return new xmldoc.XmlDocument(`<?xml version="1.0"?>\n<testsuites name=\"${name}\" time=\"${time}\" tests=\"${tests}\" failures=\"${failures}\" >\n${mergedTestSuites}</testsuites>`).toString();
}

function writeMergedFile(file, data, createOutputDir) {
  try {
    fs.writeFileSync(file, data);
  } catch (error) {
    if (error.code == "ENOENT") {
      if (createOutputDir) {
        mkdirp.sync(file.substr(0, file.lastIndexOf("/")));
        fs.writeFileSync(file, data);
      } else {
        throw new Error("Missing output directory");
      }
    }
  }
}

module.exports = {
  listXmlFiles,
  mergeFiles,
  getTestsuites,
  writeMergedFile,
};
