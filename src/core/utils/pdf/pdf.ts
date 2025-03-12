import 'pdfjs-dist/build/pdf.worker.min.mjs';
import * as pdfjsLib from 'pdfjs-dist';

export async function pdfDocExtractText(
  doc: ArrayBuffer,
  nPages: number,
): Promise<string[]> {
  if (nPages <= 0) throw new Error(`nPages must be greater than 0`);
  const loadingTask = pdfjsLib.getDocument(doc.slice());
  const pdf = await loadingTask.promise;

  const pdfDocPerPageText: string[] = [];

  const len = nPages < pdf.numPages ? nPages : pdf.numPages;
  // first page is 1
  for (let pageNum = 1; pageNum <= len; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const text = await page.getTextContent();

    let pageTextContent = '';
    for (const item of text.items) {
      if ('str' in item) {
        pageTextContent += item.str + ' ';
      }
    }
    pdfDocPerPageText.push(pageTextContent);
  }

  return pdfDocPerPageText;
}

export async function pdfDocToBase64ImageUrls(
  doc: ArrayBuffer,
  nPages: number,
): Promise<string[]> {
  const loadingTask = pdfjsLib.getDocument(doc.slice());
  const pdf = await loadingTask.promise;

  let pageNumber = 1;
  const imageUrls: string[] = [];

  // Create a canvas element
  const canvas = document.createElement('canvas');
  const canvasContext = canvas.getContext('2d');
  if (!canvasContext) throw new Error('failed to get canvas 2d context');

  const len = nPages < pdf.numPages ? nPages : pdf.numPages;
  while (pageNumber <= len) {
    const page = await pdf.getPage(pageNumber);

    // Set canvas dimensions to match PDF page
    const viewport = page.getViewport({ scale: 2.0 });
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext,
      viewport,
    }).promise;

    // Convert canvas to an image URL
    imageUrls.push(canvas.toDataURL('image/webp'));
    canvasContext.reset();
    pageNumber++;
  }

  return imageUrls;
}
