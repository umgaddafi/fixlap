import { jsPDF } from 'jspdf';
import { KENDAT_FIXLAP_EMBLEM_BASE64, KENDAT_FIXLAP_STAMP_BASE64 } from './logoBase64';
import { initPdfFonts } from './pdfFonts';



export interface InvoiceItem {
  description: string;
  qty: number;
  amount: number;
}

export interface InvoiceData {
  repairId: string;
  device: string;
  clientName: string;
  dateIssued?: string;
  paid: boolean;
  amount: number;
  items?: InvoiceItem[];
}

export function exportInvoicePDF({
  repairId,
  device,
  clientName,
  dateIssued = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
  paid,
  amount,
  items,
}: InvoiceData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  initPdfFonts(doc);

  const pageWidth = 210;

  // Teal accent banner at top
  doc.setFillColor(8, 164, 179);
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Kendat FixLap Brand Logo & Header
  try {
    doc.addImage(KENDAT_FIXLAP_EMBLEM_BASE64, 'PNG', 16, 15, 11, 11);
  } catch {
    doc.setFillColor(7, 34, 46);
    doc.roundedRect(16, 16, 11, 11, 2, 2, 'F');
  }

  // Company Name & Subtitle
  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(18, 60, 104);
  doc.text('KENDAT ', 30, 22);
  const kendatWidth1 = doc.getTextWidth('KENDAT ');
  doc.setTextColor(233, 99, 25);
  doc.text('FIXLAP', 30 + kendatWidth1, 22);

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(105, 107, 108);
  doc.text('DEVICE REPAIRS', 30, 27);
  doc.setFont('LiberationSans', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('· Certified Diagnostic & Repair Laboratory', 30 + doc.getTextWidth('DEVICE REPAIRS') + 3, 27);

  // OFFICIAL INVOICE Badge
  doc.setFillColor(230, 247, 246);
  doc.roundedRect(144, 16, 50, 9, 2, 2, 'F');
  doc.setDrawColor(115, 226, 224);
  doc.setLineWidth(0.3);
  doc.roundedRect(144, 16, 50, 9, 2, 2, 'S');

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(7, 121, 131);
  doc.text('OFFICIAL INVOICE', 169, 22, { align: 'center' });

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(16, 34, 194, 34);

  // Metadata Grid Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(16, 40, 178, 38, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(16, 40, 178, 38, 3, 3, 'S');

  // Col 1: Invoice # & Date
  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('INVOICE NUMBER', 22, 48);
  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`INV-${repairId}-2026`, 22, 54);

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('DATE ISSUED', 22, 64);
  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(dateIssued, 22, 70);

  // Col 2: Billed To & Payment Method
  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('BILLED TO', 86, 48);
  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(clientName, 86, 54);

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PAYMENT METHOD', 86, 64);
  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(paid ? 'Paystack Online Card (Paid)' : 'Awaiting Payment', 86, 70);

  // Col 3: Device & Payment Status
  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('DEVICE SERVICED', 148, 48);
  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(8, 164, 179);
  doc.text(device, 148, 54);

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PAYMENT STATUS', 148, 64);

  if (paid) {
    doc.setFillColor(209, 250, 229);
    doc.roundedRect(148, 66, 24, 6, 1.5, 1.5, 'F');
    doc.setFont('LiberationSans', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(6, 95, 70);
    doc.text('PAID', 160, 70.5, { align: 'center' });
  } else {
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(148, 66, 32, 6, 1.5, 1.5, 'F');
    doc.setFont('LiberationSans', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(146, 64, 14);
    doc.text('PENDING', 164, 70.5, { align: 'center' });
  }

  // Table Header
  const tableStartY = 88;
  doc.setFillColor(241, 245, 249);
  doc.rect(16, tableStartY, 178, 9, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(16, tableStartY + 9, 194, tableStartY + 9);

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('DESCRIPTION / ITEM', 22, tableStartY + 6);
  doc.text('QTY', 135, tableStartY + 6, { align: 'center' });
  doc.text('AMOUNT', 188, tableStartY + 6, { align: 'right' });

  // Items
  const invoiceItems = items || [
    { description: `${device} OEM Replacement Component & Assembly`, qty: 1, amount: Math.round(amount * 0.78) },
    { description: 'Precision Diagnostic Bench Testing & Workmanship Labour', qty: 1, amount: Math.round(amount * 0.22) },
  ];

  let currentY = tableStartY + 18;
  doc.setFont('LiberationSans', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  invoiceItems.forEach((item) => {
    doc.text(item.description, 22, currentY);
    doc.text(String(item.qty), 135, currentY, { align: 'center' });
    doc.text(`₦${item.amount.toLocaleString()}`, 188, currentY, { align: 'right' });

    doc.setDrawColor(241, 245, 249);
    doc.line(16, currentY + 4, 194, currentY + 4);
    currentY += 12;
  });

  // Summary
  const summaryStartY = currentY + 6;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(120, summaryStartY, 194, summaryStartY);

  doc.setFont('LiberationSans', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal:', 130, summaryStartY + 7);
  doc.text(`₦${amount.toLocaleString()}`, 188, summaryStartY + 7, { align: 'right' });

  doc.text('VAT / Tax (0% Exempt):', 130, summaryStartY + 14);
  doc.text('₦0', 188, summaryStartY + 14, { align: 'right' });

  // Total Box
  doc.setFillColor(240, 253, 250);
  doc.roundedRect(120, summaryStartY + 19, 74, 14, 2, 2, 'F');
  doc.setDrawColor(115, 226, 224);
  doc.setLineWidth(0.4);
  doc.roundedRect(120, summaryStartY + 19, 74, 14, 2, 2, 'S');

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(paid ? 'Total Paid:' : 'Total Due:', 126, summaryStartY + 28);

  doc.setFontSize(12);
  doc.setTextColor(8, 164, 179);
  doc.setDrawColor(8, 164, 179);
  doc.text(`₦${amount.toLocaleString()}`, 188, summaryStartY + 28, { align: 'right' });

  // Official Invoice Stamp & Authentication Seal
  const stampY = summaryStartY + 36;
  try {
    doc.addImage(KENDAT_FIXLAP_STAMP_BASE64, 'PNG', 16, stampY, 26, 26);
  } catch {
    doc.setDrawColor(8, 164, 179);
    doc.setLineWidth(0.7);
    doc.roundedRect(16, stampY, 26, 26, 2, 2, 'S');
  }

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138);
  doc.text('KENDAT FIXLAP OFFICIAL INVOICE', 46, stampY + 7);
  doc.setFont('LiberationSans', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Official Receipt · Job #${repairId} · Paid & Verified`, 46, stampY + 13);
  doc.text('Authorized Service Center · No 2 Inikpist, Makurdi, Benue State', 46, stampY + 18.5);
  doc.setFont('LiberationSans', 'bold');
  doc.setTextColor(13, 148, 136);
  doc.text('Guaranteed: 90-Day Workmanship & OEM Hardware Warranty Included', 46, stampY + 24);

  // Legal Notice
  doc.setFont('LiberationSans', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Thank you for choosing Kendat FixLap. All replaced parts are covered under our comprehensive 90-day warranty.', 16, 262);
  doc.text('For warranty claims or support, quote this invoice number at support@kendatfixlap.ng or call 080 1234 5678.', 16, 267);

  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(16, 273, 194, 273);

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Kendat FixLap Technologies Limited · RC 1892044 · www.kendatfixlap.ng', 16, 279);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, 194, 279, { align: 'right' });

  // Save to browser
  doc.save(`Invoice-${repairId}.pdf`);
}

export function exportWarrantyPDF({
  repairId,
  device,
  clientName,
  dateIssued = '04 September 2026',
  expiryDate = '04 December 2026',
}: {
  repairId: string;
  device: string;
  clientName: string;
  dateIssued?: string;
  expiryDate?: string;
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  initPdfFonts(doc);

  const pageWidth = 210;

  // Teal banner
  doc.setFillColor(8, 164, 179);
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Header Brand
  try {
    doc.addImage(KENDAT_FIXLAP_EMBLEM_BASE64, 'PNG', 16, 15, 11, 11);
  } catch {
    doc.setFillColor(7, 34, 46);
    doc.roundedRect(16, 16, 11, 11, 2, 2, 'F');
  }

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(18, 60, 104);
  doc.text('KENDAT ', 30, 22);
  const kendatWidth2 = doc.getTextWidth('KENDAT ');
  doc.setTextColor(233, 99, 25);
  doc.text('FIXLAP', 30 + kendatWidth2, 22);

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(105, 107, 108);
  doc.text('DEVICE REPAIRS', 30, 27);
  doc.setFont('LiberationSans', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('· Certified Diagnostic & Repair Laboratory', 30 + doc.getTextWidth('DEVICE REPAIRS') + 3, 27);

  // Warranty Badge
  doc.setFillColor(230, 247, 246);
  doc.roundedRect(136, 16, 58, 9, 2, 2, 'F');
  doc.setDrawColor(115, 226, 224);
  doc.setLineWidth(0.3);
  doc.roundedRect(136, 16, 58, 9, 2, 2, 'S');

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(7, 121, 131);
  doc.text('WARRANTY CERTIFICATE', 165, 22, { align: 'center' });

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(16, 34, 194, 34);

  // Title Box
  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text('90-Day Workmanship & Hardware Guarantee', 16, 46);

  // Meta Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(16, 52, 178, 38, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(16, 52, 178, 38, 3, 3, 'S');

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('CERTIFICATE ID', 22, 60);
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`WAR-FL-90D-${repairId.replace('FL-', '')}`, 22, 66);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('COVERED DEVICE', 22, 76);
  doc.setFontSize(10);
  doc.setTextColor(8, 164, 179);
  doc.text(device, 22, 82);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('OWNER', 110, 60);
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(clientName, 110, 66);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('COVERAGE WINDOW', 110, 76);
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${dateIssued} — ${expiryDate}`, 110, 82);

  // Terms Body
  doc.setFont('LiberationSans', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  doc.text('This official certificate certifies that all replacement parts and technical bench labour performed on work order', 16, 104);
  doc.text(`#${repairId} are guaranteed against defects in materials and technician workmanship for a duration of 90 days.`, 16, 110);

  // Guarantee bullets
  doc.setFillColor(240, 253, 250);
  doc.roundedRect(16, 120, 178, 42, 3, 3, 'F');
  doc.setDrawColor(115, 226, 224);
  doc.setLineWidth(0.3);
  doc.roundedRect(16, 120, 178, 42, 3, 3, 'S');

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(7, 121, 131);
  doc.text('What is covered:', 22, 129);

  doc.setFont('LiberationSans', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('• OEM hardware component failures under standard operating conditions.', 22, 136);
  doc.text('• Free diagnostic re-inspection and bench re-assembly at our certified laboratory.', 22, 142);
  doc.text('• Zero labour fees if component replacement or recalibration is required within the 90-day period.', 22, 148);
  doc.text('• Expedited priority queue turnaround for all warranty re-services.', 22, 154);

  // Official QA Stamp & Seal
  try {
    doc.addImage(KENDAT_FIXLAP_STAMP_BASE64, 'PNG', 16, 170, 24, 24);
  } catch {
    doc.setDrawColor(8, 164, 179);
    doc.setLineWidth(0.7);
    doc.roundedRect(16, 170, 24, 24, 2, 2, 'S');
  }

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138);
  doc.text('90-DAY CERTIFIED GUARANTEE', 44, 177);
  doc.setFont('LiberationSans', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Kendat FixLap Authorized Quality Assurance & Service Seal', 44, 183);
  doc.text('Makurdi Service Laboratory · Benue State, Nigeria', 44, 188.5);

  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(16, 273, 194, 273);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Kendat FixLap Technologies Limited · RC 1892044 · www.kendatfixlap.ng', 16, 279);
  doc.text(`Certificate issued on ${dateIssued}`, 194, 279, { align: 'right' });

  doc.save(`Warranty-Certificate-${repairId}.pdf`);
}

export function exportDiagnosticPDF({
  repairId,
  device,
  clientName,
  dateIssued = '08 September 2026',
  technician = 'Jordan Malik',
}: {
  repairId: string;
  device: string;
  clientName: string;
  dateIssued?: string;
  technician?: string;
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  initPdfFonts(doc);

  const pageWidth = 210;

  // Teal banner
  doc.setFillColor(8, 164, 179);
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Header Brand
  try {
    doc.addImage(KENDAT_FIXLAP_EMBLEM_BASE64, 'PNG', 16, 15, 11, 11);
  } catch {
    doc.setFillColor(7, 34, 46);
    doc.roundedRect(16, 16, 11, 11, 2, 2, 'F');
  }

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(18, 60, 104);
  doc.text('KENDAT ', 30, 22);
  const kendatWidth3 = doc.getTextWidth('KENDAT ');
  doc.setTextColor(233, 99, 25);
  doc.text('FIXLAP', 30 + kendatWidth3, 22);

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(105, 107, 108);
  doc.text('DEVICE REPAIRS', 30, 27);
  doc.setFont('LiberationSans', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('· Certified Diagnostic & Repair Laboratory', 30 + doc.getTextWidth('DEVICE REPAIRS') + 3, 27);

  // Diagnostic Badge
  doc.setFillColor(230, 247, 246);
  doc.roundedRect(136, 16, 58, 9, 2, 2, 'F');
  doc.setDrawColor(115, 226, 224);
  doc.setLineWidth(0.3);
  doc.roundedRect(136, 16, 58, 9, 2, 2, 'S');

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(7, 121, 131);
  doc.text('DIAGNOSTIC REPORT', 165, 22, { align: 'center' });

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(16, 34, 194, 34);

  // Meta Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(16, 40, 178, 38, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(16, 40, 178, 38, 3, 3, 'S');

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('REPORT ID', 22, 48);
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`DIAG-${repairId}`, 22, 54);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TARGET DEVICE', 22, 64);
  doc.setFontSize(10);
  doc.setTextColor(8, 164, 179);
  doc.text(device, 22, 70);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('CUSTOMER', 110, 48);
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(clientName, 110, 54);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('ASSIGNED TECHNICIAN', 110, 64);
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(technician, 110, 70);

  // Table Header
  const tableStartY = 88;
  doc.setFillColor(241, 245, 249);
  doc.rect(16, tableStartY, 178, 9, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(16, tableStartY + 9, 194, tableStartY + 9);

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('DIAGNOSTIC TEST MODULE', 22, tableStartY + 6);
  doc.text('BENCH RESULT', 188, tableStartY + 6, { align: 'right' });

  const tests = [
    { name: 'OLED Display Panel & Touch Digitizer', result: 'FAILED (Cracked/Dead touch)', status: 'fail' },
    { name: 'TrueDepth Camera & Face ID Sensor', result: 'PASSED (Intact)', status: 'pass' },
    { name: 'Battery Health & Voltage Regulation', result: 'PASSED (88% Peak capacity)', status: 'pass' },
    { name: 'Motherboard Trace & Power Rails', result: 'PASSED (No shorts detected)', status: 'pass' },
  ];

  let currentY = tableStartY + 18;
  doc.setFont('LiberationSans', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  tests.forEach((t) => {
    doc.text(t.name, 22, currentY);
    if (t.status === 'pass') {
      doc.setTextColor(6, 95, 70);
      doc.setFont('LiberationSans', 'bold');
    } else {
      doc.setTextColor(180, 83, 9);
      doc.setFont('LiberationSans', 'bold');
    }
    doc.text(t.result, 188, currentY, { align: 'right' });

    doc.setFont('LiberationSans', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.setDrawColor(241, 245, 249);
    doc.line(16, currentY + 4, 194, currentY + 4);
    currentY += 12;
  });

  // Recommendation
  doc.setFillColor(240, 253, 250);
  doc.roundedRect(16, currentY + 6, 178, 22, 3, 3, 'F');
  doc.setDrawColor(115, 226, 224);
  doc.setLineWidth(0.3);
  doc.roundedRect(16, currentY + 6, 178, 22, 3, 3, 'S');

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(7, 121, 131);
  doc.text('Technician Recommendation:', 22, currentY + 14);

  doc.setFont('LiberationSans', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Proceed with display panel assembly replacement. Estimated turnaround is 2 hours upon client approval.', 22, currentY + 21);

  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(16, 273, 194, 273);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Kendat FixLap Technologies Limited · RC 1892044 · www.kendatfixlap.ng', 16, 279);
  doc.text(`Report generated on ${dateIssued}`, 194, 279, { align: 'right' });

  doc.save(`Diagnostic-Report-${repairId}.pdf`);
}
