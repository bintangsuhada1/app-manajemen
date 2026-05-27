import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.resolve(dirname, '../assets/jurti-letterhead.jpeg');

export const companyProfile = {
  companyName: 'PT JURTI AGUNG MULIA',
  tagline: 'Kontraktor Elektrikal',
  address: 'Jl. Sultan Sulaiman, Gg. H. Hoesin No. 42, Tanjungpinang, Kepulauan Riau',
  phone: '0853-1507-0125',
  email: 'jurtiagungmulia@gmail.com',
  website: 'ptjurtiagungmulia.com'
};

export function formatCurrency(value) {
  return `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Number(value || 0))}`;
}

export function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value));
}

function drawHeader(doc) {
  doc.save();
  doc.image(logoPath, 42, 28, { fit: [92, 62] });
  doc.fillColor('#0f2747').font('Helvetica-Bold').fontSize(15).text(companyProfile.companyName, 150, 31);
  doc.fillColor('#b78119').font('Helvetica-Bold').fontSize(9).text(companyProfile.tagline, 150, 51);
  doc.fillColor('#334155').font('Helvetica').fontSize(8.5)
    .text(companyProfile.address, 150, 67, { width: 395 })
    .text(`Telp: ${companyProfile.phone} | Email: ${companyProfile.email}`, 150, 80, { width: 395 })
    .text(`Web: ${companyProfile.website}`, 150, 93, { width: 395 });
  doc.moveTo(42, 116).lineTo(553, 116).lineWidth(1.4).strokeColor('#0f2747').stroke();
  doc.moveTo(42, 120).lineTo(553, 120).lineWidth(0.5).strokeColor('#b78119').stroke();
  doc.restore();
}

function drawFooter(doc) {
  const y = doc.page.height - 42;
  doc.save();
  doc.moveTo(42, y - 10).lineTo(553, y - 10).lineWidth(0.5).strokeColor('#cbd5e1').stroke();
  doc.fillColor('#64748b').font('Helvetica').fontSize(8)
    .text(`${companyProfile.companyName} | ${companyProfile.email} | ${companyProfile.website}`, 42, y, {
      width: 511,
      align: 'center'
    });
  doc.restore();
}

export function createBrandedPdf(res, filename, title, disposition = 'attachment') {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
  const doc = new PDFDocument({ margin: 42, bufferPages: true });
  doc.pipe(res);
  const decoratePage = () => {
    drawHeader(doc);
    drawFooter(doc);
    doc.y = 144;
  };
  decoratePage();
  doc.on('pageAdded', decoratePage);
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(16).text(title, { align: 'center' });
  doc.moveDown(1.2);
  return doc;
}

export function sectionTitle(doc, title) {
  doc.fillColor('#0f2747').font('Helvetica-Bold').fontSize(11).text(title);
  doc.moveDown(0.45);
}

export function keyValue(doc, label, value) {
  const startY = doc.y;
  doc.fillColor('#475569').font('Helvetica-Bold').fontSize(9.5).text(label, 42, startY, { width: 115 });
  doc.fillColor('#0f172a').font('Helvetica').text(value || '-', 162, startY, { width: 391 });
  doc.moveDown(0.4);
}

export function drawTableHeader(doc, columns) {
  const y = doc.y;
  doc.save();
  doc.rect(42, y, 511, 22).fill('#0f2747');
  columns.forEach((column) => {
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5)
      .text(column.label, column.x, y + 7, { width: column.width, align: column.align || 'left' });
  });
  doc.restore();
  doc.y = y + 27;
}

export function drawTableRow(doc, columns, values, shaded = false) {
  const heights = columns.map((column, index) => doc.heightOfString(String(values[index] ?? '-'), {
    width: column.width,
    align: column.align || 'left'
  }));
  const rowHeight = Math.max(18, ...heights) + 8;
  if (doc.y + rowHeight > 700) {
    doc.addPage();
    drawTableHeader(doc, columns);
  }
  const y = doc.y;
  if (shaded) doc.rect(42, y - 4, 511, rowHeight).fill('#f8fafc');
  columns.forEach((column, index) => {
    doc.fillColor('#0f172a').font('Helvetica').fontSize(8.5)
      .text(String(values[index] ?? '-'), column.x, y, { width: column.width, align: column.align || 'left' });
  });
  doc.y = y + rowHeight;
}

export function drawSignature(doc, label = 'Disetujui oleh') {
  if (doc.y > 650) doc.addPage();
  doc.moveDown(1.5);
  const x = 390;
  doc.fillColor('#334155').font('Helvetica').fontSize(9).text(label, x, doc.y, { width: 163, align: 'center' });
  doc.moveDown(4);
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10).text('IRWANSYAH', x, doc.y, { width: 163, align: 'center' });
  doc.fillColor('#64748b').font('Helvetica').fontSize(8.5).text('Direktur', x, doc.y + 14, { width: 163, align: 'center' });
}
