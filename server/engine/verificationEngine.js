import crypto from 'crypto';

export function computeDocHash(docType, fileName, declaredFields = {}) {
  const content = `${docType || ''}:${fileName || ''}:${JSON.stringify(declaredFields || {})}`;
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

export function normalizeAddress(addr = '') {
  return String(addr)
    .toLowerCase()
    .replace(/[.,\-\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractPlotNumber(addr = '') {
  const normalized = normalizeAddress(addr);
  const match = normalized.match(/plot\s*([0-9]+[a-z]?)/i);
  return match ? match[1] : null;
}

export function verifyDocumentSubmission(approval, docType, fileName, declaredFields = {}, masterProfile = {}, existingDocs = []) {
  const warnings = [];
  const registeredAddress = masterProfile?.address || 'Plot 14, GIDC Sachin, Surat';
  const registeredPan = masterProfile?.pan || 'AABCS1429B';

  const declaredAddress = declaredFields?.address || '';
  const declaredPan = declaredFields?.pan || '';
  const declaredUnitSize = declaredFields?.unitSize || '';

  // 1. Smart Address Normalization & Diffing
  if (declaredAddress) {
    const normDeclared = normalizeAddress(declaredAddress);
    const normMaster = normalizeAddress(registeredAddress);

    const plotDeclared = extractPlotNumber(declaredAddress);
    const plotMaster = extractPlotNumber(registeredAddress);

    const hasAreaMismatch =
      (normDeclared.includes('udhna') && !normMaster.includes('udhna')) ||
      (normDeclared.includes('sanand') && !normMaster.includes('sanand')) ||
      (normDeclared.includes('sachin') && !normMaster.includes('sachin')) ||
      (normDeclared.includes('ankleshwar') && !normMaster.includes('ankleshwar'));

    const hasPlotMismatch = plotDeclared && plotMaster && plotDeclared !== plotMaster;
    const isTotallyDifferent = normDeclared !== normMaster && !normDeclared.includes(normMaster) && !normMaster.includes(normDeclared);

    if (hasPlotMismatch || hasAreaMismatch || isTotallyDifferent) {
      warnings.push({
        field: 'address',
        doc1: docType,
        doc2: 'Master Industrial Profile (GIDC Allotment)',
        message: `Business address mismatch: Declared '${declaredAddress}' does not match registered allotment '${registeredAddress}'`,
        note: `Address on ${docType || 'document'} differs from your application. Fix it before submitting.`,
      });
    }
  }

  // 2. PAN & Format Verification
  if (declaredPan) {
    const upperPan = String(declaredPan).trim().toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(upperPan)) {
      warnings.push({
        field: 'pan',
        doc1: docType,
        doc2: 'Statutory PAN Verification',
        message: `Invalid Indian Income Tax PAN format: '${declaredPan}'. Expected 10 alphanumeric characters (e.g. AABCS1429B).`,
        note: 'Invalid PAN format. Please upload valid PAN document.',
      });
    } else if (registeredPan && upperPan !== registeredPan.trim().toUpperCase()) {
      warnings.push({
        field: 'pan',
        doc1: docType,
        doc2: 'Master Industrial Profile',
        message: `PAN mismatch: Declared '${declaredPan}' does not match company PAN '${registeredPan}'`,
        note: 'PAN does not match registered business PAN.',
      });
    }
  }

  // 3. Cross-Document Consistency against existing docs
  if (Array.isArray(existingDocs)) {
    for (const otherDoc of existingDocs) {
      if (otherDoc.docType === docType) continue;
      const otherFields = otherDoc.declaredFields || {};

      if (declaredAddress && otherFields.address) {
        if (normalizeAddress(declaredAddress) !== normalizeAddress(otherFields.address)) {
          warnings.push({
            field: 'address',
            doc1: docType,
            doc2: otherDoc.docType,
            message: `Address discrepancy between uploaded documents: '${declaredAddress}' in ${docType} vs '${otherFields.address}' in ${otherDoc.docType}`,
            note: `Discrepancy detected between ${docType} and ${otherDoc.docType}.`,
          });
        }
      }

      if (declaredUnitSize && otherFields.unitSize && declaredUnitSize !== otherFields.unitSize) {
        warnings.push({
          field: 'unitSize',
          doc1: docType,
          doc2: otherDoc.docType,
          message: `Unit area discrepancy: '${declaredUnitSize}' in ${docType} vs '${otherFields.unitSize}' in ${otherDoc.docType}`,
          note: `Built-up area mismatch between ${docType} and ${otherDoc.docType}.`,
        });
      }
    }
  }

  const docHash = computeDocHash(docType, fileName, declaredFields);

  return {
    ok: warnings.length === 0,
    warnings,
    docHash,
  };
}

