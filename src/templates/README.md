# Templates Directory

This directory should contain:

## 1. certificate-template.pdf (Optional)

If you have a pre-designed PDF template for the P-Konto certificate, place it here.

The system will automatically:
- Load this template
- Fill in the form fields with application data
- Add the stamp/signature

### Form Field Names

Make sure your PDF template has form fields with these names:
- `firstName`, `lastName`
- `street`, `houseNumber`, `zipCode`, `city`
- `birthdate`
- `email`
- `iban`, `bic`
- `married`, `childrenCount`
- `freibetrag`
- `issueDate`
- `lawyerName`, `lawyerTitle`

If you don't have a template, the system will generate a basic PDF from scratch.

## 2. stamp.png (Required)

Place the lawyer's official stamp or signature image here.

Requirements:
- Format: PNG (with transparency recommended)
- Size: Recommended 150x150px or larger
- The stamp will be placed at the bottom right of the certificate

### Creating a Stamp

If you don't have a digital stamp yet:
1. Scan the physical stamp at high resolution
2. Use an image editor to remove the background (make it transparent)
3. Save as PNG
4. Place here as `stamp.png`

## Alternative: Use Different Paths

You can also specify custom paths in the `.env` file:

```env
STAMP_IMAGE_PATH=/path/to/your/stamp.png
```
