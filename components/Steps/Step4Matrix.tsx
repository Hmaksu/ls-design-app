import React, { useMemo } from 'react';
import { LSContextType, LSContent, DeliveryModeType } from '../../types';
import { FileDown, Loader2, FileCode, FileText, Printer } from 'lucide-react';
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

    // --- 1. Dynamic Modes Logic (Per Module) ---
    const getActiveModesForModule = (mod: any) => {
        const used = new Set<DeliveryModeType>();
        mod.contents.forEach((c: any) => {
            c.deliveryModes.forEach((m: DeliveryModeType) => used.add(m));
            if (c.subContents) {
                c.subContents.forEach((s: any) => s.deliveryModes.forEach((m: DeliveryModeType) => used.add(m)));
            }
        });

        const usedArray = ALL_MODES_REF.filter(m => used.has(m));

        if (usedArray.length >= 5) {
            return usedArray;
        }

        // We need padding up to 5. Get unused ones and pick random ones to fill the gap.
        const unusedArray = ALL_MODES_REF.filter(m => !used.has(m));
        const shuffledUnused = [...unusedArray].sort(() => 0.5 - Math.random());
        const needed = 5 - usedArray.length;
        const paddedArray = [...usedArray, ...shuffledUnused.slice(0, needed)];

        // Return sorted based on original order
        return ALL_MODES_REF.filter(m => paddedArray.includes(m));
    };

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
        const infoRows = getInfoTableData().map(([label, value]) => `
        <tr>
            <td style="background-color: #f9f9f9; font-weight: bold; width: 30%;">${label}</td>
            <td>${typeof value === 'string' ? value.replace(/\n/g, '<br>') : value}</td>
        </tr>
        `).join('');

        let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
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
        `;

        currentLS.modules.forEach((mod, modIdx) => {
            const activeModes = getActiveModesForModule(mod);
            const modeHeaders = activeModes.map(mode =>
                `<th class="center" style="font-size: 9px; padding: 2px; writing-mode: vertical-rl; transform: rotate(180deg);">${DELIVERY_MODE_LABELS[mode]}</th>`
            ).join('');

            html += `
            <!-- Table for Module ${modIdx + 1} -->
            <table>
                <col style="width: 15%"> <!-- Title -->
                ${activeModes.map(() => `<col style="width: 2.5%">`).join('')} 
                <col style="width: 5%"> <!-- Duration -->
                <col style="width: 15%"> <!-- Assessment -->
                <col style="width: 15%"> <!-- Outcomes -->

                <thead>
                    <tr>
                        <th>MODULE ${modIdx + 1}</th>
                        <th colspan="${activeModes.length}">DELIVERY MODES</th>
                        <th>Duration</th>
                        <th>Assessment</th>
                        <th>Learning Outcomes</th>
                    </tr>
                </thead>
                <tbody>
            `;

            // 1. Module Title Row (with assessment + outcome inline)
            html += `
            <tr class="module-row">
                <td colspan="${1 + activeModes.length + 1}">Module ${modIdx + 1}: ${mod.title}</td>
                <td style="background-color: #e6e6e6; font-weight: bold; text-align: center;">${mod.assessmentMethods?.join(', ') || ''}</td>
                <td style="background-color: #e6e6e6; font-weight: bold; text-align: center;">${mod.learningOutcome || ''}</td>
            </tr>
            `;

            // 1.5 Sub-Headers (now repeated per module)
            html += `
            <tr class="mode-header-row">
                <td class="center"><i>Content Title</i></td>
                ${modeHeaders}
                <td class="center"><i>Duration</i></td>
                <td class="center"><i>Assessment</i></td>
                <td class="center"><i>Outcomes</i></td>
            </tr>
            `;

            // 2. Objectives
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

            // 3. Contents — each row has its own duration
            if (mod.contents.length === 0) {
                html += `<tr><td colspan="${activeModes.length + 4}">(No Content)</td></tr>`;
            } else {
                // Calculate total rows for rowSpan
                let totalRows = 0;
                mod.contents.forEach(c => {
                    totalRows++;
                    if (c.subContents) totalRows += c.subContents.length;
                });

                let isFirstContentRow = true;

                const createRowHtml = (item: LSContent, label: string) => {
                    let row = `<tr>`;
                    row += `<td>${label} ${item.title}</td>`;

                    activeModes.forEach(mode => {
                        const hasMode = item.deliveryModes.includes(mode);
                        let cellContent = '';
                        if (hasMode) {
                            const linkUrl = item.deliveryLinks[mode];
                            cellContent = linkUrl
                                ? `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer"><b>&#10003;</b></a>`
                                : `<b>&#10003;</b>`;
                        }
                        row += `<td class="center check" style="background-color: ${hasMode ? '#e6f3ff' : 'transparent'}">${cellContent}</td>`;
                    });

                    row += `<td class="center">${item.duration} min</td>`;

                    if (isFirstContentRow) {
                        row += `<td rowspan="${totalRows}" class="center">${mod.assessmentMethods?.join(', ') || ''}</td>`;
                        row += `<td rowspan="${totalRows}" class="center">${mod.learningOutcome || ''}</td>`;
                        isFirstContentRow = false;
                    }

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

            html += `
                </tbody>
            </table>
            `;
        });

        html += `
    </body>
    </html>
    `;
        return html;
    };

    // --- Print to PDF (Native Browser Print) ---
    const downloadPDF = () => {
        // We will trigger the browser's native print dialog
        // The user can choose "Save as PDF" there.
        // This ensures pixel-perfect rendering of the CSS with selectable text.
        window.print();
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
            {/* Print Styles for PDF Export */}
            <style type="text/css" media="print">
                {`@page { size: A3 portrait !important; margin: 0 !important; width: 100% !important; padding: 0 !important;}
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact;margin: 0 !important; }
                    body * { visibility: hidden !important; }
                    #pdf-preview-container * { visibility: visible !important; }
                    #pdf-preview-container { padding: 1mm !important;  width: 90% !important;position: absolute; margin: 1% !important;top: 5%; left:5%;right:5%;bottom:5%;}
                `}
            </style>

            {/* --- TOP BAR ACTIONS --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 print:hidden">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Export & Finalize</h2>
                    <p className="text-sm text-slate-500">Download your Learning Station Matrix as HTML, DOC, or print natively to PDF.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* PUBLISH TOGGLE */}
                    {context.role === 'owner' && (
                        <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                            <span className={`text-sm font-medium ${currentLS.isPublished ? 'text-emerald-700' : 'text-slate-600'}`}>
                                {currentLS.isPublished ? 'Public' : 'Private'}
                            </span>
                            <button
                                onClick={() => {
                                    context.updateLS({ isPublished: !currentLS.isPublished });
                                }}
                                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${currentLS.isPublished ? 'bg-emerald-500' : 'bg-slate-300'
                                    }`}
                                title={currentLS.isPublished ? "Make private" : "Publish to community"}
                            >
                                <span
                                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${currentLS.isPublished ? 'translate-x-5' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    )}

                    <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => downloadFile('html')}
                            className="flex items-center gap-2 bg-[#ea580c] hover:bg-[#c2410c] text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm"
                        >
                            <FileCode className="w-4 h-4" />
                            HTML
                        </button>
                        <button
                            onClick={() => downloadFile('doc')}
                            className="flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm"
                        >
                            <FileText className="w-4 h-4" />
                            Word (DOC)
                        </button>
                        <button
                            onClick={downloadPDF}
                            disabled={downloading}
                            className="flex items-center gap-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm"
                            title="Prints the current view. Select 'Save as PDF' as the destination."
                        >
                            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                            {downloading ? 'Preparing...' : 'Download PDF'}
                        </button>
                    </div>
                </div>
            </div >

            <div className="p-8 bg-slate-50 border border-slate-200 text-center rounded mb-8 print:hidden">
                <p className="text-slate-600 mb-4">
                    Your design is ready! Use the buttons above to download. Below is a <strong>live preview</strong> of the document.
                </p>
            </div>

            {/* --- PREVIEW SECTION (Printable Area) --- */}
            <div className="border border-slate-300 shadow-lg bg-slate-200 p-8 overflow-auto max-h-[800px] print:max-h-none print:shadow-none print:border-none print:bg-white print:p-0 print:overflow-visible">
                <div id="pdf-preview-container" className="bg-white p-10 font-sans shadow-sm print:shadow-none print:p-0" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h1 className="text-2xl font-bold text-center text-itu-blue mb-2 font-sans tracking-wide">LEARNING STATION DESIGN</h1>
                    <h2 className="text-xl font-bold text-center text-itu-blue mb-8 font-sans">INFORMATION TABLE</h2>

                    {/* Info Table */}
                    <table className="w-full border-collapse border border-black mb-12 text-sm font-sans">
                        <tbody>
                            {getInfoTableData().map(([label, value], i) => (
                                <tr key={i}>
                                    <td className="border border-black p-2 bg-slate-50 font-bold w-1/3">{label}</td>
                                    <td className="border border-black p-2 whitespace-pre-wrap">{value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <h2 className="text-xl font-bold text-center text-itu-blue mb-8 font-sans">LS MATRIX</h2>

                    {/* Matrix Tables - Each module is an isolated table */}
                    {currentLS.modules.length === 0 && <div className="text-center italic text-slate-500 py-4">No modules designed yet.</div>}

                    {currentLS.modules.map((mod, modIdx) => {
                        const activeModes = getActiveModesForModule(mod);
                        let totalRows = 0;
                        mod.contents.forEach(c => {
                            totalRows++;
                            if (c.subContents) totalRows += c.subContents.length;
                        });
                        let isFirstRowForAssessment = true;
                        // Calculate equal width for mode columns (e.g. if 5 modes, each gets same share)
                        const modeColWidth = `${40 / Math.max(1, activeModes.length)}%`;

                        return (
                            <div key={mod.id} className="mb-12 break-inside-avoid">
                                <table className="w-full border-collapse border border-black text-xs font-sans table-fixed">
                                    <colgroup>
                                        <col style={{ width: '25%' }} /> {/* Content Title */}
                                        {activeModes.map(mode => (
                                            <col key={mode} style={{ width: modeColWidth }} />
                                        ))}
                                        <col style={{ width: '8%' }} />  {/* Duration */}
                                        <col style={{ width: '13%' }} /> {/* Assessment */}
                                        <col style={{ width: '14%' }} /> {/* Outcomes */}
                                    </colgroup>
                                    <thead>
                                        <tr className="bg-slate-100">
                                            <th className="border border-black p-2 tracking-wider text-left">MODULE {modIdx + 1}</th>
                                            <th className="border border-black p-2 tracking-wider bg-slate-200" colSpan={activeModes.length}>DELIVERY MODES</th>
                                            <th className="border border-black p-2 tracking-wider">Duration</th>
                                            <th className="border border-black p-2 tracking-wider">Assessment</th>
                                            <th className="border border-black p-2 tracking-wider">Outcomes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* 1. Module Title Row */}
                                        <tr className="bg-slate-200 font-bold border-t-[3px] border-black">
                                            <td className="border border-black p-2 uppercase text-center" colSpan={1 + activeModes.length + 3}>{mod.title || 'Untitled Module'}</td>
                                        </tr>

                                        {/* 2. Headers Row */}
                                        <tr className="bg-slate-50 text-slate-600 text-[10px]">
                                            <td className="border border-black p-1 text-right italic font-medium">Content Title</td>
                                            {activeModes.map(mode => (
                                                <td key={mode} className="border border-black p-1 text-center font-bold relative h-12" title={DELIVERY_MODE_LABELS[mode]}>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="text-blue-600">{DELIVERY_MODE_ICONS[mode]}</span>
                                                    </div>
                                                </td>
                                            ))}
                                            <td className="border border-black p-1 text-center italic font-medium">Duration</td>
                                            <td className="border border-black p-1 text-center italic font-medium">Assessment</td>
                                            <td className="border border-black p-1 text-center italic font-medium">Outcomes</td>
                                        </tr>

                                        {/* 3. Objectives Row */}
                                        <tr>
                                            <td className="border border-black p-2 italic text-slate-600 bg-slate-50/50" colSpan={1 + activeModes.length + 3}>
                                                <span className="font-semibold mr-1">Related Objectives:</span>
                                                {mod.associatedObjectiveIds.length > 0 ? mod.associatedObjectiveIds.map(id => {
                                                    const o = currentLS.objectives.find(x => x.id === id);
                                                    return o ? `[LObj: ${o.text}]` : '';
                                                }).join(' • ') : 'None specified'}
                                            </td>
                                        </tr>

                                        {/* 4. Contents */}
                                        {mod.contents.length === 0 ? (
                                            <tr>
                                                <td className="border border-black p-3 text-slate-400 italic text-center" colSpan={activeModes.length + 2}>(No Content)</td>
                                                <td className="border border-black p-2 text-center text-[10px] bg-slate-50/30">{mod.assessmentMethods?.join(', ') || '-'}</td>
                                                <td className="border border-black p-2 text-center text-[10px] bg-slate-50/30">{mod.learningOutcome || '-'}</td>
                                            </tr>
                                        ) : (
                                            mod.contents.map((content, cIdx) => (
                                                <React.Fragment key={content.id}>
                                                    <tr>
                                                        <td className="border border-black p-2 font-medium">{modIdx + 1}.{cIdx + 1} {content.title}</td>
                                                        {activeModes.map(mode => {
                                                            const hasMode = content.deliveryModes.includes(mode);
                                                            const linkUrl = content.deliveryLinks?.[mode];
                                                            return (
                                                                <td key={mode} className={`border border-black p-1 text-center align-middle ${hasMode ? 'bg-blue-50/60 font-bold' : ''}`}>
                                                                    {hasMode && (
                                                                        linkUrl ? (
                                                                            <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">✓</a>
                                                                        ) : (
                                                                            <span className="text-slate-800">✓</span>
                                                                        )
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="border border-black p-2 text-center whitespace-nowrap">{content.duration} min</td>
                                                        {isFirstRowForAssessment && (
                                                            <td rowSpan={totalRows} className="border border-black p-3 text-center align-middle text-[10px] break-words bg-slate-50/30">
                                                                {mod.assessmentMethods?.join(', ') || '-'}
                                                            </td>
                                                        )}
                                                        {isFirstRowForAssessment && (
                                                            <td rowSpan={totalRows} className="border border-black p-3 text-center align-middle text-[10px] break-words bg-slate-50/30">
                                                                {mod.learningOutcome || '-'}
                                                            </td>
                                                        )}
                                                    </tr>
                                                    {(() => { isFirstRowForAssessment = false; return null; })()}
                                                    {content.subContents?.map((sub, sIdx) => (
                                                        <tr key={sub.id}>
                                                            <td className="border border-black p-1.5 pl-6 text-slate-700 italic border-l-2 border-l-slate-300">{modIdx + 1}.{cIdx + 1}.{sIdx + 1} {sub.title}</td>
                                                            {activeModes.map(mode => {
                                                                const hasMode = sub.deliveryModes.includes(mode);
                                                                const linkUrl = sub.deliveryLinks?.[mode];
                                                                return (
                                                                    <td key={mode} className={`border border-black p-1 text-center align-middle ${hasMode ? 'bg-blue-50/60 font-bold' : ''}`}>
                                                                        {hasMode && (
                                                                            linkUrl ? (
                                                                                <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">✓</a>
                                                                            ) : (
                                                                                <span className="text-slate-800">✓</span>
                                                                            )
                                                                        )}
                                                                    </td>
                                                                );
                                                            })}
                                                            <td className="border border-black p-1 text-center whitespace-nowrap text-slate-600">{sub.duration} min</td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div >
    );
};