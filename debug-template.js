const fs = require('fs');
const path = require('path');
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');

/**
 * Debug template to see what placeholders it contains
 */

const debugTemplate = async () => {
  try {
    const templatePath = path.join(__dirname, 'src/templates/certificate-template.docx');

    console.log('🔍 Analyzing template...\n');
    console.log(`Template: ${templatePath}\n`);

    // Read template
    const templateContent = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(templateContent);

    // Create docxtemplater instance with << >> delimiters
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: {
        start: '<<',
        end: '>>'
      }
    });

    // Get all tags (placeholders)
    const tags = doc.getFullText();

    console.log('📄 Full text in template (showing << >> placeholders):');
    console.log('═'.repeat(70));
    console.log(tags);
    console.log('═'.repeat(70));
    console.log('');

    // Try to extract placeholders manually
    const placeholderMatches = tags.match(/<<([^>]+)>>/g);

    if (placeholderMatches && placeholderMatches.length > 0) {
      console.log('✅ Found placeholders:');
      const uniquePlaceholders = [...new Set(placeholderMatches)];
      uniquePlaceholders.forEach(p => {
        console.log(`  ${p}`);
      });
      console.log('');
      console.log(`Total: ${uniquePlaceholders.length} unique placeholders`);
    } else {
      console.log('⚠️  No << >> placeholders found in template!');
      console.log('');
      console.log('Common issues:');
      console.log('  1. Placeholders might be split across formatting (e.g., <<full and Name>>)');
      console.log('  2. Using different brackets (e.g., { } instead of << >>)');
      console.log('  3. Autocorrect in Word changed << to « or »');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.properties && error.properties.errors) {
      console.error('\nTemplate errors:', error.properties.errors);
    }
  }
};

debugTemplate();
