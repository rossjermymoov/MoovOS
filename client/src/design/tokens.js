/**
 * Moov OS Design Tokens
 * Sourced from MoveNinja V2 Design Language & Product Brief
 */
export const colors = {
  bg: {
    primary: '#0A0B1E',
    secondary: '#14162A',
    surface: '#1A1D35',
    surfaceHover: '#20244A',
  },
  accent: {
    green: '#00C853',
    purple: '#7B2FBE',
    magenta: '#E91E8C',
    amber: '#FFC107',
    teal: '#00BCD4',
    greenDim: 'rgba(0,200,83,0.15)',
    magentaDim: 'rgba(233,30,140,0.15)',
    amberDim: 'rgba(255,193,7,0.15)',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#AAAAAA',
    dark: '#222222',
  },
  border: {
    subtle: 'rgba(255,255,255,0.08)',
    green: 'rgba(0,200,83,0.4)',
  },
};

/**
 * Health score → colour mapping
 * Spec Section 1.6: Green = healthy, Amber = warning, Red = at-risk
 * Design: Red maps to magenta (#E91E8C) per MoveNinja V2 status convention
 */
export const healthScoreColor = {
  green:  { bg: colors.accent.greenDim,   text: colors.accent.green,   border: colors.accent.green,   label: 'Healthy' },
  amber:  { bg: colors.accent.amberDim,   text: colors.accent.amber,   border: colors.accent.amber,   label: 'Warning' },
  red:    { bg: colors.accent.magentaDim, text: colors.accent.magenta, border: colors.accent.magenta, label: 'At Risk' },
};

export const accountStatusColor = {
  active:     { text: colors.accent.green,   bg: colors.accent.greenDim,   label: 'Active' },
  on_stop:    { text: colors.accent.magenta, bg: colors.accent.magentaDim, label: 'On Stop' },
  suspended:  { text: colors.accent.amber,   bg: colors.accent.amberDim,   label: 'Suspended' },
  churned:    { text: colors.text.secondary, bg: 'rgba(170,170,170,0.1)',  label: 'Churned' },
};

export const tierColor = {
  bronze:     { text: '#CD7F32', bg: 'rgba(205,127,50,0.15)' },
  silver:     { text: '#AAAAAA', bg: 'rgba(170,170,170,0.15)' },
  gold:       { text: colors.accent.amber,  bg: colors.accent.amberDim },
  enterprise: { text: colors.accent.purple, bg: 'rgba(123,47,190,0.15)' },
};
