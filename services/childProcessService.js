import { spawn } from "child_process";

export const runChildProcess = (req, res) => {
  const { File: fileName, vbsName } = req.query;
  const { libPath, prjPath, apikey } = process.env;

  const env = { env: { libPath, prjPath, apikey } };
  const index = req.url.indexOf("?");
  const myUrl = req.url.substring(1, index > 0 ? index : req.url.length);

  console.log("Request URL:", myUrl);
  console.log("Request query:", req.query);
  console.log("Environment variables:", env.env);

  let childProcess;
  switch (myUrl) {
    case "Pre-Edit":
      console.log(
        "Spawning 'python ./pys/RefsEdit.py' with fileName:",
        fileName,
      );
      childProcess = spawn("python", ["./pys/RefsEdit.py", fileName], env);
      break;
    case "runQA":
      console.log(
        "Spawning 'python ./pys/Validate-Article.py' with fileName:",
        fileName,
      );
      childProcess = spawn(
        "python",
        ["./pys/Validate-Article.py", fileName],
        env,
      );
      break;
    case "Get-XML":
      console.log(
        "Spawning 'python ./pys/Get-XML.py' with fileName:",
        fileName,
      );
      childProcess = spawn("python", ["./pys/Get-XML.py", fileName], env);
      break;
    case "Typeset":
      console.log(
        "Spawning 'python ./pys/Typeset-XML.py' with fileName:",
        fileName,
      );
      childProcess = spawn("python", ["./pys/Typeset-XML.py", fileName], env);
      break;
    case "runVBS":
      console.log(
        "Spawning 'python ./pys/runVBAs.py' with fileName:",
        fileName,
        "and vbsName:",
        vbsName,
      );
      childProcess = spawn(
        "python",
        ["./pys/runVBAs.py", fileName, vbsName],
        env,
      );
      break;
    case "SaveAs":
      console.log(
        "Spawning 'cscript ./vbs/SaveAs.vbs' with srcFile:",
        req.query.srcFile,
        "and tgtFile:",
        req.query.tgtFile,
      );
      childProcess = spawn("cscript", [
        "./vbs/SaveAs.vbs",
        req.query.srcFile,
        req.query.tgtFile,
      ]);
      break;
    default:
      console.log("Invalid request URL:", myUrl);
      return res.status(400).send("Invalid request");
  }

  let output = "";
  childProcess.stdout.on("data", (data) => {
    console.log("Child process stdout:", data.toString());
    output += data;
  });
  childProcess.stderr.on("data", (data) => {
    console.error("Child process stderr:", data.toString());
    output += data;
  });

  childProcess.on("exit", (code) => {
    console.log("Child process exited with code:", code);
    res.status(code === 0 ? 200 : 500).send(output);
  });
};
