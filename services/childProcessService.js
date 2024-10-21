import { spawn } from "child_process";

export const runChildProcess = (req, res) => {
  const { File: fileName, vbsName } = req.query;
  const { libPath, prjPath, apikey } = process.env;

  const env = { env: { libPath, prjPath, apikey } };
  const index = req.url.indexOf("?");
  const myUrl = req.url.substring(1, index > 0 ? index : req.url.length);

  let childProcess;
  switch (myUrl) {
    case "Pre-Edit":
      childProcess = spawn("python", ["./pys/RefsEdit.py", fileName], env);
      break;
    case "runQA":
      childProcess = spawn(
        "python",
        ["./pys/Validate-Article.py", fileName],
        env,
      );
      break;
    case "Get-XML":
      childProcess = spawn("python", ["./pys/Get-XML.py", fileName], env);
      break;
    case "Typeset":
      childProcess = spawn("python", ["./pys/Typeset-XML.py", fileName], env);
      break;
    case "runVBS":
      childProcess = spawn(
        "python",
        ["./pys/runVBAs.py", fileName, vbsName],
        env,
      );
      break;
    case "SaveAs":
      childProcess = spawn("cscript", [
        "./vbs/SaveAs.vbs",
        req.query.srcFile,
        req.query.tgtFile,
      ]);
      break;
    default:
      return res.status(400).send("Invalid request");
  }

  let output = "";
  childProcess.stdout.on("data", (data) => (output += data));
  childProcess.stderr.on("data", (data) => (output += data));

  childProcess.on("exit", (code) => {
    res.status(code === 0 ? 200 : 500).send(output);
  });
};
