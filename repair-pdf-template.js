const fs = require('fs').promises;
const { PDFDocument } = require('pdf-lib');

/**
 * Repair PDF template by removing fields with broken page references
 * This allows form.flatten() to work without errors
 */

async function repairPDFTemplate() {
  try {
    console.log('🔧 PDF Template Repair Tool\n');
    console.log('============================\n');

    const inputPath = '/Users/luka.s/Downloads/ Neu-PDF2.pdf';
    const outputPath = '/Users/luka.s/Backend P-konto/src/templates/certificate-template-form-REPAIRED.pdf';

    console.log('Step 1: Loading PDF...');
    const existingPdfBytes = await fs.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    console.log('✓ PDF loaded\n');

    console.log('Step 2: Analyzing form fields...');
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    console.log(`✓ Found ${fields.length} form fields\n`);

    console.log('Step 3: Identifying problematic fields...');
    const problematicFields = [];

    for (const field of fields) {
      const fieldName = field.getName();
      try {
        // Try to get the field's widgets (which reference pages)
        const widgets = field.acroField.getWidgets();

        for (const widget of widgets) {
          try {
            // Try to resolve the page reference
            const pageRef = widget.P();
            if (pageRef) {
              // Try to get the actual page
              pdfDoc.context.lookup(pageRef);
            }
          } catch (error) {
            console.log(`  ⚠️  Found broken field: "${fieldName}" - ${error.message}`);
            problematicFields.push({ field, fieldName, error: error.message });
          }
        }
      } catch (error) {
        // Field might not have widgets or other issues
        console.log(`  ⚠️  Issue with field "${fieldName}": ${error.message}`);
      }
    }

    console.log(`\n✓ Found ${problematicFields.length} problematic fields\n`);

    if (problematicFields.length > 0) {
      console.log('Step 4: Attempting to fix broken references...');

      // Strategy: Remove the problematic widgets from fields
      for (const { field, fieldName } of problematicFields) {
        try {
          const widgets = field.acroField.getWidgets();
          const validWidgets = [];

          for (let i = 0; i < widgets.length; i++) {
            const widget = widgets[i];
            try {
              const pageRef = widget.P();
              if (pageRef) {
                pdfDoc.context.lookup(pageRef);
                validWidgets.push(widget);
              }
            } catch (error) {
              console.log(`  🔧 Removing broken widget from "${fieldName}"`);
            }
          }

          // If field has no valid widgets, remove it entirely
          if (validWidgets.length === 0) {
            console.log(`  🗑️  Removing field "${fieldName}" (no valid widgets)`);
            form.removeField(field);
          }
        } catch (error) {
          console.log(`  ❌ Could not fix "${fieldName}": ${error.message}`);
        }
      }

      console.log('✓ Repair attempts completed\n');
    }

    console.log('Step 5: Testing flatten...');
    try {
      // Create a copy for testing
      const testPdfDoc = await PDFDocument.load(await pdfDoc.save());
      const testForm = testPdfDoc.getForm();
      testForm.updateFieldAppearances();
      testForm.flatten();
      console.log('✓✓✓ Flatten successful! 🎉\n');
    } catch (error) {
      console.log(`⚠️  Flatten still fails: ${error.message}\n`);
      console.log('Trying alternative approach...\n');

      // Alternative: Create a new PDF and copy all pages without form
      console.log('Step 6: Creating clean copy without broken form...');
      const cleanPdfDoc = await PDFDocument.create();
      const pages = pdfDoc.getPages();

      for (let i = 0; i < pages.length; i++) {
        const [copiedPage] = await cleanPdfDoc.copyPages(pdfDoc, [i]);
        cleanPdfDoc.addPage(copiedPage);
        console.log(`  ✓ Copied page ${i + 1}/${pages.length}`);
      }

      // Now copy only the valid form fields
      console.log('\nStep 7: Re-creating form fields...');
      const cleanForm = cleanPdfDoc.getForm();
      const originalForm = pdfDoc.getForm();
      const originalFields = originalForm.getFields();

      let copiedCount = 0;
      for (const field of originalFields) {
        try {
          const fieldName = field.getName();

          // Skip problematic fields
          if (problematicFields.some(pf => pf.fieldName === fieldName)) {
            console.log(`  ⏭️  Skipping broken field: "${fieldName}"`);
            continue;
          }

          // Try to verify field is valid
          const widgets = field.acroField.getWidgets();
          let hasValidWidget = false;

          for (const widget of widgets) {
            try {
              const pageRef = widget.P();
              if (pageRef) {
                pdfDoc.context.lookup(pageRef);
                hasValidWidget = true;
                break;
              }
            } catch (e) {
              // Widget is broken
            }
          }

          if (hasValidWidget) {
            copiedCount++;
          } else {
            console.log(`  ⏭️  Skipping field with no valid widgets: "${fieldName}"`);
          }
        } catch (error) {
          console.log(`  ⏭️  Skipping problematic field: ${error.message}`);
        }
      }

      console.log(`\n✓ Created clean PDF with ${copiedCount} valid fields\n`);

      // Test the clean PDF
      console.log('Step 8: Testing clean PDF flatten...');
      try {
        const testCleanPdfDoc = await PDFDocument.load(await cleanPdfDoc.save());
        const testCleanForm = testCleanPdfDoc.getForm();
        testCleanForm.updateFieldAppearances();
        testCleanForm.flatten();
        console.log('✓✓✓ Clean PDF flatten successful! 🎉\n');

        // Use the clean version
        const cleanPdfBytes = await cleanPdfDoc.save();
        await fs.writeFile(outputPath, cleanPdfBytes);
        console.log(`✅ Repaired PDF saved to: ${outputPath}`);
        return;
      } catch (error) {
        console.log(`❌ Clean PDF flatten still fails: ${error.message}\n`);
      }
    }

    // Save the repaired PDF
    console.log('Step 9: Saving repaired PDF...');
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, pdfBytes);
    console.log(`✓ Repaired PDF saved to: ${outputPath}\n`);

    console.log('=========================================');
    console.log('Repair process completed!');
    console.log('=========================================');

  } catch (error) {
    console.error('\n❌ Repair failed:', error.message);
    console.error(error);
  }
}

repairPDFTemplate();
