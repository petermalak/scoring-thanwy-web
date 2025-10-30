// Centralized points criteria used across the app
// Each item has a machine-friendly key, display label, and numeric value

export const pointsOptions = [
  { key: 'mass', label: 'القداس — ٥٠ فليكس', value: 50 },
  { key: 'general_meeting', label: 'الاجتماع العام — ٢٠ فليكس', value: 20 },
  { key: 'private_meeting', label: 'الاجتماع الخاص — ٢٠ فليكس', value: 20 },
  { key: 'tasbeha', label: 'التسبحة — ٣٠ فليكس', value: 30 },
  { key: 'psalm_recitation', label: 'تسميع المزمور — ٢٠ فليكس', value: 20 },
  { key: 'participation', label: 'مشاركة — ١٠ فليكس', value: 10 },
];

// Store-themed color palette matching canopy red and wood tones
export const zaghlolTheme = {
  primary: '#D63C3C', // Canopy red
  secondary: '#F2D4A0', // Light wood/beige
  accent: '#8B5E3C', // Dark wood
  background: '#FFF8EE', // Warm background
  surface: '#FFFFFF', // White panels
  text: '#3E2F1C', // Dark brown
  textSecondary: '#7A6553', // Muted brown
  success: '#2E7D32', // Green
  warning: '#C77800', // Amber
  error: '#C62828', // Deep red
  borderRadius: '16px',
  borderRadiusSmall: '8px',
  borderRadiusLarge: '24px',
};

export default pointsOptions;


