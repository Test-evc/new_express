import { Router } from "express";
import { checkFile, downloadFile } from "./controller/fileController.js";
import { runChildProcess } from "./services/childProcessService.js";

const router = Router();

router.get("/test", (req, res) => res.json({ message: "true" }));
router.get("/download-file", downloadFile);
router.get("/CheckFile", checkFile);

router.get("/Pre-Edit", runChildProcess);
router.get("/runQA", runChildProcess);
router.get("/Get-XML", runChildProcess);
router.get("/Typeset", runChildProcess);
router.get("/runVBS", runChildProcess);
router.get("/SaveAs", runChildProcess);

export default router;
