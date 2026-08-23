/**
 * Shared "glossy toy" visual language — pastel gradients on a plain light
 * backdrop, matching the AR-filter reference (wax pop / keycap stamp /
 * heart bubble wrap): a bold all-caps title up top, the object rendered as
 * a glossy blob floating on open space (no boxed card), soft drop shadows,
 * and small pill-shaped controls.
 */
export const theme = {
  background: '#f2f1f4',
  surface: '#ffffff',
  textPrimary: '#18181c',
  textSecondary: 'rgba(24,24,28,0.5)',
  pillBg: '#ffffff',
  pillBorder: 'rgba(24,24,28,0.08)',
  shadow: 'rgba(30,25,15,0.25)',
};

export const glossyShadow = {
  shadowColor: theme.shadow,
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 1,
  shadowRadius: 18,
  elevation: 10,
};

export const pillShadow = {
  shadowColor: 'rgba(20,20,30,0.2)',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 10,
  elevation: 4,
};
