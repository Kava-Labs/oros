import 'pdfjs-dist/build/pdf.worker.min.mjs';
import * as pdfjsLib from 'pdfjs-dist';
export async function pdfDocToBase64ImageUrls(
  doc: ArrayBuffer,
  nPages: number,
): Promise<string[]> {
  const loadingTask = pdfjsLib.getDocument(doc);
  const pdf = await loadingTask.promise;

  let pageNumber = 1;
  const imageUrls: string[] = [];

  // Create a canvas element
  const canvas = document.createElement('canvas');
  const canvasContext = canvas.getContext('2d');
  if (!canvasContext) throw new Error('failed to get canvas 2d context');

  while (pageNumber <= nPages) {
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
