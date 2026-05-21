import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();
// 1. Configure Cloudinary with your env variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// 2. Configure Multer to store the incoming file temporarily in server memory
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({ storage }).single('image'); // 'image' is the field name we expect from the frontend
// 3. The actual upload function
export const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No image file provided' });
            return;
        }
        // Convert the memory buffer into a Base64 string that Cloudinary can read
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        // Upload to Cloudinary into a specific folder
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'devernote_uploads',
            resource_type: 'auto',
        });
        // Send the secure URL back to the frontend!
        res.status(200).json({
            url: result.secure_url,
            imageId: result.public_id
        });
    }
    catch (error) {
        console.error('Cloudinary Upload Error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
};
