import { readFileSync } from "node:fs";

function readText(path) {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    throw new Error(`cannot read ${path}: ${error.message}`);
  }
}

function readJson(path) {
  try {
    return JSON.parse(readText(path));
  } catch (error) {
    throw new Error(`cannot parse ${path}: ${error.message}`);
  }
}

try {
  const pkg = readJson("package.json");
  const lock = readJson("package-lock.json");
  const version = pkg.version;
  const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
  if (typeof version !== "string" || !semver.test(version)) {
    throw new Error(`package.json version ${JSON.stringify(version)} is not valid semver`);
  }
  for (const [label, actual] of [["package-lock.json version", lock.version], ["package-lock.json root package version", lock.packages?.[""]?.version]]) {
    if (actual !== version) throw new Error(`package.json version is ${version}, but ${label} is ${JSON.stringify(actual)}`);
  }
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!new RegExp(`^##\\s+\\[${escaped}\\](?:\\s|$)`, "m").test(readText("CHANGELOG.md"))) {
    throw new Error(`CHANGELOG.md needs a level-two heading for [${version}]`);
  }
  if (!new RegExp(`^#\\s+Hundred\\s+${escaped}(?=\\s|$)`, "m").test(readText("docs/release-notes.md"))) {
    throw new Error(`docs/release-notes.md needs a title beginning '# Hundred ${version}'`);
  }
  if (process.env.GITHUB_REF_TYPE === "tag" && process.env.GITHUB_REF_NAME !== `v${version}`) {
    throw new Error(`tag ${JSON.stringify(process.env.GITHUB_REF_NAME)} must equal v${version}`);
  }
  console.log(`Release metadata is consistent for ${version}.`);
} catch (error) {
  console.error(`Release consistency error: ${error.message}`);
  process.exitCode = 1;
}
