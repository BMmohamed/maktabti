/**
 * Fast client-side PDF page count detector.
 * Reads the PDF binary directly in the browser without requiring external heavy workers.
 */
export async function getPdfPageCount(file: File): Promise<number> {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    // If it's an image, page count is always 1
    return 1;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const text = new TextDecoder('latin1').decode(bytes);

    // Method 1: Search for /Type /Pages /Count N
    const regex = /\/Type\s*\/Pages[^>]*\/Count\s+(\d+)/g;
    let match: RegExpExecArray | null;
    const counts: number[] = [];

    while ((match = regex.exec(text)) !== null) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed)) {
        counts.push(parsed);
      }
    }

    if (counts.length > 0) {
      return Math.max(...counts);
    }

    // Method 2: Count occurrences of "/Type /Page" (individual page objects)
    const pageMatches = text.match(/\/Type\s*\/Page\b/g);
    if (pageMatches && pageMatches.length > 0) {
      return pageMatches.length;
    }

    return 1;
  } catch (error) {
    console.warn('Could not read PDF page count automatically, defaulting to 1', error);
    return 1;
  }
}
