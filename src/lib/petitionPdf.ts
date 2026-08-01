import { formatRut } from './rut';

/**
 * Generación del reporte PDF de firmas usando pdfmake (https://pdfmake.org).
 * Documento moderno con la identidad de la plataforma (colores y logos).
 */

interface ReportSignature {
  name: string;
  rut: string;
  email?: string;
  comuna?: string;
  comment?: string;
  createdAt: string;
}

interface ReportPetition {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  goal: number;
  signatureCount: number;
  status: string;
  createdAt?: string;
}

const BRAND_BLUE = '#073557';
const BRAND_RED = '#BB2830';
const LIGHT_BLUE = '#EAF2F8';
const SLATE = '#64748B';
const DARK_TEXT = '#1E293B';

function formatDateLabel(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatShortDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-CL');
}

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  published: 'Publicada',
  closed: 'Cerrada',
};

function buildDocDefinition(
  petition: ReportPetition,
  signatures: ReportSignature[],
  images: { logo?: string | null; isotipo?: string | null },
) {
  const total = petition.signatureCount || signatures.length;
  const goal = petition.goal || 0;
  const progress = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : null;
  const generatedAt = new Date().toLocaleString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const rows = signatures.map((signature, index) => [
    { text: String(index + 1), alignment: 'center', color: SLATE, fontSize: 9 },
    { text: signature.name || '—', color: DARK_TEXT, fontSize: 9.5 },
    { text: formatRut(signature.rut) || '—', color: DARK_TEXT, fontSize: 9.5 },
    { text: signature.comuna || '—', color: SLATE, fontSize: 9 },
    { text: formatShortDate(signature.createdAt), alignment: 'center', color: SLATE, fontSize: 8.5 },
  ]);

  const signatureTable = {
    layout: {
      hLineWidth: (rowIndex: number) => (rowIndex === 0 ? 0.8 : 0.4),
      vLineWidth: () => 0,
      hLineColor: () => '#DDE5EC',
      paddingLeft: () => 8,
      paddingRight: () => 8,
      paddingTop: () => 6,
      paddingBottom: () => 6,
      fillColor: (rowIndex: number) => (rowIndex === 0 ? BRAND_BLUE : rowIndex % 2 === 0 ? '#F4F8FB' : '#FFFFFF'),
    },
    table: {
      widths: ['auto', '*', 'auto', '*', 'auto'],
      body: [
        [
          { text: 'N°', color: '#FFFFFF', bold: true, alignment: 'center', fontSize: 8.5 },
          { text: 'NOMBRE', color: '#FFFFFF', bold: true, fontSize: 8.5 },
          { text: 'RUT', color: '#FFFFFF', bold: true, fontSize: 8.5 },
          { text: 'COMUNA', color: '#FFFFFF', bold: true, fontSize: 8.5 },
          { text: 'FECHA', color: '#FFFFFF', bold: true, alignment: 'center', fontSize: 8.5 },
        ],
        ...rows,
      ],
    },
  };

  const statsCells: any[] = [
    {
      stack: [
        { text: 'TOTAL DE FIRMAS', fontSize: 7.5, bold: true, color: BRAND_BLUE, characterSpacing: 0.6, margin: [0, 0, 0, 4] },
        { text: total.toLocaleString('es-CL'), fontSize: 26, bold: true, color: BRAND_BLUE },
      ],
      fillColor: LIGHT_BLUE,
      margin: [4, 4, 4, 4],
    },
    {
      stack: [
        { text: 'META', fontSize: 7.5, bold: true, color: BRAND_RED, characterSpacing: 0.6, margin: [0, 0, 0, 4] },
        { text: goal > 0 ? goal.toLocaleString('es-CL') : 'Sin meta', fontSize: 26, bold: true, color: BRAND_RED },
      ],
      fillColor: '#FBEEEF',
      margin: [4, 4, 4, 4],
    },
    {
      stack: [
        { text: 'AVANCE', fontSize: 7.5, bold: true, color: BRAND_BLUE, characterSpacing: 0.6, margin: [0, 0, 0, 4] },
        { text: progress !== null ? `${progress}%` : '—', fontSize: 26, bold: true, color: BRAND_BLUE },
      ],
      fillColor: LIGHT_BLUE,
      margin: [4, 4, 4, 4],
    },
  ];

  const progressBar = progress !== null
    ? {
        table: {
          widths: [`${progress}%`, `${100 - progress}%`],
          body: [
            [
              { text: '', fillColor: BRAND_RED, height: 8 },
              { text: '', fillColor: '#E2E8F0', height: 8 },
            ],
          ],
        },
        layout: 'noBorders',
        margin: [0, 6, 0, 0],
      }
    : null;

  const headerLogo = images.logo
    ? { image: images.logo, width: 150, fit: [150, 56] }
    : { text: 'AVANCEMOS POR CHILE', fontSize: 16, bold: true, color: BRAND_BLUE };

  const headerTable = {
    layout: 'noBorders',
    table: {
      widths: ['*', '*'],
      body: [
        [
          headerLogo,
          {
            stack: [
              { text: 'AVANCEMOS POR CHILE', fontSize: 9, bold: true, color: SLATE, characterSpacing: 1.4, alignment: 'right' },
              { text: 'REPORTE DE FIRMAS', fontSize: 22, bold: true, color: BRAND_BLUE, alignment: 'right', margin: [0, 2, 0, 0] },
              { text: 'Recolección oficial de firmas de iniciativas', fontSize: 9.5, color: SLATE, alignment: 'right', margin: [0, 2, 0, 0] },
            ],
          },
        ],
      ],
    },
  };

  return {
    pageSize: 'A4' as const,
    pageMargins: [42, 48, 42, 76],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      color: DARK_TEXT,
      lineHeight: 1.35,
    },
    header: (currentPage: number) => (currentPage === 1 ? null : { margin: [42, 18, 42, 0], columns: [{ image: images.isotipo ?? images.logo, width: 22 }, { text: 'Avancemos Por Chile — Reporte de Firmas', alignment: 'right', fontSize: 8, color: SLATE, margin: [0, 6, 0, 0] }] }),
    footer: (currentPage: number, pageCount: number) => ({
      margin: [42, 18, 42, 18],
      columns: [
        {
          stack: [
            { text: 'Avancemos Por Chile', fontSize: 8, bold: true, color: BRAND_BLUE, margin: [0, 0, 0, 2] },
            { text: `Generado el ${generatedAt}`, fontSize: 7.5, color: SLATE },
          ],
        },
        { text: `Página ${currentPage} de ${pageCount}`, alignment: 'right', fontSize: 8, color: SLATE, margin: [0, 8, 0, 0] },
      ],
    }),
    content: [
      headerTable,
      { canvas: [{ type: 'rect', x: 0, y: 0, w: 515, h: 3, color: BRAND_RED }], margin: [0, 8, 0, 0] },

      { text: 'INICIATIVA', fontSize: 8, bold: true, color: BRAND_RED, characterSpacing: 1.6, margin: [0, 18, 0, 6] },
      { text: petition.title, fontSize: 22, bold: true, color: BRAND_BLUE, margin: [0, 0, 0, 8] },
      ...(petition.summary
        ? [{ text: petition.summary, fontSize: 10.5, color: SLATE, margin: [0, 0, 0, 12] }]
        : []),

      {
        columns: [
          { width: 'auto', stack: [{ text: 'ESTADO', fontSize: 7.5, bold: true, color: SLATE, characterSpacing: 0.8 }, { text: STATUS_LABEL[petition.status] || petition.status, fontSize: 10, bold: true, color: DARK_TEXT, margin: [0, 2, 0, 0] }] },
          { width: 'auto', stack: [{ text: 'CREADA', fontSize: 7.5, bold: true, color: SLATE, characterSpacing: 0.8 }, { text: formatDateLabel(petition.createdAt), fontSize: 10, bold: true, color: DARK_TEXT, margin: [0, 2, 0, 0] }] },
          { width: '*', stack: [{ text: 'ENLACE', fontSize: 7.5, bold: true, color: SLATE, characterSpacing: 0.8 }, { text: `avancemosporchile.cl/firma/${petition.slug}`, fontSize: 9, color: BRAND_BLUE, margin: [0, 3, 0, 0] }] },
        ],
        columnGap: 24,
        margin: [0, 0, 0, 16],
      },

      { table: { widths: ['*', '*', '*'], body: [statsCells] }, layout: 'noBorders', margin: [0, 0, 0, 4] },
      ...(progressBar ? [progressBar] : []),

      { text: 'FIRMAS', fontSize: 8, bold: true, color: BRAND_RED, characterSpacing: 1.6, margin: [0, 22, 0, 8] },
      ...(rows.length > 0
        ? [signatureTable]
        : [{ text: 'Aún no hay firmas registradas para esta iniciativa.', color: SLATE, italics: true, margin: [0, 8, 0, 0] }]),

      { text: 'Documento generado automáticamente por la plataforma Avancemos Por Chile. Los RUT son datos personales y deben tratarse conforme a la ley de protección de datos.', fontSize: 7, color: SLATE, italics: true, margin: [0, 24, 0, 0] },
    ],
  };
}

/**
 * Descarga el reporte PDF de firmas de una iniciativa usando pdfmake.
 */
export async function downloadPetitionReportPdf(
  petition: ReportPetition,
  signatures: ReportSignature[],
) {
  const [pdfMakeModule, vfsModule] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ]);

  const pdfMake: any = (pdfMakeModule as any).default ?? pdfMakeModule;
  const vfsFonts: any = (vfsModule as any).default ?? vfsModule;
  // En el navegador (Vite) el import de vfs_fonts puede llegar como el mapa de fuentes
  // directamente, o envuelto en { pdfMake: { vfs } } según el interop del bundle.
  pdfMake.vfs = vfsFonts.pdfMake?.vfs ?? vfsFonts.vfs ?? vfsFonts;

  // Verificación defensiva: si no hay fuentes, no intentar generar el PDF.
  if (!pdfMake.vfs || typeof pdfMake.vfs !== 'object') {
    throw new Error('No se pudieron cargar las fuentes del PDF');
  }

  const [logo, isotipo] = await Promise.all([
    loadImageAsDataUrl('/logo-avancemosporchile.png'),
    loadImageAsDataUrl('/isotipo-avancemosporchile.png'),
  ]);

  const docDefinition = buildDocDefinition(petition, signatures, { logo, isotipo });
  pdfMake.createPdf(docDefinition).download(`reporte-firmas-${petition.slug || 'iniciativa'}.pdf`);
}
