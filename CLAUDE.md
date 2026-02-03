# Introduction

This repository contains the code for **GTLint**, a linter and formatter for the GuidedTrack language. Here are some important links:

- [GuidedTrack home page](https://guidedtrack.com)
- [GuidedTrack documentation](https://docs.guidedtrack.com)

Also note that there are some useful reference files in the repository:

- The `/samples` directory contains a few different programs written in the GuidedTrack language. The programs all contain valid code and are in use in production.
- The `/gt.pdf` file is a PDF copy of the [Function & Keyword API](https://docs.guidedtrack.com/api/) page of the GuidedTrack documentation site linked above. It represents the most concise overview of the keywords and data types used in the language.

# What is GuidedTrack?

GuidedTrack is both a domain-specific language and a service for creating simple web apps, forms, surveys, and other interactive web tools. It was originally designed to help accelerate psychology research by making it faster and easier for researchers (who may or may not have computer programming experience) to create and deploy web-based surveys.

Since this repository is mostly focused on creating a linter and formatter for the language, this document won't spend any time describing the look and feel of the programs created with the language; nor will it spend any time describing how one uses the web service. Instead, it will focus solely on the language itself.

The language is designed to feel similar to Python. It uses _only_ tabs for indentation, and whitespace is significant. The language does not enforce a particular case for variable names; i.e., variables can use `camelCase` or `snake_case` or any other case. Please examine the files in the `/samples` folder for a taste of what it looks like.

# ESLint and Prettier

The goal of this project is to produce a linter and formatter for the GuidedTrack language that mimics the functionalities of ESLint and Prettier for the web languages. It should be usable both at the command line and in IDEs (e.g., VSCode) via extensions.

Ideally, it will be installable via NPM, like this:

```bash
npm install gt-lint
```

And it should have a simple command line API that can be invoked with `npx` and look something like this:

```bash
npx gt-lint lint [options] [paths]
npx gt-lint format [options] [paths]
```

Also, it should produce extensions for IDEs like VSCode. It should show warnings and errors in the same way that ESLint does (e.g., by underlining bits of code in orange or red), and it should automatically format code on save or on keyboard shortcut. Both the linter and the formatter should allow for configuration via a file in JS, JSON, or YAML formats (called something like `gtlint.config.js`). (It doesn't necessarily need to support all three formats; it could opinionatedly pick one.)

# Guidelines

- Feel free to ask clarifying questions at any time. Better to ask for clarification than to spend time potentially moving the project in the wrong direction.
- Feel free to update this document as needed to record comments, questions, clarifications, design decisions, or anything else that seems important for you to be able to reference later.
- The documentation website linked at the top of this document is quite large and sprawling, and I would recommend _not_ consulting it unless I'm unable to answer some specific question you might have. Between the sample programs, the `gt.pdf` file, and myself, most of your questions about the language should be answerable without needing to consult the website.
