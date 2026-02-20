import React, { useMemo } from 'react';
import { LSContextType, LSContent, DeliveryModeType } from '../../types';
import { FileDown, Loader2, FileCode, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DELIVERY_MODE_LABELS, DELIVERY_MODE_ICONS } from '../../constants';

// Fetch Roboto font at runtime from Google CDN and convert to base64
const ROBOTO_URL = 'https://fonts.gstatic.com/s/roboto/v47/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWubEbGmT.ttf';
let _cachedRobotoBase64: string | null = null;

async function getRobotoBase64(): Promise<string> {
    if (_cachedRobotoBase64) return _cachedRobotoBase64;
    const response = await fetch(ROBOTO_URL);
    if (!response.ok) throw new Error('Failed to fetch Roboto font');
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    _cachedRobotoBase64 = btoa(binary);
    return _cachedRobotoBase64;
}

// Get all delivery modes as a flat array for sorting reference
const ALL_MODES_REF = Object.values(DeliveryModeType);

export const Step4Matrix: React.FC<{ context: LSContextType }> = ({ context }) => {
    const { currentLS } = context;
    const [downloading, setDownloading] = React.useState(false);

    // --- 1. Dynamic Modes Logic ---
    // Filter modes that are actually used in the content
    const activeModes = useMemo(() => {
        const used = new Set<DeliveryModeType>();
        currentLS.modules.forEach(mod => {
            mod.contents.forEach(c => {
                c.deliveryModes.forEach(m => used.add(m));
                if (c.subContents) {
                    c.subContents.forEach(s => s.deliveryModes.forEach(m => used.add(m)));
                }
            });
        });
        // Return sorted based on original order
        return ALL_MODES_REF.filter(m => used.has(m));
    }, [currentLS]);

    // --- Helper: Info Table Data ---
    const getInfoTableData = () => {
        return [
            ['Code', currentLS.code],
            ['Title', currentLS.title],
            ['Subject', currentLS.subject],
            ['Level', currentLS.level],
            ['ECTS (Microcredential)', currentLS.ects],
            ['Dates', `Design: ${currentLS.initialDesignDate} | Revision: ${currentLS.finalRevisionDate}`],
            ['Keywords', currentLS.keywords],
            ['Target Audience', currentLS.targetAudience],
            ['Short Description', currentLS.description],
            ['Learning Objectives (LObjs)', currentLS.objectives.map((o, i) => `${i + 1}. ${o.text}`).join('\n')],
            ['Global Learning Outcomes (LOs)', currentLS.globalLearningOutcomes],
            ['Related SDGs', currentLS.relatedSDGs],
            ['Assessment Methods', currentLS.globalAssessmentMethods],
            ['Calendar', currentLS.calendar],
            ['Duration', `In-person: ${currentLS.durationInPerson} hours\nDigital: ${currentLS.durationDigital} hours`],
            ['Prerequisites', currentLS.prerequisites],
            ['Special Needs', currentLS.specialNeeds],
            ['Materials & Resources', currentLS.materialsAndResources],
            ['Quota', currentLS.quota],
            ['Language', currentLS.language],
            ['Notes', currentLS.notes]
        ];
    };

    // --- HTML Generator Helper ---
    const generateHtmlContent = () => {
        // Generate headers for the modes
        const modeHeaders = activeModes.map(mode =>
            `<th class="center" style="font-size: 9px; padding: 2px; writing-mode: vertical-rl; transform: rotate(180deg);">${DELIVERY_MODE_LABELS[mode]}</th>`
        ).join('');

        const infoRows = getInfoTableData().map(([label, value]) => `
        <tr>
            <td style="background-color: #f9f9f9; font-weight: bold; width: 30%;">${label}</td>
            <td>${typeof value === 'string' ? value.replace(/\n/g, '<br>') : value}</td>
        </tr>
    `).join('');

        let html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
        <meta charset="UTF-8">
        <title>LS Design - ${currentLS.code}</title>
        <style>
            body { font-family: 'Arial', sans-serif; padding: 20px; }
            h1, h2 { text-align: center; color: #002664; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; table-layout: fixed; }
            th, td { border: 1px solid #000; padding: 4px; font-size: 10px; vertical-align: middle; word-wrap: break-word; }
            th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
            .module-row { background-color: #e6e6e6; font-weight: bold; text-align: left; }
            .mode-header-row { background-color: #f9f9f9; font-size: 8px; color: #555; }
            .center { text-align: center; }
            .check { color: #000; font-weight: bold; text-align: center; font-size: 14px; }
            .italic { font-style: italic; color: #555; font-size: 10px; }
            a { color: blue; text-decoration: underline; }
        </style>
    </head>
    <body>
        <h1>LEARNING STATION DESIGN</h1>
        <h2>INFORMATION TABLE</h2>
        
        <!-- Table 1 -->
        <table>
            <col style="width: 30%">
            <col style="width: 70%">
            <thead>
                <tr>
                    <th>Field</th>
                    <th>Value</th>
                </tr>
            </thead>
            <tbody>
                ${infoRows}
            </tbody>
        </table>

        <h2>LS MATRIX</h2>
        <!-- Table 2 (Matrix) -->
        <table>
            <!-- Define Column Widths roughly -->
            <col style="width: 15%"> <!-- Title -->
            ${activeModes.map(() => `<col style="width: 2.5%">`).join('')} 
            <col style="width: 5%"> <!-- Duration -->
            <col style="width: 15%"> <!-- Assessment -->
            <col style="width: 15%"> <!-- Outcomes -->

            <thead>
                <tr>
                    <th>MODULES</th>
                    <th colspan="${activeModes.length}">DELIVERY MODES</th>
                    <th>Duration</th>
                    <th>Assessment</th>
                    <th>LEARNING OUTCOMES</th>
                </tr>
            </thead>
            <tbody>
    `;

        currentLS.modules.forEach((mod, modIdx) => {
            // 1. Module Title Row (with assessment + outcome inline)
            html += `
            <tr class="module-row">
                <td colspan="${1 + activeModes.length + 1}">Module ${modIdx + 1}: ${mod.title}</td>
                <td style="background-color: #e6e6e6; font-weight: bold; text-align: center;">${mod.assessmentMethods?.join(', ') || ''}</td>
                <td style="background-color: #e6e6e6; font-weight: bold; text-align: center;">${mod.learningOutcome || ''}</td>
            </tr>
        `;

            // 2. Sub-Headers
            html += `
            <tr class="mode-header-row">
                <td class="center"><i>Content Title</i></td>
                ${modeHeaders}
                <td class="center"><i>Duration</i></td>
                <td class="center"><i></i></td>
                <td class="center"><i></i></td>
            </tr>
        `;

            // 3. Objectives
            let objectivesText = 'Related Learning Objectives: ';
            if (mod.associatedObjectiveIds && mod.associatedObjectiveIds.length > 0) {
                objectivesText += mod.associatedObjectiveIds
                    .map(id => {
                        const o = currentLS.objectives.find(obj => obj.id === id);
                        return o ? `(LObj: ${o.text})` : '';
                    })
                    .join(', ');
            } else {
                objectivesText += "None";
            }

            html += `
            <tr>
                <td colspan="${1 + activeModes.length + 3}" class="italic">${objectivesText}</td>
            </tr>
        `;

            // 4. Contents — each row has its own duration
            if (mod.contents.length === 0) {
                html += `<tr><td colspan="${activeModes.length + 4}">(No Content)</td></tr>`;
            } else {
                const createRowHtml = (item: LSContent, label: string) => {
                    let row = `<tr>`;
                    row += `<td>${label} ${item.title}</td>`;

                    activeModes.forEach(mode => {
                        const hasMode = item.deliveryModes.includes(mode);
                        let cellContent = '';
                        if (hasMode) {
                            const linkUrl = item.deliveryLinks[mode];
                            cellContent = linkUrl
                                ? `<a href="${linkUrl}"><b>&#10003;</b></a>`
                                : `<b>&#10003;</b>`;
                        }
                        row += `<td class="center check" style="background-color: ${hasMode ? '#e6f3ff' : 'transparent'}">${cellContent}</td>`;
                    });

                    row += `<td class="center">${item.duration} min</td>`;
                    row += `<td></td>`;
                    row += `<td></td>`;
                    row += `</tr>`;
                    return row;
                };

                mod.contents.forEach((content, cIdx) => {
                    html += createRowHtml(content, `${modIdx + 1}.${cIdx + 1}`);
                    if (content.subContents) {
                        content.subContents.forEach((sub, sIdx) => {
                            html += createRowHtml(sub, `${modIdx + 1}.${cIdx + 1}.${sIdx + 1}`);
                        });
                    }
                });
            }
        });

        html += `
            </tbody>
        </table>
    </body>
    </html>
    `;
        return html;
    };

    // --- PDF Generator ---
    const downloadPDF = async () => {
        setDownloading(true);

        try {
            // Landscape A4
            const doc = new jsPDF('l', 'mm', 'a4');

            // Register Roboto font for Turkish character support (fetched from CDN)
            const robotoBase64 = await getRobotoBase64();
            doc.addFileToVFS('Roboto-Regular.ttf', robotoBase64);
            doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
            doc.setFont('Roboto');

            const ITU_BLUE: [number, number, number] = [0, 38, 100]; // #002664
            const HEADER_BG: [number, number, number] = [242, 242, 242];
            const MODULE_BG: [number, number, number] = [230, 230, 230];
            const CHECK_BG: [number, number, number] = [230, 243, 255];

            // --- PAGE 1: INFORMATION TABLE (Portrait for better readability) ---
            doc.setFontSize(18);
            doc.setTextColor(...ITU_BLUE);
            doc.text('LEARNING STATION DESIGN', 148, 18, { align: 'center' });
            doc.setFontSize(13);
            doc.text('INFORMATION TABLE', 148, 27, { align: 'center' });
            doc.setTextColor(0, 0, 0);

            const infoTableBody = getInfoTableData();

            autoTable(doc, {
                startY: 33,
                head: [['Field', 'Value']],
                body: infoTableBody,
                theme: 'grid',
                headStyles: {
                    font: 'Roboto',
                    fillColor: ITU_BLUE,
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 10,
                    cellPadding: 4,
                    halign: 'center',
                },
                styles: {
                    font: 'Roboto',
                    fontSize: 9,
                    cellPadding: 3,
                    lineWidth: 0.3,
                    lineColor: [0, 0, 0],
                    overflow: 'linebreak',
                },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 65, fillColor: HEADER_BG },
                    1: { cellWidth: 'auto' }
                },
                pageBreak: 'auto'
            });

            // --- PAGE 2: MATRIX ---
            doc.addPage('a4', 'landscape');
            doc.setFontSize(18);
            doc.setTextColor(...ITU_BLUE);
            doc.text('LEARNING STATION DESIGN', 148, 14, { align: 'center' });
            doc.setFontSize(13);
            doc.text('LS MATRIX', 148, 22, { align: 'center' });
            doc.setTextColor(0, 0, 0);

            const matrixBody: any[] = [];

            currentLS.modules.forEach((mod, modIdx) => {
                // 1. Module Title Row (with assessment + outcome)
                matrixBody.push([{
                    content: `Module ${modIdx + 1}: ${mod.title}`,
                    colSpan: 1 + activeModes.length + 1,
                    styles: { fillColor: MODULE_BG, fontStyle: 'bold' as const, fontSize: 9 }
                }, {
                    content: mod.assessmentMethods.join(', '),
                    styles: { fillColor: MODULE_BG, fontStyle: 'bold' as const, halign: 'center' as const, fontSize: 8 }
                }, {
                    content: mod.learningOutcome || '',
                    styles: { fillColor: MODULE_BG, fontStyle: 'bold' as const, halign: 'center' as const, fontSize: 8 }
                }]);

                // 2. Mode label headers
                const headerRow: any[] = [];
                headerRow.push({ content: 'Content Title', styles: { fontStyle: 'italic' as const, halign: 'right' as const, fillColor: HEADER_BG, fontSize: 7 } });
                activeModes.forEach(mode => {
                    headerRow.push({
                        content: DELIVERY_MODE_LABELS[mode],
                        styles: { fontSize: 6, halign: 'center' as const, fontStyle: 'bold' as const, fillColor: HEADER_BG }
                    });
                });
                headerRow.push({ content: 'Duration', styles: { fontStyle: 'bold' as const, halign: 'center' as const, fillColor: HEADER_BG, fontSize: 7 } });
                headerRow.push({ content: '', styles: { fillColor: HEADER_BG } });
                headerRow.push({ content: '', styles: { fillColor: HEADER_BG } });
                matrixBody.push(headerRow);

                // 3. Objectives
                let objectivesText = 'Related Learning Objectives: ';
                if (mod.associatedObjectiveIds && mod.associatedObjectiveIds.length > 0) {
                    objectivesText += mod.associatedObjectiveIds
                        .map(id => {
                            const o = currentLS.objectives.find(obj => obj.id === id);
                            return o ? `(LObj: ${o.text})` : '';
                        })
                        .filter(Boolean)
                        .join(', ');
                } else {
                    objectivesText += 'None';
                }
                matrixBody.push([{
                    content: objectivesText,
                    colSpan: 1 + activeModes.length + 3,
                    styles: { textColor: [100, 100, 100], fontSize: 7, fontStyle: 'italic' as const }
                }]);

                // 4. Contents
                if (mod.contents.length === 0) {
                    const emptyRow: any[] = [{ content: '(No Content)', styles: { textColor: [150, 150, 150], fontStyle: 'italic' as const } }];
                    for (let i = 0; i < activeModes.length; i++) emptyRow.push('');
                    emptyRow.push('');
                    emptyRow.push('');
                    emptyRow.push('');
                    matrixBody.push(emptyRow);
                } else {
                    mod.contents.forEach((c, cIdx) => {
                        const createRow = (item: LSContent, label: string) => {
                            const row: any[] = [];
                            row.push({ content: `${label} ${item.title}`, styles: { fontSize: 8 } });

                            activeModes.forEach(mode => {
                                if (item.deliveryModes.includes(mode)) {
                                    const linkUrl = item.deliveryLinks[mode];
                                    row.push({
                                        content: '\u2713',
                                        styles: {
                                            halign: 'center' as const,
                                            font: 'Roboto',
                                            fontStyle: 'normal' as const,
                                            fontSize: 12,
                                            fillColor: CHECK_BG,
                                            textColor: linkUrl ? [0, 0, 200] : [0, 0, 0],
                                        }
                                    });
                                } else {
                                    row.push('');
                                }
                            });

                            row.push({ content: `${item.duration} min`, styles: { halign: 'center' as const, fontSize: 8 } });
                            row.push('');
                            row.push('');
                            return row;
                        };

                        matrixBody.push(createRow(c, `${modIdx + 1}.${cIdx + 1}`));

                        if (c.subContents) {
                            c.subContents.forEach((sub, sIdx) => {
                                matrixBody.push(createRow(sub, `  ${modIdx + 1}.${cIdx + 1}.${sIdx + 1}`));
                            });
                        }
                    });
                }
            });

            const mainHead = [
                [
                    { content: 'MODULES', styles: { halign: 'center' as const, fontStyle: 'bold' as const } },
                    { content: 'DELIVERY MODES', colSpan: activeModes.length, styles: { halign: 'center' as const, fontStyle: 'bold' as const } },
                    { content: 'DURATION', styles: { halign: 'center' as const, fontStyle: 'bold' as const } },
                    { content: 'ASSESSMENT', styles: { halign: 'center' as const, fontStyle: 'bold' as const } },
                    { content: 'LEARNING OUTCOMES', styles: { halign: 'center' as const, fontStyle: 'bold' as const } }
                ]
            ];

            autoTable(doc, {
                startY: 28,
                head: mainHead,
                body: matrixBody,
                theme: 'grid',
                headStyles: {
                    font: 'Roboto',
                    fillColor: ITU_BLUE,
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 9,
                    cellPadding: 3,
                },
                styles: {
                    font: 'Roboto',
                    fontSize: 8,
                    lineWidth: 0.3,
                    lineColor: [0, 0, 0],
                    overflow: 'linebreak',
                    cellPadding: 2,
                },
                columnStyles: {
                    0: { cellWidth: 45 },
                    [1 + activeModes.length]: { cellWidth: 16 }, // Duration
                    [1 + activeModes.length + 1]: { cellWidth: 28 }, // Assessment
                    [1 + activeModes.length + 2]: { cellWidth: 28 }, // Outcome
                },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index > 0 && data.column.index <= activeModes.length) {
                        data.cell.styles.cellWidth = 7;
                    }
                }
            });

            doc.save(`Toolkit1-LS-${currentLS.code || 'Draft'}.pdf`);

        } catch (err) {
            console.error("PDF Error:", err);
            alert("Could not generate PDF: " + err);
        } finally {
            setDownloading(false);
        }
    };

    const downloadFile = (type: 'html' | 'doc') => {
        const content = generateHtmlContent();
        const mimeType = type === 'html' ? 'text/html' : 'application/msword';
        const extension = type === 'html' ? 'html' : 'doc';
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `LS-${currentLS.code || 'Draft'}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-itu-blue print:text-black">4. LS Output</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={() => downloadFile('html')}
                        className="flex items-center px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-sm font-medium shadow-sm"
                    >
                        <FileCode className="w-4 h-4 mr-2" />
                        HTML
                    </button>
                    <button
                        onClick={() => downloadFile('doc')}
                        className="flex items-center px-3 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition-colors text-sm font-medium shadow-sm"
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Word (DOC)
                    </button>
                    <button
                        onClick={downloadPDF}
                        disabled={downloading}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium shadow-sm"
                    >
                        {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                        Download PDF
                    </button>
                </div>
            </div>

            <div className="p-8 bg-slate-50 border border-slate-200 text-center rounded mb-8">
                <p className="text-slate-600 mb-4">
                    Your design is ready! Use the buttons above to download. Below is a <strong>live preview</strong> of the document.
                </p>
            </div>

            {/* --- PREVIEW SECTION --- */}
            <div className="border border-slate-300 shadow-lg bg-white p-8 overflow-auto max-h-[800px] font-sans">
                <h1 className="text-2xl font-bold text-center text-itu-blue mb-2 font-sans">LEARNING STATION DESIGN</h1>
                <h2 className="text-xl font-bold text-center text-itu-blue mb-6 font-sans">INFORMATION TABLE</h2>

                {/* Info Table */}
                <table className="w-full border-collapse border border-black mb-8 text-sm font-sans">
                    <tbody>
                        {getInfoTableData().map(([label, value], i) => (
                            <tr key={i}>
                                <td className="border border-black p-2 bg-slate-50 font-bold w-1/3">{label}</td>
                                <td className="border border-black p-2 whitespace-pre-wrap">{value}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <h2 className="text-xl font-bold text-center text-itu-blue mb-6 font-sans">LS MATRIX</h2>

                {/* Matrix Table */}
                <table className="w-full border-collapse border border-black text-xs font-sans">
                    <thead>
                        <tr className="bg-slate-100">
                            <th className="border border-black p-2 w-32">MODULES</th>
                            <th className="border border-black p-2" colSpan={activeModes.length}>DELIVERY MODES</th>
                            <th className="border border-black p-2 w-16">Duration</th>
                            <th className="border border-black p-2 w-24">Assessment</th>
                            <th className="border border-black p-2 w-24">Outcomes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentLS.modules.map((mod, modIdx) => (
                            <React.Fragment key={mod.id}>
                                {/* 1. Module Title Row (assessment + outcome inline) */}
                                <tr className="bg-slate-200 font-bold">
                                    <td className="border border-black p-2" colSpan={1 + activeModes.length + 1}>Module {modIdx + 1}: {mod.title}</td>
                                    <td className="border border-black p-2 text-center text-[10px]">{mod.assessmentMethods?.join(', ')}</td>
                                    <td className="border border-black p-2 text-center text-[10px]">{mod.learningOutcome}</td>
                                </tr>

                                {/* 2. Headers Row */}
                                <tr className="bg-slate-50 text-slate-600 text-[10px]">
                                    <td className="border border-black p-1 text-right italic">Content Title</td>
                                    {activeModes.map(mode => (
                                        <td key={mode} className="border border-black p-1 text-center font-bold relative h-28">
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                                                <span className="text-blue-600 flex-shrink-0">{DELIVERY_MODE_ICONS[mode]}</span>
                                                <span className="text-[8px] leading-tight" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{DELIVERY_MODE_LABELS[mode]}</span>
                                            </div>
                                        </td>
                                    ))}
                                    <td className="border border-black p-1 text-center italic">Duration</td>
                                    <td className="border border-black p-1"></td>
                                    <td className="border border-black p-1"></td>
                                </tr>

                                {/* 3. Objectives Row */}
                                <tr>
                                    <td className="border border-black p-2 italic text-slate-500" colSpan={1 + activeModes.length + 3}>
                                        Related Objectives: {mod.associatedObjectiveIds.map(id => {
                                            const o = currentLS.objectives.find(x => x.id === id);
                                            return o ? `(LObj: ${o.text})` : '';
                                        }).join(', ') || 'None'}
                                    </td>
                                </tr>

                                {/* 4. Contents — each row with its own duration */}
                                {mod.contents.length === 0 ? (
                                    <tr><td className="border border-black p-2" colSpan={activeModes.length + 4}>(No Content)</td></tr>
                                ) : (
                                    mod.contents.map((content, cIdx) => (
                                        <React.Fragment key={content.id}>
                                            <tr>
                                                <td className="border border-black p-1 pl-2">{modIdx + 1}.{cIdx + 1} {content.title}</td>
                                                {activeModes.map(mode => (
                                                    <td key={mode} className={`border border-black p-1 text-center ${content.deliveryModes.includes(mode) ? 'bg-blue-50 font-bold' : ''}`}>
                                                        {content.deliveryModes.includes(mode) ? '✓' : ''}
                                                    </td>
                                                ))}
                                                <td className="border border-black p-1 text-center">{content.duration} min</td>
                                                <td className="border border-black p-1"></td>
                                                <td className="border border-black p-1"></td>
                                            </tr>
                                            {content.subContents?.map((sub, sIdx) => (
                                                <tr key={sub.id}>
                                                    <td className="border border-black p-1 pl-4 text-slate-600">{modIdx + 1}.{cIdx + 1}.{sIdx + 1} {sub.title}</td>
                                                    {activeModes.map(mode => (
                                                        <td key={mode} className={`border border-black p-1 text-center ${sub.deliveryModes.includes(mode) ? 'bg-blue-50 font-bold' : ''}`}>
                                                            {sub.deliveryModes.includes(mode) ? '✓' : ''}
                                                        </td>
                                                    ))}
                                                    <td className="border border-black p-1 text-center">{sub.duration} min</td>
                                                    <td className="border border-black p-1"></td>
                                                    <td className="border border-black p-1"></td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};