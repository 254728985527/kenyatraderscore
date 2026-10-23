const icon = (color, glyph = '') =>
    `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="${color}"/>${glyph}</svg>`)}`;

export const defineContract = icon('#0b5c7d', '<path d="M8 10h16M8 16h16M8 22h10" stroke="white" stroke-width="2"/>');
export const blueInfo = icon('#3b82f6', '<circle cx="16" cy="16" r="8" fill="white"/><path d="M16 14v7M16 10v1" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"/>');
export const purchase = icon('#1683a8', '<path d="M8 16h16M18 10l6 6-6 6" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>');
export const sellContract = icon('#1683a8', '<path d="M8 16h16M14 10l-6 6 6 6" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>');
export const finishSign = icon('#1683a8', '<path d="m8 17 5 5 11-12" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>');
export const caution = icon('#f59e0b', '<path d="M16 7 26 25H6L16 7Z" fill="white"/><path d="M16 13v6M16 22v1" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>');
export const plusIconDark = icon('#e5e5e5', '<path d="M16 9v14M9 16h14" stroke="#222" stroke-width="3" stroke-linecap="round"/>');
export const plusIconLight = plusIconDark;
export const minusIconDark = icon('#e5e5e5', '<path d="M9 16h14" stroke="#222" stroke-width="3" stroke-linecap="round"/>');
export const lockIconDark = icon('#e5e5e5', '<rect x="9" y="14" width="14" height="11" rx="2" fill="#222"/><path d="M12 14v-3a4 4 0 0 1 8 0v3" fill="none" stroke="#222" stroke-width="2"/>');
