import React from 'react';
import { checkmark } from '../../assets/images/icons';

const GLYPH_LABEL_PATTERN = /\b(continue|publish|confirm|ok|update)\b/i;

const srOnlyStyles = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: 1,
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1,
};

export const shouldUseActionGlyph = (label = '') => GLYPH_LABEL_PATTERN.test(label);

const ActionButtonLabel = ({ label, size = 20 }) => {
  if (!shouldUseActionGlyph(label)) {
    return label;
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <img
        src={checkmark}
        alt=""
        aria-hidden="true"
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
      <span style={srOnlyStyles}>{label}</span>
    </span>
  );
};

export default ActionButtonLabel;
