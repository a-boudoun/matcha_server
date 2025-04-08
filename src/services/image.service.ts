import { query } from "../config/db";
import cloudinary from "../config/cloudinary";
import { UserImages } from "../dtos/user/userImages";
import { isValidImage } from "./user.service";

export const getAllImages = async (userId: string): Promise<UserImages[]> => {
  const getImagesQuery: string = `
        SELECT id, picture_url FROM pictures
        WHERE user_id = $1;
    `;
  try {
    const { rows: images } = await query(getImagesQuery, [userId]);

    const userImages: UserImages[] = images.map((image: any) => {
      return {
        id: image.id,
        secure_url: image.picture_url,
      };
    });

    return userImages;
  } catch (error) {
    console.error("Error getting images: ", error);
    throw error;
  }
};

export const removeImage = async (
  imageId: string,
  userId: string
): Promise<boolean> => {
  const getImageUrlQuery: string = `
    SELECT picture_url FROM pictures
    WHERE id = $1 AND user_id = $2;
`;

  const deleteImageQuery: string = `
    DELETE FROM pictures
    WHERE id = $1 AND user_id = $2;
`;
  try {
    const { rows: image } = await query(getImageUrlQuery, [imageId, userId]);

    if (image.length === 0) {
      return false;
    }

    const imagePublicId: string = image[0].picture_url
      .split("/")
      .pop()
      .split(".")[0];

    await cloudinary.uploader.destroy(imagePublicId.trim(), {
      invalidate: true,
    });

    await query(deleteImageQuery, [imageId, userId]);

    return true;
  } catch (error) {
    console.error("Error removing image: ", error);
    throw error;
  }
};

export const uploadImage = async (
  image: string,
  userId: string
): Promise<string | null> => {
  const addImageQuery: string = `
            INSERT INTO pictures (picture_url, user_id)
            VALUES ($1, $2)
            RETURNING id;
        `;
  const countImagesQuery: string = `
      SELECT COUNT(*) FROM pictures
      WHERE user_id = $1;
  `;

  try {
    const { rows: imageCount } = await query(countImagesQuery, [userId]);
    if (imageCount[0].count >= 4) {
      return "You can only upload 4 images";
    }
    if (!isValidImage(image)) {
      return "Invalid image";
    }
    let imageUrl: string;
    try {
      const result: any = await cloudinary.uploader.upload(image);
      imageUrl = result.secure_url;
    } catch (error) {
      return "Can not open image";
    }
    await query(addImageQuery, [imageUrl, userId]);
    return null;
  } catch (error) {
    console.error("Error adding image: ", error);
    throw error;
  }
};

export const updateProfileImage = async (
  image: string,
  userId: string
): Promise<string | null> => {
  const updateProfileImageQuery: string = `
        UPDATE users
        SET profile_image = $1
        WHERE id = $2;
        `;
  try {
    if (!isValidImage(image)) {
      return "Invalid image";
    }
    let profileImageUrl: string;
    try {
      const result: any = await cloudinary.uploader.upload(image);
      profileImageUrl = result.secure_url;
    } catch (error) {
      return "Can not open image";
    }

    await query(updateProfileImageQuery, [profileImageUrl, userId]);
    return null;
  } catch (error) {
    console.error("Error adding profile image: ", error);
    throw error;
  }
};
