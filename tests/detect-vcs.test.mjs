import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { detectVcs } from "../src/lib/paths.mjs";

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "detectvcs-"));
}

function mkdirs(root, rel) {
  const dir = path.join(root, ...rel.split("/"));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

test("detectVcs: nested project inside SVN working copy root detects svn", () => {
  const tmp = tmpDir();
  try {
    fs.mkdirSync(path.join(tmp, ".svn")); // WC root marker (SVN 1.7+ layout)
    const proj = mkdirs(tmp, "branches/20260810_PayNow");
    assert.deepEqual(detectVcs(proj), { vcs: "svn" });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("detectVcs: nested project inside git repo root detects git", () => {
  const tmp = tmpDir();
  try {
    fs.mkdirSync(path.join(tmp, ".git"));
    const proj = mkdirs(tmp, "packages/sub-proj");
    assert.deepEqual(detectVcs(proj), { vcs: "git" });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("detectVcs: project root with both markers stays AMBIGUOUS_VCS", () => {
  const tmp = tmpDir();
  try {
    fs.mkdirSync(path.join(tmp, ".git"));
    fs.mkdirSync(path.join(tmp, ".svn"));
    assert.deepEqual(detectVcs(tmp), { vcs: null, error: "AMBIGUOUS_VCS" });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("detectVcs: direct markers at project root win over ancestors", () => {
  const tmp = tmpDir();
  try {
    fs.mkdirSync(path.join(tmp, ".svn")); // ancestor is a WC root
    const proj = mkdirs(tmp, "sub");
    fs.mkdirSync(path.join(proj, ".git")); // project itself is a git repo
    assert.deepEqual(detectVcs(proj), { vcs: "git" });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("detectVcs: no markers anywhere defaults to git", () => {
  const tmp = tmpDir();
  try {
    const proj = mkdirs(tmp, "blank/proj");
    // Canary: this machine's tmp ancestors are marker-free, so the walk finds nothing.
    assert.deepEqual(detectVcs(proj), { vcs: "git" });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
