# Wood Profile Upload Guide

Complete guide for adding wood profiles to Leon's AR Visualizer.

## Quick Start

1. **Access Admin Panel**: Navigate to `/admin/wood-profiles`
2. **Click**: "+ Add New Profile"
3. **Fill the form** with wood details
4. **Upload images**: Profile image + Texture image
5. **Submit**: Profile appears immediately in AR visualizer

---

## Required Information

### Basic Details

| Field | Description | Example |
|-------|-------------|---------|
| Profile Name | Display name | "Versailles • Walnut" |
| Wood Type | Species/origin | "American Walnut" |
| Finish | Surface finish | "Matte" or "Satin" |
| Color | Color description | "Rich warm brown" |
| Price per sq ft | Installed price | 45.00 |
| Description | Full description | "Elegant parquet pattern featuring..." |

### Images

#### 1. Profile Image (Required)
**Purpose**: Thumbnail shown in profile selector

**Specifications**:
- Minimum size: 400x400px
- Recommended: 800x800px
- Format: JPG or PNG
- File size: Under 2MB
- Content: Clear, well-lit photo of the flooring
- Background: Clean, neutral if possible

**Tips**:
- Use natural lighting
- Straight-on angle preferred
- Show wood grain clearly
- Avoid shadows

#### 2. Texture Image (Optional but Recommended)
**Purpose**: AR overlay on camera feed

**Specifications**:
- Minimum size: 1024x1024px
- Recommended: 2048x2048px
- Format: JPG or PNG
- File size: Under 4MB
- Content: **Must be seamlessly tileable**
- Lighting: Flat, even illumination

**Tips**:
- Use a straight-on photo of the floor
- Ensure pattern repeats naturally at edges
- Remove any perspective distortion
- Avoid dark corners or bright spots
- Test tiling in Photoshop before uploading

---

## Image Preparation

### Creating Tileable Textures

If you have a photo but it's not tileable:

1. **Open in Photoshop**
2. **Apply**: Filter → Other → Offset
   - Set to 50% width and 50% height
3. **Fix seams**: Use Clone Stamp or Healing Brush
4. **Test**: Tile 2x2 to check seamlessness
5. **Export**: Save as JPG (quality 90%)

### Recommended Tools

- **Photoshop**: Professional editing
- **GIMP**: Free alternative
- **Pixlr**: Online editor
- **Canva**: Simple cropping/resizing

---

## Step-by-Step Upload Process

### Step 1: Prepare Your Assets
```
✓ Profile image (800x800px)
✓ Texture image (2048x2048px, seamless)
✓ Product details written out
✓ Pricing confirmed
```

### Step 2: Access Admin Panel
```
URL: https://your-domain.vercel.app/admin/wood-profiles
```

### Step 3: Fill the Form

**Profile Name**
```
Format: [Pattern] • [Wood Species]
Examples:
- "Versailles • Walnut"
- "Chevron • Natural Oak"
- "Herringbone • Smoked Oak"
```

**Wood Type**
```
Be specific about species and origin:
- "American / European Walnut"
- "European Oak"
- "Smoked / fumed Oak"
```

**Finish**
```
Options: Matte, Satin, Gloss, Oil-rubbed, etc.
```

**Color**
```
Descriptive and appealing:
- "Rich warm brown"
- "Natural light blonde"
- "Moody charcoal gray"
```

**Price per sq ft**
```
Enter installed price in dollars
Example: 45.00 (not $45.00)
```

**Description**
```
Full marketing description:
- Pattern details
- Best use cases
- Design aesthetic
- Client types

Example:
"Elegant parquet-inspired pattern featuring American/European 
Walnut. Perfect for formal living rooms, libraries, and dining 
spaces with Beverly Hills or Hancock Park aesthetics."
```

### Step 4: Upload Images

1. **Profile Image**
   - Click "Choose File"
   - Select your profile image
   - Preview will show immediately

2. **Texture Image**
   - Click "Choose File" (second upload)
   - Select your seamless texture
   - This is used for AR overlay

### Step 5: Submit

Click "Add Wood Profile"
- Images upload to Vercel Blob
- Database record created in Supabase
- Profile appears in AR visualizer instantly

---

## Sample Profile Templates

### Template 1: Parquet Pattern
```
Name: Versailles • Walnut
Wood Type: American / European Walnut
Finish: Matte
Color: Rich warm brown
Price: 45.00
Description: Elegant parquet-inspired pattern featuring American/European 
Walnut. Perfect for formal living rooms, libraries, and dining spaces with 
Beverly Hills or Hancock Park aesthetics.
```

### Template 2: Modern Chevron
```
Name: Chevron • Natural Oak
Wood Type: European Oak
Finish: Satin
Color: Natural light blonde
Price: 30.00
Description: Modern chevron pattern in light European Oak. Creates an airy, 
gallery-like feel perfect for open concept living and contemporary builds.
```

### Template 3: Herringbone
```
Name: Herringbone • Smoked Oak
Wood Type: Smoked / fumed Oak
Finish: Satin
Color: Moody charcoal gray
Price: 33.00
Description: Architectural herringbone pattern in smoked/fumed Oak. Delivers 
dramatic, moody ambiance ideal for entry halls, great rooms, and design-forward 
clients.
```

---

## Bulk Upload (Advanced)

### Using SQL

If you have many profiles, you can insert directly:

```sql
INSERT INTO wood_profiles (
  name, description, wood_type, finish, color, 
  price_per_sqft, image_url, texture_url
) VALUES 
  (
    'Versailles • Walnut',
    'Elegant parquet pattern...',
    'American Walnut',
    'Matte',
    'Rich warm brown',
    45.00,
    'https://blob.vercel-storage.com/...',
    'https://blob.vercel-storage.com/...'
  ),
  (
    'Chevron • Oak',
    'Modern chevron pattern...',
    'European Oak',
    'Satin',
    'Natural blonde',
    30.00,
    'https://blob.vercel-storage.com/...',
    'https://blob.vercel-storage.com/...'
  );
```

**Note**: Images must be uploaded to Vercel Blob first to get URLs.

---

## Testing Your Profiles

### After Upload:

1. **View in Admin Panel**
   - Check profile card displays correctly
   - Verify image loads
   - Confirm pricing shown

2. **Test in AR Visualizer**
   - Go to `/camera`
   - Grant camera permissions
   - Select your new profile
   - Verify texture overlay appears
   - Check profile details display

3. **Mobile Testing**
   - Open on iPhone/Android
   - Test camera with rear-facing mode
   - Switch between profiles
   - Confirm smooth performance

---

## Troubleshooting

### Profile not appearing?
- Check admin panel shows the profile
- Refresh the camera page
- Check browser console for errors

### Image not loading?
- Verify file uploaded successfully
- Check Vercel Blob dashboard
- Ensure URLs are public
- Try re-uploading

### Texture looks wrong in AR?
- Check if image is seamlessly tileable
- Verify image isn't distorted
- Try higher resolution texture
- Ensure proper lighting in source photo

### Price not displaying correctly?
- Enter numbers only (no $ or commas)
- Use decimal format: 45.00
- Don't use currency symbols

---

## Best Practices

1. **Consistent Naming**: Use the "Pattern • Species" format
2. **Quality Images**: High-resolution, well-lit, professional
3. **Accurate Pricing**: Verify with current market rates
4. **Descriptive Text**: Help customers understand the aesthetic
5. **Test on Mobile**: AR visualizer is primarily mobile
6. **Update Regularly**: Keep profiles current with inventory

---

## Support

Questions? Issues?
- Check the main README.md
- Review database schema
- Contact development team
