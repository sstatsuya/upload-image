const express = require("express"); // import thư viện express đã cài ở trên
const app = express(); // app ở đây đại diện cho cái dự án nodejs mà mình sẽ làm việc xuyên suốt
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

const fs = require("fs");
const { google } = require("googleapis");
const {
  UNREAL_BACH_HOA_XANH,
  FOOD_RECIPE_IMAGE,
} = require("./static/constant");

const KEYFILEPATH = path.join(__dirname + "/static/key.json");
const SCOPES = ["https://www.googleapis.com/auth/drive"];
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

const createAndUpload = async (auth, filename, driveID) => {
  const driveService = google.drive({ version: "v3", auth });
  let fileMetaData = {
    name: filename + ".png",
    parents: [driveID],
  };
  let media = {
    mimeType: "image/png",
    body: fs.createReadStream(path.resolve(process.cwd(), "/tmp/" + filename)),
  };
  let response = await driveService.files.create({
    resource: fileMetaData,
    media: media,
    fields: "id",
  });
  fs.unlink(path.resolve(process.cwd(), "/tmp/" + filename), () => {});
  if (response.status < 299 && response.status > 199) {
    // return `https://drive.google.com/file/d/${response.data.id}/view`;
    // return `https://drive.google.com/thumbnail?id=${response.data.id}`;
    return `https://drive.google.com/uc?id=${response.data.id}`;
  }
  return "";
};

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// handle storage using multer
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(process.cwd(), "/tmp"));
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now());
  },
});

var upload = multer({ storage: storage });

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  // Cho app lắng nghe địa chỉ localhost (127.0.0.1) trên port 3002
  console.log(`Example app listening on port http://localhost:${PORT}`);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/assets/html/intro/index.html"));
});

// handle single file upload
app.post(
  "/food-recipe-upload-file",
  upload.single("dataFile"),
  async (req, res, next) => {
    try {
      // Khi gửi hình cũng phải gửi qua key là "dataFile"
      const file = req.file;
      if (!file) {
        return res.status(400).send({ message: "Please upload a file." });
      }
      let uploadRes = await createAndUpload(
        auth,
        file.filename,
        FOOD_RECIPE_IMAGE
      );
      if (uploadRes === "") return res.status(500).json({ success: false });
      console.log("[UPLOAD IMAGE] success");
      return res.json({ success: true, id: uploadRes });
    } catch (error) {
      console.log("[UPLOAD IMAGE] failed", error);
      res.json({
        isError: true,
        error: "[UPLOAD IMAGE] failed " + error,
      });
    }
  }
);

app.post(
  "/department-store",
  upload.single("dataFile"),
  async (req, res, next) => {
    try {
      // Khi gửi hình cũng phải gửi qua key là "dataFile"
      const file = req.file;
      if (!file) {
        return res.status(400).send({ message: "Please upload a file." });
      }
      let uploadRes = await createAndUpload(
        auth,
        file.filename,
        UNREAL_BACH_HOA_XANH
      );
      if (uploadRes === "") throw "Unknown";
      console.log("[UPLOAD IMAGE] success ", uploadRes);
      return res.json({ success: true, id: uploadRes });
    } catch (error) {
      console.log("[UPLOAD IMAGE] failed", error);
      res.json({
        isError: true,
        error: "[UPLOAD IMAGE] failed " + error,
      });
    }
  }
);

app.use((req, res) => {
  res.sendFile(path.join(__dirname + "/assets/html/error/index.html"));
});
