/**
 * Ant Design theme configuration — Skill Intelligence Platform.
 *
 * Custom token overrides for a polished institutional SaaS look.
 * Used via <ConfigProvider theme={antdTheme}> at the app root.
 */

const antdTheme = {
  token: {
    // ── Brand colors ──────────────────────────────────────────
    colorPrimary: '#0C447C',
    colorInfo: '#0C447C',
    colorSuccess: '#3B6D11',
    colorWarning: '#BA7517',
    colorError: '#C0392B',
    colorPrimary: '#2966A3',
    colorInfo: '#2966A3',
    colorSuccess: '#3D7D70',
    colorWarning: '#D97706',
    colorError: '#DC2626',

    // ── Typography ────────────────────────────────────────────
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    fontSizeHeading1: 30,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 17,
    lineHeight: 1.55,

    // ── Shape ─────────────────────────────────────────────────
    borderRadius: 10,
    borderRadiusLG: 12,
    borderRadiusLG: 14,
    borderRadiusSM: 8,

    // ── Surfaces ──────────────────────────────────────────────
    colorBgContainer: '#ffffff',
    colorBgLayout: '#F4F6F9',
    colorText: '#1A2332',
    colorTextSecondary: '#5A6B7D',
    colorBorderSecondary: '#E8ECF1',
    colorBgLayout: '#F8FBFD',
    colorText: '#172B3D',
    colorTextSecondary: '#617487',
    colorBorderSecondary: '#DCE7F0',

    // ── Spacing ───────────────────────────────────────────────
    paddingLG: 24,
    paddingMD: 20,

    // ── Misc ──────────────────────────────────────────────────
    wireframe: false,
  },

  components: {
    Card: {
      paddingLG: 24,
      boxShadowTertiary: '0 1px 3px rgba(0, 0, 0, 0.08)',
      boxShadowTertiary: '0 2px 10px rgba(11, 38, 65, 0.05)',
      headerFontSize: 16,
      headerFontSizeSM: 14,
      borderRadiusLG: 10,
      borderRadiusLG: 14,
    },
    Table: {
      headerBg: '#F4F6F9',
      headerColor: '#3A4A5C',
      headerBg: '#F1F6FA',
      headerColor: '#0B2641',
      headerSplitColor: 'transparent',
      rowHoverBg: '#F8FAFC',
      borderColor: '#E8ECF1',
      rowHoverBg: '#F8FBFD',
      borderColor: '#DCE7F0',
      cellPaddingBlock: 14,
      cellPaddingInline: 16,
    },
    Button: {
      controlHeight: 40,
      controlHeightSM: 32,
      fontWeight: 500,
      primaryShadow: '0 2px 4px rgba(12, 68, 124, 0.2)',
      borderRadius: 8,
      fontWeight: 600,
      primaryShadow: '0 2px 8px rgba(41, 102, 163, 0.25)',
      borderRadius: 10,
    },
    Progress: {
      defaultColor: '#0C447C',
      remainingColor: '#E8ECF1',
      defaultColor: '#2966A3',
      remainingColor: '#E8F0F7',
    },
    Tag: {
      borderRadiusSM: 6,
    },
    Layout: {
      siderBg: '#0A1929',
      headerBg: '#ffffff',
      bodyBg: '#F4F6F9',
      siderBg: '#0B2641',
      headerBg: '#F8FBFD',
      bodyBg: '#F8FBFD',
    },
    Menu: {
      darkItemBg: '#0A1929',
      darkItemSelectedBg: '#0C447C',
      darkItemHoverBg: 'rgba(255,255,255,0.06)',
      darkItemColor: 'rgba(255,255,255,0.65)',
      darkItemBg: '#0B2641',
      darkItemSelectedBg: '#2966A3',
      darkItemHoverBg: 'rgba(255,255,255,0.08)',
      darkItemColor: 'rgba(255,255,255,0.75)',
      darkItemSelectedColor: '#ffffff',
      itemBorderRadius: 8,
      itemBorderRadius: 10,
      iconSize: 18,
    },
    Input: {
      controlHeight: 40,
      activeBorderColor: '#0C447C',
      hoverBorderColor: '#1A5BA0',
      controlHeight: 42,
      activeBorderColor: '#2966A3',
      hoverBorderColor: '#2966A3',
      borderRadius: 10,
    },
    Select: {
      controlHeight: 40,
      optionSelectedBg: '#E8F0F8',
      controlHeight: 42,
      optionSelectedBg: '#D1E0EE',
      borderRadius: 10,
    },
    Upload: {
      colorPrimaryHover: '#1A5BA0',
      colorPrimaryHover: '#2966A3',
    },
  },
};

export default antdTheme;
