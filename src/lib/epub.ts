import JSZip from 'jszip';

export async function generateEpub(book: any) {
  const zip = new JSZip();

  // 1. mimetype (MUST be first and uncompressed for EPUB standard)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  const container = `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.file('META-INF/container.xml', container);

  // 3. OEBPS/content.opf (The package manifest)
  const uuid = crypto.randomUUID();
  const now = new Date().toISOString().split('.')[0] + 'Z';
  
  let manifestItems = '';
  let spineItems = '';

  // Add chapters
  book.chapters.forEach((ch: any, index: number) => {
    const id = `chap_${index}`;
    manifestItems += `<item id="${id}" href="chapter_${index}.xhtml" media-type="application/xhtml+xml"/>\n`;
    spineItems += `<itemref idref="${id}"/>\n`;
  });

  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(book.title)}</dc:title>
    <dc:creator>${escapeXml(book.author || 'Anonymous')}</dc:creator>
    <dc:language>en</dc:language>
    <dc:identifier id="BookId">urn:uuid:${uuid}</dc:identifier>
    <dc:description>${escapeXml(book.description || '')}</dc:description>
    <meta property="dcterms:modified">${now}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="back_cover" href="back_cover.xhtml" media-type="application/xhtml+xml"/>
    ${manifestItems}
  </manifest>
  <spine>
    <itemref idref="nav"/>
    ${spineItems}
    <itemref idref="back_cover"/>
  </spine>
</package>`;
  zip.file('OEBPS/content.opf', contentOpf);

  // 4. OEBPS/nav.xhtml (Table of Contents)
  let tocItems = '';
  book.chapters.forEach((ch: any, index: number) => {
    tocItems += `<li><a href="chapter_${index}.xhtml">${escapeXml(ch.title || `Chapter ${index + 1}`)}</a></li>\n`;
  });

  const nav = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Table of Contents</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      ${tocItems}
    </ol>
  </nav>
</body>
</html>`;
  zip.file('OEBPS/nav.xhtml', nav);

  // 5. Chapters
  book.chapters.forEach((ch: any, index: number) => {
    // Convert newlines to paragraphs
    const htmlContent = ch.content.split('\n').filter((p: string) => p.trim()).map((p: string) => `<p>${escapeXml(p)}</p>`).join('');
    
    const chapterXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${escapeXml(ch.title || `Chapter ${index + 1}`)}</title></head>
<body>
  <h1>${escapeXml(ch.title || `Chapter ${index + 1}`)}</h1>
  ${htmlContent}
</body>
</html>`;
    zip.file(`OEBPS/chapter_${index}.xhtml`, chapterXhtml);
  });

  // 6. Back Cover
  const backCoverXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Back Cover</title></head>
<body>
  <h1>About the Author & Book</h1>
  ${(book.back_cover_text || '').split('\n').filter((p: string) => p.trim()).map((p: string) => `<p>${escapeXml(p)}</p>`).join('')}
</body>
</html>`;
  zip.file('OEBPS/back_cover.xhtml', backCoverXhtml);

  // Generate the zip
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });

  // Trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${book.title.replace(/[^a-z0-9]/gi, '_')}.epub`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}