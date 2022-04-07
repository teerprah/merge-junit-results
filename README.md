# merge-junit-results

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

## Nodejs cli to merge multiple JUnit XML test results

### Installation

    npm install -g merge-junit-results

Or just download the repository and include it in your `node_modules` directly.

### Usage

```
 Usage: merge-junit-results [options] <xmlFile1.xml> [xmlFile2.xml..]


  Options:

    -V, --version           output the version number
    -d, --dir <path>        merge all results in directory
    -C, --createDir         create the output directory if missing
    -r, --recursive         pass to recursively merge all results in directory
    -o, --out <mergedfile>  file to output to (default: ./merged-test-results.xml)
    -h, --help              output usage information
```

### Contributing

Feel free to submit issues and/or PRs!  In lieu of a formal style guide,
please follow existing styles.
