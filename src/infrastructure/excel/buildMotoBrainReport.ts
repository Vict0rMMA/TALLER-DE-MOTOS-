import ExcelJS from 'exceljs';

export type TopProductRow = {
  productId: string;
  productName: string;
  totalSold: number;
  revenue: number;
};

export type RevenueMonthRow = {
  month: string;
  monthLabel: string;
  revenue: number;
  serviceCount: number;
};

export type ReportMeta = {
  workshopName?: string;
  periodLabel: string;
  generatedAt: string;
  months: number;
};

export type ReportKPIs = {
  totalCustomers: number;
  closedThisMonth: number;
  revenueThisMonth: number;
  lowStockCount: number;
};

const C = {
  NAVY: '0F172A',
  NAVY2: '1E293B',
  BODY: '334155',
  EMERALD: '10B981',
  EMERALD2: '059669',
  TEAL: '0D9488',
  WHITE: 'FFFFFF',
  MUTED: '64748B',
  BG_ALT: 'F1F5F9',
  BG_WHITE: 'FFFFFF',
  BORDER: 'E2E8F0',
  RED: 'DC2626',
  AMBER: 'D97706',
  BEST_TINT: 'FFFBEB',
} as const;

const xfill = (color: string): ExcelJS.Fill =>
  ({ type: 'pattern', pattern: 'solid', fgColor: { argb: color.length === 8 ? color : `FF${color}` } });

const xfont = (
  size = 10,
  opts: { bold?: boolean; color?: string; italic?: boolean } = {},
): Partial<ExcelJS.Font> => ({
  name: 'Segoe UI',
  size,
  bold: opts.bold ?? false,
  italic: opts.italic ?? false,
  color: { argb: `FF${opts.color ?? C.BODY}` },
});

const xborder = (): Partial<ExcelJS.Borders> => {
  const s: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: `FF${C.BORDER}` } };
  return { top: s, bottom: s, left: s, right: s };
};

const xcenter = (): Partial<ExcelJS.Alignment> => ({ horizontal: 'center', vertical: 'middle' });
const xleft = (indent = 0): Partial<ExcelJS.Alignment> => ({ horizontal: 'left', vertical: 'middle', indent });
const xright = (): Partial<ExcelJS.Alignment> => ({ horizontal: 'right', vertical: 'middle', indent: 1 });

function colLetter(n: number): string {
  let s = '';
  let num = n;
  while (num > 0) {
    const rem = (num - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    num = Math.floor((num - 1) / 26);
  }
  return s;
}

function paintRow(ws: ExcelJS.Worksheet, row: number, fromCol: number, toCol: number, color: string) {
  for (let c = fromCol; c <= toCol; c++) {
    ws.getCell(row, c).fill = xfill(color);
  }
}

function buildBanner(
  ws: ExcelJS.Worksheet,
  lastDataCol: number,
  title: string,
  meta: ReportMeta,
  accent: string,
) {
  const L = colLetter(lastDataCol);
  const gutterEnd = lastDataCol + 1;

  for (let r = 1; r <= 3; r++) {
    ws.getRow(r).height = r === 1 ? 44 : r === 2 ? 20 : 24;
    paintRow(ws, r, 1, gutterEnd, C.NAVY);
  }
  ws.getRow(4).height = 6;
  paintRow(ws, 4, 1, gutterEnd, accent);

  ws.mergeCells(`B1:${L}1`);
  ws.getCell('B1').value = 'MOTOBRAIN';
  ws.getCell('B1').font = xfont(26, { bold: true, color: C.WHITE });
  ws.getCell('B1').alignment = xcenter();

  ws.mergeCells(`B2:${L}2`);
  ws.getCell('B2').value = meta.workshopName ?? 'Reporte de gestión para talleres de motos';
  ws.getCell('B2').font = xfont(10, { italic: true, color: C.EMERALD });
  ws.getCell('B2').alignment = xcenter();

  ws.mergeCells(`B3:${L}3`);
  ws.getCell('B3').value = title;
  ws.getCell('B3').font = xfont(13, { bold: true, color: C.WHITE });
  ws.getCell('B3').alignment = xcenter();

  ws.getRow(5).height = 22;
  ws.mergeCells(`B5:${L}5`);
  ws.getCell('B5').value = `Generado: ${meta.generatedAt}    ·    Período (${meta.months} meses): ${meta.periodLabel}`;
  ws.getCell('B5').font = xfont(9, { color: C.MUTED });
  ws.getCell('B5').alignment = xleft(1);

  ws.getRow(6).height = 12;
}

function buildKpiStrip(
  ws: ExcelJS.Worksheet,
  row: number,
  cards: { label: string; value: string | number; numFmt?: string; accent: string; from: number; to: number }[],
) {
  ws.getRow(row).height = 16;
  ws.getRow(row + 1).height = 36;
  ws.getRow(row + 2).height = 5;

  for (const card of cards) {
    const cs = colLetter(card.from);
    const ce = colLetter(card.to);
    ws.mergeCells(`${cs}${row}:${ce}${row}`);
    ws.mergeCells(`${cs}${row + 1}:${ce}${row + 1}`);
    ws.mergeCells(`${cs}${row + 2}:${ce}${row + 2}`);

    const lbl = ws.getCell(`${cs}${row}`);
    lbl.value = card.label;
    lbl.font = xfont(8, { bold: true, color: C.MUTED });
    lbl.fill = xfill(C.BG_ALT);
    lbl.alignment = { horizontal: 'center', vertical: 'bottom' };
    lbl.border = xborder();

    const val = ws.getCell(`${cs}${row + 1}`);
    val.value = card.value;
    if (typeof card.value === 'number' && card.numFmt) val.numFmt = card.numFmt;
    val.font = xfont(18, { bold: true, color: card.accent });
    val.fill = xfill(C.BG_WHITE);
    val.alignment = xcenter();
    val.border = xborder();

    paintRow(ws, row + 2, card.from, card.to, card.accent);
  }
}

function addDataBar(ws: ExcelJS.Worksheet, ref: string, color: string) {
  ws.addConditionalFormatting({
    ref,
    rules: [
      {
        type: 'dataBar',
        priority: 1,
        cfvo: [{ type: 'min' }, { type: 'max' }],
        color: { argb: `FF${color}` },
      },
    ] as any,
  });
}

function sheetFooter(ws: ExcelJS.Worksheet, row: number, fromCol: number, toCol: number, text: string) {
  ws.getRow(row).height = 18;
  ws.mergeCells(`${colLetter(fromCol)}${row}:${colLetter(toCol)}${row}`);
  const cell = ws.getCell(row, fromCol);
  cell.value = text;
  cell.font = xfont(8, { italic: true, color: C.MUTED });
  cell.alignment = xcenter();
  cell.border = { top: { style: 'thin', color: { argb: `FF${C.BORDER}` } } };
}

function buildResumenSheet(
  wb: ExcelJS.Workbook,
  meta: ReportMeta,
  kpis: ReportKPIs,
  revenue: RevenueMonthRow[],
  topProds: TopProductRow[],
) {
  const ws = wb.addWorksheet('Resumen', {
    properties: { tabColor: { argb: `FF${C.NAVY}` } },
    views: [{ showGridLines: false }],
  });
  ws.columns = [{ width: 3 }, { width: 28 }, { width: 22 }, { width: 22 }, { width: 3 }];

  buildBanner(ws, 4, 'RESUMEN EJECUTIVO', meta, C.NAVY);

  buildKpiStrip(ws, 7, [
    { label: 'CLIENTES', value: kpis.totalCustomers, numFmt: '#,##0', accent: C.TEAL, from: 2, to: 2 },
    { label: 'SERVICIOS (MES)', value: kpis.closedThisMonth, numFmt: '#,##0', accent: C.EMERALD, from: 3, to: 3 },
    { label: 'INGRESOS (MES)', value: kpis.revenueThisMonth, numFmt: '"$"#,##0', accent: C.AMBER, from: 4, to: 4 },
  ]);

  const totalRev = revenue.reduce((s, r) => s + r.revenue, 0);
  const totalSrv = revenue.reduce((s, r) => s + r.serviceCount, 0);
  const best = revenue.reduce(
    (b, r) => (r.revenue > b.revenue ? r : b),
    revenue[0] ?? { revenue: 0, monthLabel: '—', month: '', serviceCount: 0 },
  );

  ws.getRow(12).height = 14;
  ws.mergeCells('B12:D12');
  ws.getCell('B12').value = 'Indicadores del período exportado';
  ws.getCell('B12').font = xfont(11, { bold: true, color: C.NAVY });
  ws.getCell('B12').border = { bottom: { style: 'medium', color: { argb: `FF${C.EMERALD}` } } };

  const lines: { label: string; value: string | number; numFmt?: string }[] = [
    { label: 'Ingresos acumulados', value: totalRev, numFmt: '"$"#,##0' },
    { label: 'Servicios cerrados', value: totalSrv, numFmt: '#,##0' },
    { label: 'Promedio por servicio', value: totalSrv > 0 ? Math.round(totalRev / totalSrv) : '—', numFmt: '"$"#,##0' },
    { label: 'Mejor mes', value: best.revenue > 0 ? `${best.monthLabel} ($${best.revenue.toLocaleString('es-CO')})` : '—' },
    { label: 'Repuestos en ranking', value: topProds.length, numFmt: '#,##0' },
    { label: 'Alertas stock bajo', value: kpis.lowStockCount, numFmt: '#,##0' },
  ];

  let r = 14;
  for (const { label, value, numFmt } of lines) {
    ws.getRow(r).height = 24;
    ws.getCell(r, 2).value = label;
    ws.getCell(r, 2).font = xfont(10, { color: C.MUTED });
    ws.getCell(r, 2).alignment = xleft(1);
    ws.mergeCells(`C${r}:D${r}`);
    const vcell = ws.getCell(r, 3);
    vcell.value = value;
    if (typeof value === 'number' && numFmt) vcell.numFmt = numFmt;
    vcell.font = xfont(10, { bold: true, color: C.BODY });
    vcell.alignment = xright();
    r++;
  }

  sheetFooter(ws, r + 2, 2, 4, 'MotoBrain AI · Hoja de resumen · Abre las pestañas Ingresos y Top Repuestos para el detalle.');
}

function buildIngresosSheet(wb: ExcelJS.Workbook, meta: ReportMeta, data: RevenueMonthRow[]) {
  const ws = wb.addWorksheet('Ingresos', {
    properties: { tabColor: { argb: `FF${C.EMERALD}` } },
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
    views: [{ showGridLines: false }],
  });

  ws.columns = [
    { width: 3 },
    { width: 24 },
    { width: 11 },
    { width: 20 },
    { width: 13 },
    { width: 18 },
    { width: 3 },
  ];

  const lastCol = 6;
  buildBanner(ws, lastCol, 'INGRESOS POR MES', meta, C.EMERALD);

  const totalRevenue = data.reduce((s, r) => s + r.revenue, 0);
  const totalServices = data.reduce((s, r) => s + r.serviceCount, 0);
  const avgPerService = totalServices > 0 ? Math.round(totalRevenue / totalServices) : 0;
  const bestMonth = data.reduce(
    (best, r) => (r.revenue > best.revenue ? r : best),
    data[0] ?? { revenue: 0, monthLabel: '—', month: '', serviceCount: 0 },
  );

  buildKpiStrip(ws, 7, [
    { label: 'SERVICIOS', value: totalServices, numFmt: '#,##0', accent: C.TEAL, from: 2, to: 3 },
    { label: 'INGRESOS TOTALES', value: totalRevenue, numFmt: '"$"#,##0', accent: C.EMERALD, from: 4, to: 4 },
    { label: 'PROM / SERVICIO', value: avgPerService, numFmt: '"$"#,##0', accent: C.AMBER, from: 5, to: 5 },
  ]);

  ws.getRow(12).height = 12;
  ws.mergeCells('B13:F13');
  ws.getCell('B13').value = 'Detalle mensual (servicios cerrados)';
  ws.getCell('B13').font = xfont(11, { bold: true, color: C.NAVY });
  ws.getCell('B13').border = { bottom: { style: 'medium', color: { argb: `FF${C.EMERALD}` } } };

  const HDR = 15;
  ws.getRow(HDR).height = 30;
  const headers = ['MES', 'SERV.', 'INGRESOS (COP)', 'VS MES ANT.', 'PROM / SERV.'];
  headers.forEach((h, i) => {
    const cell = ws.getCell(HDR, i + 2);
    cell.value = h;
    cell.font = xfont(10, { bold: true, color: C.WHITE });
    cell.fill = xfill(C.NAVY);
    cell.alignment = i === 0 ? xleft(1) : xcenter();
  });

  const firstDataRow = HDR + 1;
  data.forEach((row, idx) => {
    const r = firstDataRow + idx;
    ws.getRow(r).height = 26;
    const bg = idx % 2 === 1 ? C.BG_ALT : C.BG_WHITE;
    const hasData = row.serviceCount > 0;
    const avg = row.serviceCount > 0 ? Math.round(row.revenue / row.serviceCount) : 0;
    const isBest = hasData && row.monthLabel === bestMonth.monthLabel;
    const rowBg = isBest ? C.BEST_TINT : bg;

    const prev = idx > 0 ? data[idx - 1].revenue : null;
    let growthVal: number | null = null;
    if (prev !== null && prev > 0) growthVal = (row.revenue - prev) / prev;

    const cells: { col: number; value: ExcelJS.CellValue; fmt?: string; color?: string; bold?: boolean }[] = [
      {
        col: 2,
        value: isBest ? `★ ${row.monthLabel}` : row.monthLabel,
        color: isBest ? C.AMBER : hasData ? C.NAVY : C.MUTED,
        bold: isBest || hasData,
      },
      { col: 3, value: row.serviceCount, color: hasData ? C.TEAL : C.MUTED, bold: hasData },
      { col: 4, value: row.revenue, fmt: '"$"#,##0', color: hasData ? C.NAVY : C.MUTED, bold: hasData },
      {
        col: 5,
        value: growthVal,
        fmt: growthVal === null ? undefined : '+0.0%;-0.0%;"—"',
        color: growthVal === null ? C.MUTED : growthVal >= 0 ? C.EMERALD2 : C.RED,
        bold: hasData,
      },
      { col: 6, value: avg > 0 ? avg : null, fmt: '"$"#,##0', color: C.EMERALD2 },
    ];

    for (const c of cells) {
      const cell = ws.getCell(r, c.col);
      cell.value = c.value;
      cell.font = xfont(10, { bold: c.bold, color: c.color });
      cell.fill = xfill(rowBg);
      cell.alignment = c.col === 2 ? xleft(1) : c.col >= 4 ? xright() : xcenter();
      if (c.fmt) cell.numFmt = c.fmt;
      cell.border = xborder();
    }
  });

  const lastDataRow = firstDataRow + data.length - 1;
  if (data.length > 0) addDataBar(ws, `D${firstDataRow}:D${lastDataRow}`, C.EMERALD);

  const TOT = lastDataRow + 1;
  ws.getRow(TOT).height = 32;
  const totals: { col: number; value: ExcelJS.CellValue; fmt?: string }[] = [
    { col: 2, value: 'TOTAL' },
    { col: 3, value: totalServices },
    { col: 4, value: totalRevenue, fmt: '"$"#,##0' },
    { col: 5, value: null },
    { col: 6, value: avgPerService, fmt: '"$"#,##0' },
  ];
  for (const t of totals) {
    const cell = ws.getCell(TOT, t.col);
    cell.value = t.value;
    cell.font = xfont(11, { bold: true, color: C.WHITE });
    cell.fill = xfill(C.NAVY);
    cell.alignment = t.col === 2 ? xleft(1) : t.col >= 4 ? xright() : xcenter();
    if (t.fmt) cell.numFmt = t.fmt;
    cell.border = {
      top: { style: 'medium', color: { argb: `FF${C.EMERALD}` } },
      bottom: { style: 'medium', color: { argb: `FF${C.EMERALD}` } },
    };
  }

  if (bestMonth.revenue > 0) {
    const br = TOT + 2;
    ws.mergeCells(`B${br}:F${br}`);
    ws.getCell(`B${br}`).value =
      `Mejor mes: ${bestMonth.monthLabel} — $${bestMonth.revenue.toLocaleString('es-CO')}`;
    ws.getCell(`B${br}`).font = xfont(10, { bold: true, color: C.AMBER });
    ws.getCell(`B${br}`).fill = xfill(C.BEST_TINT);
    ws.getCell(`B${br}`).alignment = xcenter();
  }

  ws.autoFilter = { from: { row: HDR, column: 2 }, to: { row: lastDataRow, column: 6 } };
  ws.views = [{ state: 'frozen', ySplit: HDR, showGridLines: false }];

  sheetFooter(ws, TOT + 5, 2, 6, 'Solo servicios con estado cerrado. Montos en COP.');
}

function buildTopRepuestosSheet(wb: ExcelJS.Workbook, meta: ReportMeta, topProds: TopProductRow[]) {
  const ws = wb.addWorksheet('Top Repuestos', {
    properties: { tabColor: { argb: `FF${C.TEAL}` } },
    views: [{ showGridLines: false }],
  });

  ws.columns = [
    { width: 3 },
    { width: 6 },
    { width: 34 },
    { width: 12 },
    { width: 20 },
    { width: 12 },
    { width: 3 },
  ];

  buildBanner(ws, 6, 'TOP REPUESTOS VENDIDOS', meta, C.TEAL);

  const totalUnits = topProds.reduce((s, p) => s + p.totalSold, 0);
  const totalProdRev = topProds.reduce((s, p) => s + p.revenue, 0);

  buildKpiStrip(ws, 7, [
    { label: 'EN RANKING', value: topProds.length, numFmt: '#,##0', accent: C.TEAL, from: 2, to: 2 },
    { label: 'UNIDADES', value: totalUnits, numFmt: '#,##0', accent: C.EMERALD, from: 3, to: 4 },
    { label: 'INGRESOS', value: totalProdRev, numFmt: '"$"#,##0', accent: C.AMBER, from: 5, to: 5 },
  ]);

  ws.getRow(12).height = 12;
  ws.mergeCells('B13:F13');
  ws.getCell('B13').value = 'Ranking por ingresos generados';
  ws.getCell('B13').font = xfont(11, { bold: true, color: C.NAVY });
  ws.getCell('B13').border = { bottom: { style: 'medium', color: { argb: `FF${C.TEAL}` } } };

  const HDR = 15;
  ws.getRow(HDR).height = 30;
  ['#', 'PRODUCTO', 'UNIDADES', 'INGRESOS (COP)', '% TOTAL'].forEach((h, i) => {
    const cell = ws.getCell(HDR, i + 2);
    cell.value = h;
    cell.font = xfont(10, { bold: true, color: C.WHITE });
    cell.fill = xfill(C.NAVY);
    cell.alignment = i <= 1 ? xleft(i) : xcenter();
  });

  const fp = HDR + 1;
  topProds.forEach((p, idx) => {
    const r = fp + idx;
    ws.getRow(r).height = 26;
    const bg = idx % 2 === 1 ? C.BG_ALT : C.BG_WHITE;
    const pct = totalProdRev > 0 ? p.revenue / totalProdRev : 0;
    const top3 = idx < 3;

    ws.getCell(r, 2).value = idx + 1;
    ws.getCell(r, 2).font = xfont(10, { bold: top3, color: top3 ? C.AMBER : C.MUTED });
    ws.getCell(r, 2).alignment = xcenter();

    ws.getCell(r, 3).value = p.productName;
    ws.getCell(r, 3).font = xfont(10, { bold: top3, color: C.NAVY });
    ws.getCell(r, 3).alignment = xleft(1);

    ws.getCell(r, 4).value = p.totalSold;
    ws.getCell(r, 4).font = xfont(10, { bold: top3, color: C.TEAL });
    ws.getCell(r, 4).alignment = xcenter();

    ws.getCell(r, 5).value = p.revenue;
    ws.getCell(r, 5).numFmt = '"$"#,##0';
    ws.getCell(r, 5).font = xfont(10, { bold: top3, color: top3 ? C.EMERALD : C.BODY });
    ws.getCell(r, 5).alignment = xright();

    ws.getCell(r, 6).value = pct;
    ws.getCell(r, 6).numFmt = '0.0%';
    ws.getCell(r, 6).font = xfont(10, { color: C.MUTED });
    ws.getCell(r, 6).alignment = xcenter();

    for (let c = 2; c <= 6; c++) {
      ws.getCell(r, c).fill = xfill(bg);
      ws.getCell(r, c).border = xborder();
    }
  });

  const lp = fp + topProds.length - 1;
  if (topProds.length > 0) addDataBar(ws, `E${fp}:E${lp}`, C.TEAL);

  const TOT = lp + 1;
  ws.getRow(TOT).height = 32;
  [
    { col: 2, value: 'TOTAL' },
    { col: 3, value: null },
    { col: 4, value: totalUnits },
    { col: 5, value: totalProdRev, fmt: '"$"#,##0' },
    { col: 6, value: 1, fmt: '0%' },
  ].forEach(({ col, value, fmt }) => {
    const cell = ws.getCell(TOT, col);
    cell.value = value;
    cell.font = xfont(11, { bold: true, color: C.WHITE });
    cell.fill = xfill(C.NAVY);
    cell.alignment = col === 3 ? xcenter() : col >= 4 ? xright() : xleft(1);
    if (fmt) cell.numFmt = fmt;
    cell.border = {
      top: { style: 'medium', color: { argb: `FF${C.TEAL}` } },
      bottom: { style: 'medium', color: { argb: `FF${C.TEAL}` } },
    };
  });

  ws.autoFilter = { from: { row: HDR, column: 2 }, to: { row: lp, column: 6 } };
  ws.views = [{ state: 'frozen', ySplit: HDR, showGridLines: false }];

  sheetFooter(ws, TOT + 3, 2, 6, 'Ordenado por ingresos en el período seleccionado.');
}

export async function buildMotoBrainReportWorkbook(options: {
  revenue: RevenueMonthRow[];
  topProducts: TopProductRow[];
  kpis: ReportKPIs;
  meta: ReportMeta;
}): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'MotoBrain AI';
  wb.created = new Date();
  wb.modified = new Date();

  buildResumenSheet(wb, options.meta, options.kpis, options.revenue, options.topProducts);
  buildIngresosSheet(wb, options.meta, options.revenue);
  if (options.topProducts.length > 0) {
    buildTopRepuestosSheet(wb, options.meta, options.topProducts);
  }

  return wb;
}

export function reportFilename(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `motobrain-reporte-${y}-${m}-${day}.xlsx`;
}
