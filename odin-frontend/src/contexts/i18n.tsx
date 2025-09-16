import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type LanguageCode = "en" | "hi";

type Dictionary = Record<string, string>;

type Translations = Record<LanguageCode, Dictionary>;

const translations: Translations = {
  en: {
    autonomousPlanner: "Autonomous Planner",
    dataset: "Dataset",
    save: "Save",
    load: "Load",
    epoch: "Epoch (2012-2018)",
    timeSpeed: "Time Speed",
    simTime: "Sim Time:",
    startPlanning: "Start Autonomous Planning",
    planningEllipsis: "Planning…",
    deltaV: "ΔV (m/s)",
    timeHours: "Time (h)",
    fuelPct: "Fuel (%)",
    logsTitle: "Real-time Decision Logs",
    noLogs: "No logs yet. Start planning to see updates.",
    riskAssessment: "Risk Assessment",
    multilingualSystem: "Multilingual System",
    noAnalysisYet: "No analysis yet.",
  },
  hi: {
    autonomousPlanner: "स्वायत्त योजनाकार",
    dataset: "डेटासेट",
    save: "सहेजें",
    load: "लोड",
    epoch: "युग (2012-2018)",
    timeSpeed: "समय गति",
    simTime: "सिम समय:",
    startPlanning: "स्वायत्त योजना शुरू करें",
    planningEllipsis: "योजना बन रही है…",
    deltaV: "ΔV (मी/से)",
    timeHours: "समय (घंटे)",
    fuelPct: "ईंधन (%)",
    logsTitle: "रीयल-टाइम निर्णय लॉग",
    noLogs: "अभी कोई लॉग नहीं। अपडेट देखने के लिए योजना शुरू करें।",
    riskAssessment: "जोखिम आकलन",
    multilingualSystem: "बहुभाषी प्रणाली",
    noAnalysisYet: "अभी तक कोई विश्लेषण नहीं।",
  },
};

const STORAGE_KEY = "APP_LANGUAGE";

type I18nContextValue = {
  lang: LanguageCode;
  setLang: (l: LanguageCode) => void;
  t: (key: keyof typeof translations["en"]) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>(() => {
    const saved = (typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY)) as LanguageCode | null;
    return saved || "en";
  });

  const setLang = useCallback((l: LanguageCode) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }, []);

  useEffect(() => {
    // no-op; reserved for hooking real i18n lib
  }, [lang]);

  const t = useCallback((key: keyof typeof translations["en"]) => {
    const dict = translations[lang] || translations.en;
    return dict[key] ?? translations.en[key] ?? String(key);
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
