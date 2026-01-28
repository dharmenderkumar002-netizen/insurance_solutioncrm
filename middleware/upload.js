import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsRoot = path.join(process.cwd(), "backend", "uploads");

// ensure subfolders exist (with error handling for serverless environments)
["pan","aadhar","gst","policy","rc","other","proposal"].forEach(folder=>{
  const p = path.join(uploadsRoot, folder);
  try {
    if(!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  } catch (err) {
    // Silently fail on Vercel/serverless environments where we can't create directories
    console.warn(`Could not create upload directory ${p}:`, err.message);
  }
});

function storageFor(folder) {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(uploadsRoot, folder));
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const base = Date.now() + "-" + file.originalname.replace(/\s+/g,'_');
      cb(null, base);
    }
  });
}

export const uploadPan = multer({ storage: storageFor("pan") });
export const uploadAadhar = multer({ storage: storageFor("aadhar") });
export const uploadGst = multer({ storage: storageFor("gst") });
export const uploadPolicy = multer({ storage: storageFor("policy") });
export const uploadProposal = multer({ storage: storageFor("proposal") });
export const uploadRc = multer({ storage: storageFor("rc") });
export const uploadAny = multer({ storage: storageFor("other") });
