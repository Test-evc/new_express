import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { getGraphClient } from "../services/graphService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const downloadFile = async (req, res) => {
  let stepNo = 0;
  try {
    const graphClient = getGraphClient();
    const siteName = "Test";
    const libraryName = "SageArticlesLibrary";
    const mySite = await graphClient.api(`/sites?search=${siteName}`).get();
    const siteId = mySite.value[0].id;

    stepNo = 2;
    const drives = await graphClient.api(`/sites/${siteId}/drives`).get();
    const targetDrive = drives.value.find((drive) =>
      drive.webUrl.includes(libraryName),
    );
    if (!targetDrive)
      throw new Error(`Document library ${libraryName} not found`);

    const driveId = targetDrive.id;
    const driveItemPath = "/KGG/1000001/KGG-1000001-metadata.csv";
    const driveItem = await graphClient
      .api(`/drives/${driveId}/root:${driveItemPath}`)
      .get();

    const response = await graphClient
      .api(`/drives/${driveId}/items/${driveItem.id}/content`)
      .get();
    const localFilePath = path.join(
      __dirname,
      "../downloads",
      "KGG-1000001-metadata.csv",
    );

    await fs.promises.mkdir(path.dirname(localFilePath), { recursive: true });
    await fs.promises.writeFile(localFilePath, response);

    res.download(localFilePath);
  } catch (error) {
    console.error(`Error in step #${stepNo}:`, error);
    res.status(500).json({ error: error.message });
  }
};

export const checkFile = (req, res) => {
  const { File: fileName, Type: fileType } = req.query;
  const nameParts = fileName.split("-");
  const JID = nameParts[0];
  const AID = nameParts[1];
  const fullFilePath = path.join(
    process.env.libPath,
    JID,
    AID,
    `${fileName}${fileType}`,
  );

  fs.readFile(fullFilePath, (err, data) => {
    if (err) return res.status(500).send("File not found");

    res
      .contentType(fileType === ".pdf" ? "application/pdf" : "text/plain")
      .send(data);
  });
};
