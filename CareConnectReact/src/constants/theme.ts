// CareConnect design tokens — mirrors Flutter's CTokens / CScheme
export const tokens = {
  primary:          '#357C6F',
  primaryLight:     '#2F7A6B',
  caregiverPurple:  '#684BE6',
  danger:           '#C53030',
  planIndigo:       '#6366F1',
  white:            '#FFFFFF',
} as const;

export interface ColorScheme {
  bg:           string;
  surface:      string;
  surface2:     string;
  border:       string;
  inputBorder:  string;
  text:         string;
  sub:          string;
  muted:        string;
  link:         string;
  primary:      string;
}

export const dark: ColorScheme = {
  bg:          '#0E131D',
  surface:     '#1D2534',
  surface2:    '#141A27',
  border:      '#333D4F',
  inputBorder: '#7A8599',
  text:        '#F5F7FA',
  sub:         '#9EA8BD',
  muted:       '#828DA1',
  link:        '#59AD9E',
  primary:     '#357C6F',
};

export const light: ColorScheme = {
  bg:          '#F6F7F9',
  surface:     '#F2F3F5',
  surface2:    '#E8EAED',
  border:      '#E0E2E6',
  inputBorder: '#E0E2E6',
  text:        '#1A2133',
  sub:         '#5A6478',
  muted:       '#666E7D',
  link:        '#2F7A6B',
  primary:     '#2F7A6B',
};
