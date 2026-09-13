/**
 * Ant Design theme configuration — Skill Intelligence Platform.
 *
 * Custom token overrides for a polished institutional SaaS look.
 * Used via <ConfigProvider theme={antdTheme}> at the app root.
 */

const antdTheme = {
  token: {
    // ── Brand colors ──────────────────────────────────────────
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
    borderRadiusLG: 14,
    borderRadiusSM: 8,

    // ── Surfaces ──────────────────────────────────────────────
    colorBgContainer: '#ffffff',
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
      boxShadowTertiary: '0 2px 10px rgba(11, 38, 65, 0.05)',
      headerFontSize: 16,
      headerFontSizeSM: 14,
      borderRadiusLG: 14,
    },
    Table: {
      headerBg: '#F1F6FA',
      headerColor: '#0B2641',
      headerSplitColor: 'transparent',
      rowHoverBg: '#F8FBFD',
      borderColor: '#DCE7F0',
      cellPaddingBlock: 14,
      cellPaddingInline: 16,
    },
    Button: {
      controlHeight: 40,
      controlHeightSM: 32,
      fontWeight: 600,
      primaryShadow: '0 2px 8px rgba(41, 102, 163, 0.25)',
      borderRadius: 10,
    },
    Progress: {
      defaultColor: '#2966A3',
      remainingColor: '#E8F0F7',
    },
    Tag: {
      borderRadiusSM: 6,
    },
    Layout: {
      siderBg: '#0B2641',
      headerBg: '#F8FBFD',
      bodyBg: '#F8FBFD',
    },
    Menu: {
      // Sidebar palette - Navy background with clean Brand Blue highlights
      darkItemBg: '#0B2641',
      darkSubMenuItemBg: '#071A2E',
      darkItemSelectedBg: '#2966A3',
      darkItemHoverBg: 'rgba(209, 224, 238, 0.12)',
      darkItemColor: '#D1E0EE',
      darkItemSelectedColor: '#ffffff',
      darkItemHoverColor: '#ffffff',
      itemBorderRadius: 10,
      subMenuItemBorderRadius: 8,
      iconSize: 18,
    },
    Input: {
      controlHeight: 42,
      activeBorderColor: '#2966A3',
      hoverBorderColor: '#2966A3',
      borderRadius: 10,
    },
    Select: {
      controlHeight: 42,
      optionSelectedBg: '#D1E0EE',
      borderRadius: 10,
    },
    Upload: {
      colorPrimaryHover: '#2966A3',
    },
  },
};

export default antdTheme;
