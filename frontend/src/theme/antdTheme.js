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
    borderRadiusSM: 8,

    // ── Surfaces ──────────────────────────────────────────────
    colorBgContainer: '#ffffff',
    colorBgLayout: '#F4F6F9',
    colorText: '#1A2332',
    colorTextSecondary: '#5A6B7D',
    colorBorderSecondary: '#E8ECF1',

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
      headerFontSize: 16,
      headerFontSizeSM: 14,
      borderRadiusLG: 10,
    },
    Table: {
      headerBg: '#F4F6F9',
      headerColor: '#3A4A5C',
      headerSplitColor: 'transparent',
      rowHoverBg: '#F8FAFC',
      borderColor: '#E8ECF1',
      cellPaddingBlock: 14,
      cellPaddingInline: 16,
    },
    Button: {
      controlHeight: 40,
      controlHeightSM: 32,
      fontWeight: 500,
      primaryShadow: '0 2px 4px rgba(12, 68, 124, 0.2)',
      borderRadius: 8,
    },
    Progress: {
      defaultColor: '#0C447C',
      remainingColor: '#E8ECF1',
    },
    Tag: {
      borderRadiusSM: 6,
    },
    Layout: {
      siderBg: '#0A1929',
      headerBg: '#ffffff',
      bodyBg: '#F4F6F9',
    },
    Menu: {
      darkItemBg: '#0A1929',
      darkItemSelectedBg: '#0C447C',
      darkItemHoverBg: 'rgba(255,255,255,0.06)',
      darkItemColor: 'rgba(255,255,255,0.65)',
      darkItemSelectedColor: '#ffffff',
      itemBorderRadius: 8,
      iconSize: 18,
    },
    Input: {
      controlHeight: 40,
      activeBorderColor: '#0C447C',
      hoverBorderColor: '#1A5BA0',
    },
    Select: {
      controlHeight: 40,
      optionSelectedBg: '#E8F0F8',
    },
    Upload: {
      colorPrimaryHover: '#1A5BA0',
    },
  },
};

export default antdTheme;
