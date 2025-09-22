# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Silverscreen is a CLI tool for capturing responsive website screenshots using Puppeteer. It processes multiple URLs from a text file and captures screenshots at different breakpoints.

## Commands

### Development Commands
- `npm start <urls-file>` - Run the CLI tool with a URLs file
- `npm test` - No tests currently configured

### CLI Usage
- `node bin/silverscreen.js <urls-file> [options]` - Direct execution
- `silverscreen <urls-file> -o <output-dir>` - If installed globally

## Architecture

### Core Components

1. **CLI Entry Point** (`bin/silverscreen.js`)
   - Uses Commander.js for argument parsing
   - Handles file input validation and error reporting
   - Orchestrates the screenshot capture workflow

2. **URL Reader** (`src/urlReader.js`)
   - Reads and validates URLs from text files
   - Filters out invalid URLs using URL constructor validation
   - Returns array of valid URLs for processing

3. **Screenshotter** (`src/screenshotter.js`)
   - Main screenshot capture logic using Puppeteer
   - Manages browser lifecycle (launch/close)
   - Handles viewport sizing for different breakpoints
   - Contains site-specific logic for sandbox buttons and cookie notices

### Key Design Patterns

- **Breakpoint Configuration**: Predefined responsive breakpoints (390px, 768px, 1440px, 1920px)
- **File Organization**: Screenshots organized by breakpoint directories
- **Error Handling**: Graceful error handling with console logging
- **Browser Management**: Single browser instance for all screenshots with individual pages

### Dependencies

- **puppeteer**: Web scraping and screenshot capture
- **commander**: CLI argument parsing and command structure
- **Node.js built-ins**: fs, path for file operations

### File Structure

```
bin/silverscreen.js     - CLI entry point
src/
  urlReader.js          - URL file processing
  screenshotter.js      - Screenshot capture logic
package.json            - Node.js project configuration
```

## Site-Specific Features

The screenshotter includes specialized handling for:
- Sandbox buttons (`.pds-button` selector)
- Cookie notices (`.ila-cookieb__close-button` selector)

These suggest the tool may have been designed for specific website patterns or content management systems.
