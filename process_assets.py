import os
from PIL import Image

def process_image(input_path, output_path, target_size=(256, 256), tolerance=30):
    """
    Removes white background from an image and resizes it.
    
    Args:
        input_path: Path to the input image.
        output_path: Path to save the processed image.
        target_size: Tuple (width, height) for resizing.
        tolerance: Color tolerance for considering a pixel as 'white'.
    """
    try:
        # Open the image and convert to RGBA
        img = Image.open(input_path).convert("RGBA")
        data = img.getdata()

        newData = []
        for item in data:
            # Check if pixel is close to white
            if item[0] >= 255 - tolerance and item[1] >= 255 - tolerance and item[2] >= 255 - tolerance:
                # Fully transparent
                newData.append((255, 255, 255, 0))
            else:
                # Keep original pixel
                newData.append(item)

        # Update image with new data
        img.putdata(newData)
        
        # Optional: Crop to bounding box before resizing to maximize the fish size
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)

        # Resize image using Lanczos resampling for high quality
        # Maintain aspect ratio by pasting into a transparent square
        img.thumbnail(target_size, Image.Resampling.LANCZOS)
        
        # Create a new transparent image of the target size
        final_img = Image.new("RGBA", target_size, (255, 255, 255, 0))
        
        # Calculate position to paste the resized image (centered)
        paste_x = (target_size[0] - img.width) // 2
        paste_y = (target_size[1] - img.height) // 2
        
        # Paste the image
        final_img.paste(img, (paste_x, paste_y))

        # Save the result
        final_img.save(output_path, "PNG")
        print(f"Processed: {os.path.basename(input_path)}")
        return True

    except Exception as e:
        print(f"Error processing {input_path}: {e}")
        return False

def main():
    # Directory containing the fish images
    input_dir = "e:/SP/H5_Demo/assets/images/fish"
    output_dir = "e:/SP/H5_Demo/assets/images/fish_processed"

    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    print(f"Starting processing of assets in {input_dir}...")
    success_count = 0
    total_count = 0

    # Iterate through all PNG files in the input directory
    for filename in os.listdir(input_dir):
        if filename.endswith(".png"):
            input_path = os.path.join(input_dir, filename)
            output_path = os.path.join(output_dir, filename)
            
            total_count += 1
            if process_image(input_path, output_path):
                success_count += 1

    print(f"\nProcessing complete! Successfully processed {success_count}/{total_count} images.")
    print(f"Processed images saved to: {output_dir}")

if __name__ == "__main__":
    main()
