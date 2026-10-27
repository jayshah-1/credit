import express from "express";
import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory cache for fast responsive UI
let cachedDatasetStats: any = null;
const cachedAudits: Record<string, any> = {};

function runPython(args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    execFile("python3", ["api_backend.py", ...args], { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        console.error("Python exec error:", stderr || err.message);
        return reject(new Error(stderr || err.message));
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch (parseErr) {
        reject(new Error("Failed to parse Python output: " + stdout));
      }
    });
  });
}

// 1. Dataset stats API
app.get("/api/dataset-stats", async (req, res) => {
  try {
    if (cachedDatasetStats) {
      return res.json(cachedDatasetStats);
    }
    const data = await runPython(["--action=dataset"]);
    cachedDatasetStats = data;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Model audit API
app.get("/api/models-audit", async (req, res) => {
  const sensitive = (req.query.sensitive as string) || "gender";
  try {
    if (cachedAudits[sensitive]) {
      return res.json(cachedAudits[sensitive]);
    }
    const data = await runPython(["--action=audit", `--sensitive=${sensitive}`]);
    cachedAudits[sensitive] = data;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Single applicant prediction API
app.post("/api/predict", async (req, res) => {
  try {
    const { applicant, modelType = "Baseline", sensitive = "gender" } = req.body;
    if (!applicant) {
      return res.status(400).json({ error: "Applicant data is required." });
    }
    const data = await runPython([
      "--action=predict",
      `--sensitive=${sensitive}`,
      `--model=${modelType}`,
      `--data=${JSON.stringify(applicant)}`
    ]);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. File source viewer API (for inspectable python project)
app.get("/api/file-content", (req, res) => {
  const file = req.query.file as string;
  const allowed = ["app.py", "model_pipeline.py", "fairness_metrics.py", "requirements.txt", "README.md"];
  if (!allowed.includes(file)) {
    return res.status(403).json({ error: "Access denied." });
  }
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found." });
  }
  res.setHeader("Content-Type", "text/plain");
  fs.createReadStream(filePath).pipe(res);
});

// 5. Direct file downloads for CSV and Markdown
app.get("/api/export/:type", async (req, res) => {
  const { type } = req.params;
  const sensitive = (req.query.sensitive as string) || "gender";

  try {
    if (type === "dataset.csv") {
      res.setHeader("Content-Disposition", "attachment; filename=faircredit_synthetic_loan_dataset.csv");
      res.setHeader("Content-Type", "text/csv");
      return fs.createReadStream(path.join(__dirname, "faircredit_synthetic_loan_dataset.csv")).pipe(res);
    }

    // Ensure audit is computed
    if (!cachedAudits[sensitive]) {
      cachedAudits[sensitive] = await runPython(["--action=audit", `--sensitive=${sensitive}`]);
    }
    const audit = cachedAudits[sensitive];

    if (type === "model_comparison_metrics.csv") {
      res.setHeader("Content-Disposition", "attachment; filename=model_comparison_metrics.csv");
      res.setHeader("Content-Type", "text/csv");
      const headers = Object.keys(audit.comparison_table[0]).join(",");
      const rows = audit.comparison_table.map((row: any) => Object.values(row).join(",")).join("\n");
      return res.send(`${headers}\n${rows}`);
    }

    if (type === "group_fairness_metrics.csv") {
      res.setHeader("Content-Disposition", "attachment; filename=group_fairness_metrics.csv");
      res.setHeader("Content-Type", "text/csv");
      const baseGroups = audit.group_tables.Baseline || [];
      if (baseGroups.length > 0) {
        const headers = Object.keys(baseGroups[0]).join(",");
        const rows = baseGroups.map((row: any) => Object.values(row).join(",")).join("\n");
        return res.send(`${headers}\n${rows}`);
      }
      return res.send("No group data available");
    }

    if (type === "business_comparison.csv") {
      res.setHeader("Content-Disposition", "attachment; filename=illustrative_business_comparison.csv");
      res.setHeader("Content-Type", "text/csv");
      const headers = Object.keys(audit.business_table[0]).join(",");
      const rows = audit.business_table.map((row: any) => Object.values(row).join(",")).join("\n");
      return res.send(`${headers}\n${rows}`);
    }

    if (type === "faircredit_audit_report.md") {
      res.setHeader("Content-Disposition", "attachment; filename=faircredit_audit_report.md");
      res.setHeader("Content-Type", "text/markdown");
      const md = `# FairCredit Algorithmic Bias Audit & Mitigation Report
**Dataset Status:** Synthetic Dataset — Academic Research Prototype
**Primary Target Variable:** repayment_success (Binary: 1 = Repaid, 0 = Defaulted)
**Sensitive Attribute Audited:** ${sensitive}

## 1. Executive Summary & Model Comparison

${JSON.stringify(audit.comparison_table, null, 2)}

## 2. Validation Thresholds Learned on Training Split
${JSON.stringify(audit.validation_thresholds, null, 2)}

## 3. Disaggregated Group Outcomes (Baseline)
${JSON.stringify(audit.group_tables.Baseline, null, 2)}

## 4. Illustrative Financial Simulation
${JSON.stringify(audit.business_table, null, 2)}
`;
      return res.send(md);
    }

    res.status(404).send("Unknown export type.");
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`FairCredit server running at http://localhost:${PORT}`);
  });
}

startServer();
