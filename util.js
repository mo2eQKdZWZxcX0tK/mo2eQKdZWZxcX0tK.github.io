const fs = require("fs");
const path = require("path");

// Centralized configuration items
const CONFIG = {
  readmeFilename: "README.md",
  sectionHeader: "## Jekyll-Safe File List\n",
  markdownExtension: ".md",
};

/**
 * Check if filename adheres to Jekyll safe naming rules
 * @param {string} filename - The filename to check
 * @returns {boolean} Whether it's safe
 */
const isJekyllSafeFilename = (filename) => {
  const unsafePatterns = [
    /:/, // Prohibit colons (causes URL scheme parsing errors)
    /[{}]/, // Prohibit Liquid template syntax conflict symbols
    /^\d{4}-\d{2}-\d{2}-/, // Jekyll requires date prefix for files in _posts directory
    /\s{2,}/, // Multiple consecutive spaces may cause path parsing issues
  ];
  return !unsafePatterns.some((pattern) => pattern.test(filename));
};

/**
 * Get all safe Markdown files in the current directory
 * @returns {string[]} Array of safe filenames
 */
const getAllSafeMarkdownFiles = () => {
  try {
    const currentDir = process.cwd();
    return fs.readdirSync(currentDir).filter((file) => {
      const isMd = path.extname(file).toLowerCase() === CONFIG.markdownExtension;
      const isNotReadme = path.basename(file) !== CONFIG.readmeFilename;
      const isSafe = isJekyllSafeFilename(file);

      if (isMd && !isSafe) {
        console.warn(
          `[Jekyll Warning] File "${file}" contains invalid characters that may cause parsing errors`
        );
      }

      return isMd && isNotReadme && isSafe;
    });
  } catch (error) {
    console.error(`Error scanning directory: ${error.message}`);
    return [];
  }
};

/**
 * Generate Markdown hyperlink list
 * @param {string[]} files - Array of filenames
 * @returns {string} Formatted Markdown link list
 */
const generateSafeLinks = (files) => {
  return files
    .map((file) => {
      const fileName = path.basename(file, CONFIG.markdownExtension);
      return `- [${fileName}](${encodeURI(file)})`;
    })
    .join("\n");
};

/**
 * Update README.md file
 */
const updateReadme = () => {
  try {
    const safeFiles = getAllSafeMarkdownFiles();
    
    if (safeFiles.length === 0) {
      console.log("No safe Markdown files found, README will not be updated.");
      return;
    }
    
    const links = generateSafeLinks(safeFiles);
    const readmePath = path.join(process.cwd(), CONFIG.readmeFilename);
    
    let content = "";
    try {
      content = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, "utf8") : "";
    } catch (error) {
      console.error(`Error reading README: ${error.message}`);
      content = "";
    }

    if (!content.includes(CONFIG.sectionHeader)) {
      content += `\n${CONFIG.sectionHeader}${links}\n`;
    } else {
      // Use safer regex replacement
      const escapedHeader = CONFIG.sectionHeader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      content = content.replace(
        new RegExp(`${escapedHeader}(.*?)(?=\n## |$)`, "s"),
        `${CONFIG.sectionHeader}${links}\n`
      );
    }

    fs.writeFileSync(readmePath, content);
    console.log("Successfully updated safe file list in README");
  } catch (error) {
    console.error(`Error updating README: ${error.message}`);
  }
};

// Execute update
updateReadme();
