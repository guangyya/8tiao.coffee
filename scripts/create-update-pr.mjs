import fs from "node:fs";

const token = required("GITHUB_TOKEN");
const apiUrl = required("GITHUB_API_URL");
const repository = required("GITHUB_REPOSITORY");
const serverUrl = required("GITHUB_SERVER_URL");
const issueNumber = required("ISSUE_NUMBER");
const branch = required("UPDATE_BRANCH");
const base = process.env.BASE_BRANCH || "main";
const summary = fs.existsSync("issue-update-summary.md")
  ? fs.readFileSync("issue-update-summary.md", "utf8").trim()
  : `自动应用 Issue #${issueNumber} 的网站内容更新。`;

if (process.env.HAS_CHANGES !== "true") {
  await comment(`没有检测到可自动应用的数据变更。\n\n${summary}`);
  process.exit(0);
}

const existingPulls = await request(`/repos/${repository}/pulls?head=${repository.split("/")[0]}:${branch}&state=open`);
if (Array.isArray(existingPulls) && existingPulls.length) {
  const pr = existingPulls[0];
  await comment(`已更新现有 PR：${pr.html_url}`);
  process.exit(0);
}

const pull = await request(`/repos/${repository}/pulls`, {
  method: "POST",
  body: {
    title: `更新夏季八调网站内容 (#${issueNumber})`,
    head: branch,
    base,
    body: [
      `Closes #${issueNumber}`,
      "",
      summary,
      "",
      "合并这个 PR 后，GitHub Pages 会发布更新后的静态网站。",
    ].join("\n"),
  },
});

await comment(`已根据这个 Issue 自动生成 PR：${pull.html_url}`);

async function comment(body) {
  await request(`/repos/${repository}/issues/${issueNumber}/comments`, {
    method: "POST",
    body: { body },
  });
}

async function request(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    method: options.method || "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }

  return data;
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}
