import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { getGraphClient } from "../services/graphService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to parse the file URL into components
function parseFileUrl(fileUrl) {
  const urlParts = fileUrl.split("/");
  const fileName = urlParts[urlParts.length - 1];
  const siteName = urlParts[4];
  const libraryName = urlParts[5];
  return { fileName, siteName, libraryName };
}

// Controller to download the main file and metadata
export const downloadFile = async (req, res) => {
  let stepNo = 0;
  try {
    console.log("Starting download process...");
    const { fileUrl } = req.query;
    if (!fileUrl) {
      throw new Error("File URL is required");
    }

    const { fileName, siteName, libraryName } = parseFileUrl(fileUrl);
    console.log("Parsed URL parts:", { fileName, siteName, libraryName });

    const graphClient = getGraphClient();
    console.log("Graph client initialized");

    stepNo = 1;
    console.log("Getting site ID for site:", siteName);
    const mySite = await graphClient.api(`/sites?search=${siteName}`).get();
    const siteId = mySite.value[0].id;
    console.log("Site ID retrieved:", siteId);

    stepNo = 2;
    console.log("Getting drives for site");
    const drives = await graphClient.api(`/sites/${siteId}/drives`).get();
    const targetDrive = drives.value.find((drive) =>
      drive.webUrl.includes(libraryName),
    );

    if (!targetDrive) {
      throw new Error(`Document library ${libraryName} not found`);
    }
    const driveId = targetDrive.id;
    console.log("Target drive found:", driveId);

    const relativeUrlParts = fileUrl.split(libraryName)[1];
    console.log("Relative URL parts:", relativeUrlParts);

    stepNo = 3;
    console.log("Getting main file details");
    const mainFile = await graphClient
      .api(`/drives/${driveId}/root:${relativeUrlParts}`)
      .get();
    console.log("Main file details retrieved:", mainFile.id);

    console.log("Downloading main file content");
    const fileContent = await graphClient
      .api(`/drives/${driveId}/items/${mainFile.id}/content`)
      .get();
    console.log("Main file content downloaded");

    // Construct the metadata path
    const metadataFileName = `${fileName.split(".")[0]}-metadata.csv`;
    const metadataPath_ = relativeUrlParts.replace(fileName, metadataFileName);

    const metadataPath = metadataPath_
      .replace("unedited-", "")
      .replace(/KGG(\d+)/, "KGG-$1");
    console.log("Metadata path constructed:", metadataPath);

    let csvContent;
    try {
      console.log("Attempting to get metadata file");
      const metadataFile = await graphClient
        .api(`/drives/${driveId}/root:${metadataPath}`)
        .get();
      console.log("Metadata file found:", metadataFile.id);

      console.log("Downloading metadata content");
      csvContent = await graphClient
        .api(`/drives/${driveId}/items/${metadataFile.id}/content`)
        .get();
      console.log("Metadata content downloaded");
    } catch (error) {
      console.warn("Metadata file not found:", error.message);
    }

    console.log("Creating downloads directory");
    const downloadDir = path.join(__dirname, "../downloads");
    await fs.promises.mkdir(downloadDir, { recursive: true });
    console.log("Downloads directory created:", downloadDir);

    console.log("Saving main file");
    const mainFilePath = path.join(downloadDir, fileName);
    await fs.promises.writeFile(mainFilePath, fileContent);
    console.log("Main file saved:", mainFilePath);

    if (csvContent) {
      console.log("Saving CSV file");
      const csvFilePath = path.join(downloadDir, metadataFileName);
      await fs.promises.writeFile(csvFilePath, csvContent);
      console.log("CSV file saved:", csvFilePath);
    }

    const responseData = {
      mainFile: fileName,
      csvFile: csvContent ? metadataFileName : null,
      message: "Files downloaded successfully",
    };
    console.log("Sending response:", responseData);

    res.json(responseData);
  } catch (error) {
    console.error(`Error in step #${stepNo}:`, error);
    res.status(500).json({ error: error.message });
  }
};

// Controller to serve downloaded files
export const getFileContent = async (req, res) => {
  try {
    console.log("Starting file download request");
    const { fileName } = req.params;
    console.log("Requested file:", fileName);

    const filePath = path.join(__dirname, "../downloads", fileName);
    console.log("Constructed file path:", filePath);

    if (!fs.existsSync(filePath)) {
      console.log("File not found:", filePath);
      return res.status(404).json({ error: "File not found" });
    }

    console.log("Initiating file download:", fileName);
    res.download(filePath);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({ error: error.message });
  }
};

// Controller to check if the file is available
export const checkFile = async (req, res) => {
  try {
    console.log("Starting file check");
    const { fileUrl } = req.query;
    if (!fileUrl) {
      throw new Error("File URL is required");
    }

    const { fileName, siteName, libraryName } = parseFileUrl(fileUrl);
    console.log("Parsed URL parts:", { fileName, siteName, libraryName });

    const graphClient = getGraphClient();
    console.log("Graph client initialized");

    console.log("Getting site information");
    const mySite = await graphClient.api(`/sites?search=${siteName}`).get();
    const siteId = mySite.value[0].id;
    console.log("Site ID retrieved:", siteId);

    console.log("Getting drives information");
    const drives = await graphClient.api(`/sites/${siteId}/drives`).get();
    const targetDrive = drives.value.find((drive) =>
      drive.webUrl.includes(libraryName),
    );

    if (!targetDrive) {
      throw new Error(`Document library ${libraryName} not found`);
    }
    console.log("Target drive found:", targetDrive.id);

    const relativeUrlParts = fileUrl.split(libraryName)[1];
    console.log("Getting file details");
    const driveItem = await graphClient
      .api(`/drives/${targetDrive.id}/root:${relativeUrlParts}`)
      .get();
    console.log("File details retrieved");

    console.log("Downloading file content");
    const fileContent = await graphClient
      .api(`/drives/${targetDrive.id}/items/${driveItem.id}/content`)
      .get();
    console.log("File content downloaded");

    const fileType = path.extname(fileName).toLowerCase();
    console.log("Sending file response with type:", fileType);
    res
      .contentType(fileType === ".pdf" ? "application/pdf" : "text/plain")
      .send(fileContent);
  } catch (error) {
    console.error("Error checking file:", error);
    res.status(500).json({ error: error.message });
  }
};
