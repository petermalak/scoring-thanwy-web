// Centralized points criteria used across the app
// Each item has a machine-friendly key, display label, and numeric value

export const pointsOptions = [
  { key: 'mass', label: 'القداس — ٥٠ زغلول', value: 50 },
  { key: 'general_meeting', label: 'الاجتماع العام — ٢٠ زغلول', value: 20 },
  { key: 'private_meeting', label: 'الاجتماع الخاص — ٢٠ زغلول', value: 20 },
  { key: 'tasbeha', label: 'التسبحة — ٣٠ زغلول', value: 30 },
  { key: 'psalm_recitation', label: 'تسميع المزمور — ٢٠ زغلول', value: 20 },
  { key: 'participation', label: 'مشاركة — ١٠ زغلول', value: 10 },
];

// Mr. Zaghlol themed color palette
export const zaghlolTheme = {
  primary: '#A8E6CF', // Light mint green (Mr. Zaghlol's body)
  secondary: '#FFB6C1', // Light pink (cheeks)
  accent: '#2EC4B6', // Teal accent (replaces orange)
  background: '#E6F3FF', // Very light blue (background)
  surface: '#FFFFFF', // White
  text: '#2C3E50', // Dark blue-gray
  textSecondary: '#7F8C8D', // Medium gray
  success: '#27AE60', // Green
  warning: '#6C63FF', // Violet (replaces yellow/orange warnings)
  error: '#E74C3C', // Red
  borderRadius: '16px', // Rounded corners like Mr. Zaghlol
  borderRadiusSmall: '8px',
  borderRadiusLarge: '24px',
};

export default pointsOptions;


