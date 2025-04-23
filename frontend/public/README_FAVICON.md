# Favicon Setup Instructions

To use the provided pill and tablet image as a favicon for the website, follow these steps:

1. **Create the following favicon files in the `public` directory:**

   - `favicon.ico` - ICO format (16x16, 32x32, 48x48 sizes)
   - `favicon.png` - PNG format (32x32)
   - `apple-touch-icon.png` - PNG format (180x180)

2. **How to convert the image:**

   You can use online favicon generators like [favicon.io](https://favicon.io/) or [realfavicongenerator.net](https://realfavicongenerator.net/) to convert the pharmacy pill/tablet image to the required formats.

3. **Steps using an online converter:**
   
   a. Go to one of the favicon generator websites
   b. Upload the pill and tablet image
   c. Download the generated favicon package
   d. Extract the files and place them in the `public` directory

4. **Manual conversion using image editing software:**
   
   If you prefer to use software like Photoshop, GIMP, or Paint.NET:
   
   a. Open the pill and tablet image
   b. Resize to the required dimensions (32x32 for favicon.png, 180x180 for apple-touch-icon.png)
   c. Save in the appropriate formats
   d. For favicon.ico, you'll need software that supports the ICO format or use an online converter

The favicon will be displayed in browser tabs, bookmarks, and when users add your site to their home screens.

## Verification

After adding the favicon files to the public directory, the website's index.html has already been updated with the necessary link tags:

```html
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" href="/favicon.png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

These ensure that browsers and devices will display your pharmacy icon correctly. 