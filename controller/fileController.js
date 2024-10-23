import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { getGraphClient } from "../services/graphService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const downloadFile = async (req, res) => {
  let stepNo = 0;
  try {
    const { fileUrl } = req.query;
    if (!fileUrl) {
      throw new Error("File URL is required");
    }

    const url = new URL(fileUrl);
    const pathSegments = url.pathname.split("/");
    const siteName = pathSegments[2];
    const libraryName = pathSegments[3];
    const relativePath = pathSegments.slice(4).join("/");
    const fileName = pathSegments[pathSegments.length - 1];

    const graphClient = getGraphClient();

    const mySite = await graphClient.api(`/sites?search=${siteName}`).get();
    const siteId = mySite.value[0].id;
    stepNo = 1;

    const drives = await graphClient.api(`/sites/${siteId}/drives`).get();
    const targetDrive = drives.value.find((drive) =>
      drive.webUrl.includes(libraryName),
    );

    if (!targetDrive) {
      throw new Error(`Document library ${libraryName} not found`);
    }

    const driveId = targetDrive.id;
    stepNo = 2;

    const driveItem = await graphClient
      .api(`/drives/${driveId}/root:/${relativePath}`)
      .get();

    const response = await graphClient
      .api(`/drives/${driveId}/items/${driveItem.id}/content`)
      .get();

    const localFilePath = path.join(__dirname, "../downloads", fileName);
    await fs.promises.mkdir(path.dirname(localFilePath), { recursive: true });
    await fs.promises.writeFile(localFilePath, response);

    res.download(localFilePath);
  } catch (error) {
    console.error(`Error in step #${stepNo}:`, error);
    res.status(500).json({ error: error.message });
  }
};

export const checkFile = async (req, res) => {
  try {
    const { fileUrl } = req.query;
    if (!fileUrl) {
      throw new Error("File URL is required");
    }

    const url = new URL(fileUrl);
    const fileName = url.pathname.split("/").pop();
    const fileType = path.extname(fileName);
    const nameParts = fileName.split("-");
    const JID = nameParts[0];
    const AID = nameParts[1].split(".")[0];

    const fullFilePath = path.join(process.env.libPath, JID, AID, fileName);

    const data = await fs.promises.readFile(fullFilePath);
    res
      .contentType(fileType === ".pdf" ? "application/pdf" : "text/plain")
      .send(data);
  } catch (error) {
    console.error("Error checking file:", error);
    res.status(500).send("File not found");
  }
};
