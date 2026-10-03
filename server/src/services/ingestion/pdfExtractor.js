import pdfParse from 'pdf-parse';
import fs from 'fs/promises';

/**
 * Extracts text from a PDF file or buffer, injecting page markers for accurate citation mapping.
 */
export async function extractTextFromPdf(filePathOrBuffer) {
  let buffer;

  if (typeof filePathOrBuffer === 'string') {
    buffer = await fs.readFile(filePathOrBuffer);
  } else if (Buffer.isBuffer(filePathOrBuffer)) {
    buffer = filePathOrBuffer;
  } else {
    throw new Error('Invalid input to extractTextFromPdf: expected file path string or Buffer');
  }

  // Custom pager callback to insert page boundaries
  const pageTextArray = [];
  function render_page(pageData) {
    const render_options = {
      normalizeWhitespace: true,
      disableCombineTextItems: false,
    };

    return pageData.getTextContent(render_options).then((textContent) => {
      let pageText = '';
      for (const item of textContent.items) {
        pageText += item.str + ' ';
      }
      return `\n[[ PAGE ${pageData.pageIndex + 1} ]]\n` + pageText;
    });
  }

  const options = {
    pagerender: render_page,
  };

  const parsed = await pdfParse(buffer, options);

  return {
    rawText: parsed.text,
    numPages: parsed.numpages,
    info: parsed.info,
  };
}
