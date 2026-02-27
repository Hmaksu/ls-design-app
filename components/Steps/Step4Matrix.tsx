import React, { useMemo } from 'react';
import { LSContextType, LSContent, DeliveryModeType } from '../../types';
import { FileDown, Loader2, FileCode, FileText, Printer, Save, Download } from 'lucide-react';
import { DELIVERY_MODE_LABELS, DELIVERY_MODE_ICONS } from '../../constants';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
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
            [t('step4.code'), currentLS.code],
            [t('step4.infoTitle'), currentLS.title],
            [t('step4.subject'), currentLS.subject],
            [t('step4.level'), currentLS.level === 'Basic' ? t('step1.levelBasic') : currentLS.level === 'Intermediate' ? t('step1.levelInter') : currentLS.level === 'Advanced' ? t('step1.levelAdv') : currentLS.level],
            [t('step4.ects'), currentLS.ects],
            [t('step4.dates'), `${t('step4.design')}: ${currentLS.initialDesignDate} | ${t('step4.revision')}: ${currentLS.finalRevisionDate}`],
            [t('step4.keywords'), currentLS.keywords],
            [t('step4.targetAudience'), currentLS.targetAudience],
            [t('step4.shortDesc'), currentLS.description],
            [t('step4.learningObj'), currentLS.objectives.map((o, i) => `${i + 1}. ${o.text}`).join('\n')],
            [t('step4.globalOutcomes'), currentLS.globalLearningOutcomes],
            [t('step4.relatedSDGs'), (currentLS.relatedSDGs || '').split(',').map(s => s.trim()).filter(Boolean).map(sdg => t(`sdgs.${sdg.split('.')[0]}` as any) || sdg).join('\n')],
            [t('step4.assessmentMethods'), currentLS.globalAssessmentMethods],
            [t('step4.calendar'), currentLS.calendar],
            [t('step4.duration'), `${t('step4.inPerson')}: ${currentLS.durationInPerson} ${t('step4.hours')}\n${t('step4.digital')}: ${currentLS.durationDigital} ${t('step4.hours')}`],
            [t('step4.prerequisites'), currentLS.prerequisites],
            [t('step4.specialNeeds'), currentLS.specialNeeds],
            [t('step4.materials'), currentLS.materialsAndResources],
            [t('step4.quota'), currentLS.quota],
            [t('step4.language'), currentLS.language],
            [t('step4.notes'), currentLS.notes]
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
        <h1>${t('step4.lsDesign')}</h1>
        <h2>${t('step4.infoTable')}</h2>
        
        <!-- Table 1 -->
        <table>
            <col style="width: 30%">
            <col style="width: 70%">
            <thead>
                <tr>
                    <th>${t('step4.field')}</th>
                    <th>${t('step4.value')}</th>
                </tr>
            </thead>
            <tbody>
                ${infoRows}
            </tbody>
        </table>

        <h2>${t('step4.lsMatrix')}</h2>
        `;

        currentLS.modules.forEach((mod, modIdx) => {
            const activeModes = getActiveModesForModule(mod);
            const modeHeaders = activeModes.map(mode =>
                `<th class="center" style="font-size: 9px; padding: 2px; writing-mode: vertical-rl; transform: rotate(180deg);">${t(`deliveryModes.${mode}` as any) || DELIVERY_MODE_LABELS[mode]}</th>`
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
                        <th>${t('step4.module')} ${modIdx + 1}</th>
                        <th colspan="${activeModes.length}">${t('step4.deliveryModes')}</th>
                        <th>${t('step4.duration')}</th>
                        <th>${t('step4.assessment')}</th>
                        <th>${t('step4.outcomes')}</th>
                    </tr>
                </thead>
                <tbody>
            `;

            // 1. Module Title Row (with assessment + outcome inline)
            html += `
            <tr class="module-row">
                <td colspan="${1 + activeModes.length + 1}">${t('step4.module')} ${modIdx + 1}: ${mod.title}</td>
                <td style="background-color: #e6e6e6; font-weight: bold; text-align: center;">${mod.assessmentMethods?.join(', ') || ''}</td>
                <td style="background-color: #e6e6e6; font-weight: bold; text-align: center;">${mod.learningOutcome || ''}</td>
            </tr>
            `;

            // 1.5 Sub-Headers (now repeated per module)
            html += `
            <tr class="mode-header-row">
                <td class="center"><i>${t('step4.contentTitle')}</i></td>
                ${modeHeaders}
                <td class="center"><i>${t('step4.duration')}</i></td>
                <td class="center"><i>${t('step4.assessment')}</i></td>
                <td class="center"><i>${t('step4.outcomes')}</i></td>
            </tr>
            `;

            // 2. Objectives
            let objectivesText = `${t('step4.relatedObjectives')}: `;
            if (mod.associatedObjectiveIds && mod.associatedObjectiveIds.length > 0) {
                objectivesText += mod.associatedObjectiveIds
                    .map(id => {
                        const o = currentLS.objectives.find(obj => obj.id === id);
                        return o ? `(LObj: ${o.text})` : '';
                    })
                    .join(', ');
            } else {
                objectivesText += t('step4.none');
            }

            html += `
            <tr>
                <td colspan="${1 + activeModes.length + 3}" class="italic">${objectivesText}</td>
            </tr>
            `;

            // 3. Contents — each row has its own duration
            if (mod.contents.length === 0) {
                html += `<tr><td colspan="${activeModes.length + 4}">(${t('step4.noContent')})</td></tr>`;
            } else {
                // Calculate total rows for rowSpan
                let totalRows = 0;
                mod.contents.forEach(c => {
                    totalRows++;
                    if (c.subContents) {
                        c.subContents.forEach(s => {
                            totalRows++;
                            if (s.subContents) totalRows += s.subContents.length;
                        });
                    }
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

                    row += `<td class="center">${item.duration ? `${item.duration} min` : '-'}</td>`;

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
                            if (sub.subContents) {
                                sub.subContents.forEach((subSub, ssIdx) => {
                                    html += createRowHtml(subSub, `${modIdx + 1}.${cIdx + 1}.${sIdx + 1}.${ssIdx + 1}`);
                                });
                            }
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
                    <h2 className="text-xl font-bold text-slate-800">{t('step4.title')}</h2>
                    <p className="text-sm text-slate-500">{t('step4.subtitle')}</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* PUBLISH TOGGLE */}
                    {context.role === 'owner' && (
                        <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                            <span className={`text-sm font-medium ${currentLS.isPublished ? 'text-emerald-700' : 'text-slate-600'}`}>
                                {currentLS.isPublished ? t('step4.public') : t('step4.private')}
                            </span>
                            <button
                                onClick={() => {
                                    context.updateLS({ isPublished: !currentLS.isPublished });
                                }}
                                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${currentLS.isPublished ? 'bg-emerald-500' : 'bg-slate-300'
                                    }`}
                                title={currentLS.isPublished ? t('step4.makePrivate') : t('step4.publishConf')}
                            >
                                <span
                                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${currentLS.isPublished ? 'translate-x-5' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    )}

                </div>
            </div >

            <div className="p-8 bg-slate-50 border border-slate-200 text-center rounded mb-8 print:hidden">
                <p className="text-slate-600 mb-4" dangerouslySetInnerHTML={{ __html: t('step4.previewDesc') }} />
            </div>

            {/* --- PREVIEW SECTION (Printable Area) --- */}
            <div className="border border-slate-300 shadow-lg bg-slate-200 p-8 overflow-auto max-h-[800px] print:max-h-none print:shadow-none print:border-none print:bg-white print:p-0 print:overflow-visible">
                <div id="pdf-preview-container" className="bg-white p-10 font-sans shadow-sm print:shadow-none print:p-0" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h1 className="text-2xl font-bold text-center text-itu-blue mb-2 font-sans tracking-wide">{t('step4.lsDesign')}</h1>
                    <h2 className="text-xl font-bold text-center text-itu-blue mb-8 font-sans">{t('step4.infoTable')}</h2>

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

                    <h2 className="text-xl font-bold text-center text-itu-blue mb-8 font-sans">{t('step4.lsMatrix')}</h2>

                    {/* Matrix Tables - Each module is an isolated table */}
                    {currentLS.modules.length === 0 && <div className="text-center italic text-slate-500 py-4">{t('step4.noModules')}</div>}

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
                                            <th className="border border-black p-2 tracking-wider text-left">{t('step4.module').toUpperCase()} {modIdx + 1}</th>
                                            <th className="border border-black p-2 tracking-wider bg-slate-200" colSpan={activeModes.length}>{t('step4.deliveryModes').toUpperCase()}</th>
                                            <th className="border border-black p-2 tracking-wider">{t('step4.duration')}</th>
                                            <th className="border border-black p-2 tracking-wider">{t('step4.assessment')}</th>
                                            <th className="border border-black p-2 tracking-wider">{t('step4.outcomes')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* 1. Module Title Row */}
                                        <tr className="bg-slate-200 font-bold border-t-[3px] border-black">
                                            <td className="border border-black p-2 uppercase text-center" colSpan={1 + activeModes.length + 3}>{mod.title || t('step3.untitledContent')}</td>
                                        </tr>

                                        {/* 2. Headers Row */}
                                        <tr className="bg-slate-50 text-slate-600 text-[10px]">
                                            <td className="border border-black p-1 text-right italic font-medium">{t('step4.contentTitle')}</td>
                                            {activeModes.map(mode => (
                                                <td key={mode} className="border border-black p-1 text-center font-bold relative h-12" title={t(`deliveryModes.${mode}` as any) || DELIVERY_MODE_LABELS[mode]}>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="text-blue-600">{DELIVERY_MODE_ICONS[mode]}</span>
                                                    </div>
                                                </td>
                                            ))}
                                            <td className="border border-black p-1 text-center italic font-medium">{t('step4.duration')}</td>
                                            <td className="border border-black p-1 text-center italic font-medium">{t('step4.assessment')}</td>
                                            <td className="border border-black p-1 text-center italic font-medium">{t('step4.outcomes')}</td>
                                        </tr>

                                        {/* 3. Objectives Row */}
                                        <tr>
                                            <td className="border border-black p-2 italic text-slate-600 bg-slate-50/50" colSpan={1 + activeModes.length + 3}>
                                                <span className="font-semibold mr-1">{t('step4.relatedObjectives')}:</span>
                                                {mod.associatedObjectiveIds.length > 0 ? mod.associatedObjectiveIds.map(id => {
                                                    const o = currentLS.objectives.find(x => x.id === id);
                                                    return o ? `[LObj: ${o.text}]` : '';
                                                }).join(' • ') : t('step4.none')}
                                            </td>
                                        </tr>

                                        {/* 4. Contents */}
                                        {mod.contents.length === 0 ? (
                                            <tr>
                                                <td className="border border-black p-3 text-slate-400 italic text-center" colSpan={activeModes.length + 2}>({t('step4.noContent')})</td>
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
                                                        <td className="border border-black p-2 text-center whitespace-nowrap">{content.duration ? `${content.duration} min` : '-'}</td>
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
                                                        <React.Fragment key={sub.id}>
                                                            <tr>
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
                                                                <td className="border border-black p-1 text-center whitespace-nowrap text-slate-600">{sub.duration ? `${sub.duration} min` : '-'}</td>
                                                            </tr>
                                                            {sub.subContents?.map((subSub, ssIdx) => (
                                                                <tr key={subSub.id}>
                                                                    <td className="border border-black p-1 pl-10 text-slate-500 italic border-l-4 border-l-slate-200">{modIdx + 1}.{cIdx + 1}.{sIdx + 1}.{ssIdx + 1} {subSub.title}</td>
                                                                    {activeModes.map(mode => {
                                                                        const hasMode = subSub.deliveryModes.includes(mode);
                                                                        const linkUrl = subSub.deliveryLinks?.[mode];
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
                                                                    <td className="border border-black p-1 text-center whitespace-nowrap text-slate-500">{subSub.duration ? `${subSub.duration} min` : '-'}</td>
                                                                </tr>
                                                            ))}
                                                        </React.Fragment>
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

            {/* --- BOTTOM EXPORT ACTIONS --- */}
            <div className="mt-8 flex flex-col sm:flex-row justify-between items-center print:hidden border-t border-slate-200 pt-6 gap-4">
                <div className="flex gap-3">
                    {context.role !== 'viewer' && (
                        <button
                            onClick={context.saveLS}
                            className="flex items-center gap-2 bg-itu-gold hover:bg-yellow-600 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm"
                        >
                            <Save className="w-4 h-4" />
                            {t('buttons.saveServer')}
                        </button>
                    )}
                    <button
                        onClick={() => {
                            const json = JSON.stringify(currentLS, null, 2);
                            const blob = new Blob([json], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `LS-${currentLS.code || 'Draft'}.json`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                        }}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        {t('buttons.saveJson')}
                    </button>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => downloadFile('html')}
                        className="flex items-center gap-2 bg-[#ea580c] hover:bg-[#c2410c] text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm"
                    >
                        <FileCode className="w-4 h-4" />
                        {t('step4.html')}
                    </button>
                    <button
                        onClick={() => downloadFile('doc')}
                        className="flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm"
                    >
                        <FileText className="w-4 h-4" />
                        {t('step4.word')}
                    </button>
                    <button
                        onClick={downloadPDF}
                        disabled={downloading}
                        className="flex items-center gap-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm"
                        title={t('step4.printTitle')}
                    >
                        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                        {downloading ? t('step4.preparing') : t('step4.downloadPDF')}
                    </button>
                </div>
            </div>
        </div >
    );
};