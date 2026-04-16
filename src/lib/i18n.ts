import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation catalogs
const resources = {
  en: {
    translation: {
      "app_title": "Aztek Framework",
      "simulation_control": "Simulation Control",
      "start_simulation": "Initialize System",
      "spawn_agents": "Spawn Agents",
      "input_directive": "write somethigng",
      "waiting_command": "waiting for command",
      "simulate": "simulate",
      "spawn": "spawn agents",
      "epoch": "epoch",
      "final_report": "final report",
      "node_data": "node_data",
      "generate_report": "Generate Report",
      "status_initializing": "Initializing...",
      "status_running": "Running",
      "status_completed": "Completed",
      "status_standby": "standby",
      "status_compiling": "compiling map...",
      "status_compiled": "map compiled",
      "status_deploying": "deploying agents...",
      "status_live": "network live",
      "status_computing": "computing epoch {{epoch}}...",
      "status_verified": "epoch {{epoch}} verified",
      "status_error": "error:",
      "alignment": "alignment",
      "receptivity": "receptivity",
      "plasticity": "plasticity",
      "volatile": "volatile"
    }
  },
  ru: {
    translation: {
      "app_title": "Платформа Aztek",
      "simulation_control": "Управление симуляцией",
      "start_simulation": "Инициализировать",
      "spawn_agents": "Создать агентов",
      "input_directive": "напишите что-нибудь",
      "waiting_command": "ожидание команды",
      "simulate": "симуляция",
      "spawn": "развернуть агентов",
      "epoch": "эпоха",
      "final_report": "финальный отчет",
      "node_data": "данные_узла",
      "generate_report": "Создать отчет",
      "status_initializing": "Инициализация...",
      "status_running": "Запущено",
      "status_completed": "Завершено",
      "status_standby": "ожидание",
      "status_compiling": "компиляция карты...",
      "status_compiled": "карта скомпилирована",
      "status_deploying": "развертывание агентов...",
      "status_live": "сеть активна",
      "status_computing": "вычисление эпохи {{epoch}}...",
      "status_verified": "эпоха {{epoch}} проверена",
      "status_error": "ошибка:",
      "alignment": "принадлежность",
      "receptivity": "восприимчивость",
      "plasticity": "пластичность",
      "volatile": "волатильно"
    }
  },
  kk: {
    translation: {
      "app_title": "Aztek Платформасы",
      "simulation_control": "Симуляцияны басқару",
      "start_simulation": "Жүйені бастау",
      "spawn_agents": "Агенттерді құру",
      "input_directive": "бірдеңе жазыңыз",
      "waiting_command": "команданы күтуде",
      "simulate": "симуляциялау",
      "spawn": "агенттерді орналастыру",
      "epoch": "дәуір",
      "final_report": "қорытынды есеп",
      "node_data": "түйін_деректері",
      "generate_report": "Есеп шығару",
      "status_initializing": "Басталуда...",
      "status_running": "Жүріп жатыр",
      "status_completed": "Аяқталды",
      "status_standby": "күту",
      "status_compiling": "карта құрылуда...",
      "status_compiled": "карта құрылды",
      "status_deploying": "агенттерді орналастыру...",
      "status_live": "желі белсенді",
      "status_computing": "дәуір {{epoch}} есептелуде...",
      "status_verified": "дәуір {{epoch}} тексерілді",
      "status_error": "қате:",
      "alignment": "бағыттылық",
      "receptivity": "қабылдаушылық",
      "plasticity": "икемділік",
      "volatile": "құбылмалы",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
