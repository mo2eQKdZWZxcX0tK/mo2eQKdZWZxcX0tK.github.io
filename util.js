const fs = require("fs");
const path = require("path");

// Check for filename patterns that may cause Jekyll parsing errors
const isJekyllSafeFilename = (filename) => {
  const unsafePatterns = [
    /:/, // Prohibit colons (causes URL scheme parsing errors)
    /[{}]/, // Prohibit Liquid template syntax conflict symbols
    /^\d{4}-\d{2}-\d{2}-/, // Jekyll requires date prefix for files in _posts directory
    /\s{2,}/, // Multiple consecutive spaces may cause path parsing issues
  ];
  return !unsafePatterns.some((pattern) => pattern.test(filename));
};

// Get all Markdown files in current directory (excluding README.md)
const getAllSafeMarkdownFiles = () => {
  const currentDir = process.cwd();
  return fs.readdirSync(currentDir).filter((file) => {
    const isMd = path.extname(file).toLowerCase() === ".md";
    const isNotReadme = path.basename(file) !== "README.md";
    const isSafe = isJekyllSafeFilename(file);

    if (isMd && !isSafe) {
      console.warn(
        `[Jekyll Warning] File "${file}" contains invalid characters that may cause parsing errors`
      );
    }

    return isMd && isNotReadme && isSafe;
  });
};

// Generate Markdown hyperlink list (with safety indicators)
const generateSafeLinks = (files) => {
  return files
    .map((file) => {
      const fileName = path.basename(file, ".md");
      const relativePath = path.relative(process.cwd(), file);
      return `- [${fileName}](${encodeURI(relativePath)})`; // URL encoding for special characters
    })
    .join("\n");
};

// Update README.md
const updateReadme = () => {
  const safeFiles = getAllSafeMarkdownFiles();
  const links = generateSafeLinks(safeFiles);

  const readmePath = path.join(process.cwd(), "README.md");
  let content = fs.existsSync(readmePath)
    ? fs.readFileSync(readmePath, "utf8")
    : "";

  const sectionHeader = "## Jekyll-Safe File List\n";
  if (!content.includes(sectionHeader)) {
    content += `\n${sectionHeader}${links}`;
  } else {
    content = content.replace(
      new RegExp(`${sectionHeader}(.*?)(?=\n## |$)`, "s"),
      `${sectionHeader}${links}`
    );
  }

  fs.writeFileSync(readmePath, content);
  console.log("Updated safe file list, excluded potentially conflicting files");
};

updateReadme();
