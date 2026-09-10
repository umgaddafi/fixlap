import { jsPDF } from 'jspdf';
import { KENDAT_FIXLAP_EMBLEM_BASE64, KENDAT_FIXLAP_STAMP_BASE64 } from '../client/logoBase64';
import { initPdfFonts } from '../client/pdfFonts';

export interface ReportPdfData {
  monthName: string;
  month: number;
  year: number;
  periodSummary: {
    totalJobs: number;
    completedJobs: number;
    activeJobs: number;
    completionRate: number;
    totalQuoted: number;
    revenue: number;
  };
  statusCounts: Record<string, number>;
  categoryBreakdown: Record<string, { count: number; percentage: number }>;
  technicianPerformance: Array<{
    id: string;
    name: string;
    specialty: string;
    specialties: string[];
    assignedJobs: number;
    completedJobs: number;
    activeJobs: number;
    revenueGenerated: number;
    completionRate: number;
  }>;
}

export function exportReportPDF(data: ReportPdfData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  initPdfFonts(doc);
  const pageWidth = 210;

  // 1. Top Teal accent strip
  doc.setFillColor(8, 164, 179);
  doc.rect(0, 0, pageWidth, 5, 'F');

  // 2. Header Brand Logo & Name
  try {
    doc.addImage(KENDAT_FIXLAP_EMBLEM_BASE64, 'PNG', 16, 14, 12, 12);
  } catch {
    doc.setFillColor(7, 34, 46);
    doc.roundedRect(16, 14, 12, 12, 2, 2, 'F');
  }

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(18, 60, 104);
  doc.text('KENDAT ', 32, 21);
  const kendatWidth = doc.getTextWidth('KENDAT ');
  doc.setTextColor(233, 99, 25);
  doc.text('FIXLAP', 32 + kendatWidth, 21);

  doc.setFont('LiberationSans', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('EXECUTIVE REPAIR OPERATIONS & WORKSHOP REPORT', 32, 26);

  // Right Header details
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Reporting Period:`, pageWidth - 16, 19, { align: 'right' });
  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.monthName} ${data.year}`, pageWidth - 16, 24, { align: 'right' });
  doc.setFont('LiberationSans', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth - 16, 28, { align: 'right' });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(16, 32, pageWidth - 16, 32);

  // 3. Period Executive KPI Summary Cards
  let y = 38;
  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Executive Summary', 16, y);

  y += 5;
  const cardWidth = 42;
  const cardHeight = 22;
  const cardGap = 3;

  const kpis = [
    { label: 'Amount Made (Revenue)', value: `NGN ${Number(data.periodSummary.revenue || 0).toLocaleString()}`, color: [22, 101, 52], bg: [240, 253, 244] },
    { label: 'Repair Requests', value: String(data.periodSummary.totalJobs || 0), color: [15, 23, 42], bg: [248, 250, 252] },
    { label: 'Completed Repairs', value: String(data.periodSummary.completedJobs || 0), color: [3, 105, 161], bg: [240, 249, 255] },
    { label: 'Completion Rate', value: `${data.periodSummary.completionRate || 0}%`, color: [126, 34, 206], bg: [250, 245, 255] },
  ];

  kpis.forEach((kpi, index) => {
    const x = 16 + index * (cardWidth + cardGap);
    doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFont('LiberationSans', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3, y + 6);

    doc.setFont('LiberationSans', 'bold');
    doc.setFontSize(kpi.value.length > 12 ? 8.5 : 11);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 3, y + 15);
  });

  // 4. Status & Device Distribution Table
  y += cardHeight + 8;
  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Work Order Status & Intake Breakdown', 16, y);

  y += 4;
  doc.setFillColor(15, 43, 56);
  doc.rect(16, y, pageWidth - 32, 7, 'F');
  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('REPAIR STATUS', 20, y + 4.8);
  doc.text('COUNT', 75, y + 4.8, { align: 'right' });
  doc.text('DEVICE CATEGORY', 105, y + 4.8);
  doc.text('VOLUME (SHARE)', pageWidth - 20, y + 4.8, { align: 'right' });

  y += 7;
  const statusEntries = Object.entries(data.statusCounts || {});
  const categoryEntries = Object.entries(data.categoryBreakdown || {});
  const maxRows = Math.max(statusEntries.length, categoryEntries.length);

  for (let i = 0; i < maxRows; i++) {
    const isEven = i % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(16, y, pageWidth - 32, 6, 'F');

    // Status Column
    if (statusEntries[i]) {
      const [status, count] = statusEntries[i];
      doc.setFont('LiberationSans', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(status, 20, y + 4.2);
      doc.setFont('LiberationSans', 'bold');
      doc.text(String(count), 75, y + 4.2, { align: 'right' });
    }

    // Category Column
    if (categoryEntries[i]) {
      const [category, catData] = categoryEntries[i];
      doc.setFont('LiberationSans', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(category, 105, y + 4.2);
      doc.setFont('LiberationSans', 'bold');
      doc.text(`${catData.count} (${catData.percentage}%)`, pageWidth - 20, y + 4.2, { align: 'right' });
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(16, y + 6, pageWidth - 16, y + 6);
    y += 6;
  }

  // 5. Individual Technician Performance Table
  y += 8;
  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Individual Technician Performance Roster', 16, y);
  doc.setFont('LiberationSans', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Ranked by completed repairs and revenue generated for this reporting period', 16, y + 4);

  y += 7;
  doc.setFillColor(15, 43, 56);
  doc.rect(16, y, pageWidth - 32, 7, 'F');
  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('TECHNICIAN', 20, y + 4.8);
  doc.text('SPECIALTIES', 65, y + 4.8);
  doc.text('ASSIGNED', 115, y + 4.8, { align: 'right' });
  doc.text('COMPLETED', 135, y + 4.8, { align: 'right' });
  doc.text('ACTIVE', 152, y + 4.8, { align: 'right' });
  doc.text('EFFICIENCY', 170, y + 4.8, { align: 'right' });
  doc.text('REVENUE (NGN)', pageWidth - 20, y + 4.8, { align: 'right' });

  y += 7;
  const techs = data.technicianPerformance || [];
  if (techs.length === 0) {
    doc.setFont('LiberationSans', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('No technician records found for this period.', 20, y + 6);
    y += 10;
  } else {
    techs.forEach((tech, idx) => {
      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(16, y, pageWidth - 32, 7, 'F');

      doc.setFont('LiberationSans', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(tech.name, 20, y + 4.8);

      doc.setFont('LiberationSans', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(71, 85, 105);
      const specs = Array.isArray(tech.specialties) ? tech.specialties.slice(0, 2).join(', ') : tech.specialty;
      doc.text(specs.length > 25 ? `${specs.slice(0, 24)}...` : specs, 65, y + 4.8);

      doc.setFont('LiberationSans', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(String(tech.assignedJobs), 115, y + 4.8, { align: 'right' });

      doc.setFont('LiberationSans', 'bold');
      doc.setTextColor(3, 105, 161);
      doc.text(String(tech.completedJobs), 135, y + 4.8, { align: 'right' });

      doc.setFont('LiberationSans', 'normal');
      doc.setTextColor(217, 119, 6);
      doc.text(String(tech.activeJobs), 152, y + 4.8, { align: 'right' });

      doc.setFont('LiberationSans', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${tech.completionRate}%`, 170, y + 4.8, { align: 'right' });

      doc.setFont('LiberationSans', 'bold');
      doc.setTextColor(22, 101, 52);
      doc.text(`₦${Number(tech.revenueGenerated || 0).toLocaleString()}`, pageWidth - 20, y + 4.8, { align: 'right' });

      doc.setDrawColor(241, 245, 249);
      doc.line(16, y + 7, pageWidth - 16, y + 7);
      y += 7;
    });
  }

  // 6. Verification Stamp & Footer Note
  y += 10;
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  try {
    doc.addImage(KENDAT_FIXLAP_STAMP_BASE64, 'PNG', pageWidth - 48, y, 28, 28);
  } catch {}

  doc.setFont('LiberationSans', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Official Workshop Authorization', 16, y + 6);

  doc.setFont('LiberationSans', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('This executive summary reflects actual workshop repair allocations, verified invoices,', 16, y + 11);
  doc.text('and active technician workloads recorded in the Kendat FixLap Management System.', 16, y + 15);
  doc.text('Director of Operations: Alex Doe', 16, y + 21);

  // Bottom Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(16, 282, pageWidth - 16, 282);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Kendat FixLap Repair Centre · Plot 12, Commercial Avenue, Ikeja, Lagos · info@fixlap.com · +234 800 349 5271', pageWidth / 2, 287, { align: 'center' });

  // Save the PDF
  const filename = `fixlab_report_${data.year}_${String(data.month).padStart(2, '0')}.pdf`;
  doc.save(filename);
}
