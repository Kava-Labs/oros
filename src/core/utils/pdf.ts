import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `pdf.worker.min-${pdfjsLib.version}-4603be13.mjs`;

export type PDFData = {
  base64ImageURL: string;
  text: string;
  pageNumber: number;
};

export async function pdfDocExtractTextAndImage(
  doc: ArrayBuffer,
  nPages: number,
): Promise<PDFData[]> {
  const pdfData: PDFData[] = [];

  const loadingTask = pdfjsLib.getDocument(doc.slice(0));
  const pdf = await loadingTask.promise;

  let pageNumber = 1;

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

    const text = await page.getTextContent();

    let pageTextContent = '';
    for (const item of text.items) {
      if ('str' in item) {
        pageTextContent += item.str;
        if (item.hasEOL) pageTextContent += '\n';
      }
    }

    pdfData.push({
      pageNumber,
      base64ImageURL: canvas.toDataURL('image/webp'),
      text: pageTextContent,
    });

    canvasContext.reset();
    pageNumber++;
  }

  return pdfData;
}
