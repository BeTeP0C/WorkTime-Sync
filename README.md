# WorkTime Sync — Frontend (MVP)

Веб-интерфейс системы актуализации рабочего времени сотрудников. Хакатон — Кейс №3.

## Стек

- **Next.js 14** (App Router) + **React 18** + **TypeScript 5**
- **MobX 6** + `mobx-react-lite` — стейт-менеджмент (без React Query)
- **SCSS Modules** + `classnames` — стилизация
- Кастомные базовые модели в `src/shared/model/`: `ValueModel`, `ToggleModel`, `ListModel`, `LoadingStageModel`
- `react-hook-form`, `react-dropzone`, `recharts`, `@tippyjs/react`, `date-fns`, `swiper`, `rc-slider`, `react-virtuoso`, `react-animate-height`, `react-intersection-observer`

## Реализованные страницы

- `/dashboard` — Главная: сводка KPI, AI-баннер, загрузка данных (drag-n-drop), «требуют внимания»
- `/employees/[id]` — Профиль сотрудника: метрики Ai/Li/Ci, график, рекомендации AI, исключения
- `/teams/[id]` — Команда: тепловая карта доступности, таймлайн расписания, AI-блок «лучшее время для встречи»
- `/diagnostics` — Диагностика: фильтры, donut-chart распределения по риску, kanban-доска

## Запуск

```bash
npm install
npm run dev
```

Открыть [http://localhost:3000](http://localhost:3000).

По умолчанию работает на моках (JSON в `public/mocks/`). Чтобы переключиться на реальный бэкенд:

```bash
# .env.local
NEXT_PUBLIC_USE_MOCKS=false
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Скрипты

```bash
npm run dev        # dev-сервер
npm run build      # production-сборка
npm run start      # запуск собранного
npm run lint       # ESLint
npm run ts-check   # tsc --noEmit
npm run format     # Prettier
```

## Docker

```bash
docker build -t worktime-sync-front .
docker run -p 3000:3000 worktime-sync-front
```

## Архитектура (FSD)

```
src/
├── app/                  # Next.js App Router (страницы, layout)
├── app-store/            # MobX RootStore + страничные сторы
├── widgets/              # Сложные UI-блоки (HeatmapGrid, DiagnosticsBoard, ...)
├── features/             # Бизнес-фичи
├── entities/             # Доменные сущности (employee, team, schedule, ...)
└── shared/
    ├── api/              # fetch-wrapper + mockClient
    ├── model/            # базовые MobX-модели (ValueModel, ListModel, ...)
    ├── ui/               # UI-примитивы (Button, Card, Badge, Tooltip, ...)
    ├── lib/              # утилиты (format, colorScale, availability)
    ├── styles/           # SCSS (colors, mixins, typography, global)
    ├── config/           # env
    └── types/            # общие TS-типы
```

## Бизнес-логика приоритезации

В `EmployeesStore.byCategory` и `TeamPageStore.filterRecommendations` реализована приоритезация сотрудников по риску актуальности данных:

- **Критический** (`risk_score ≥ 0.80` или `days_since_update ≥ 90`) — данные нельзя использовать для планирования встреч; исключаются из `available_employee_ids`.
- **Высокий** (`risk_score 0.60–0.80`, `conflict_rate ≥ 0.35`, `load_level > 1.0`) — данные подозрительные, рекомендуется обновление.
- **Средний** — нужно подтверждение графика.
- **Низкий** — данные актуальны, учитываются с полным весом.

## Формулы метрик (из бэкенда)

```
Ai = 1 - days_since_update / 90              # актуальность графика
Ci = outside_events / total_events           # доля встреч вне графика
Li = busy_hours / work_hours                 # загрузка
Ri = 0.30·(1-Ai) + 0.30·Ci + 0.25·Li + 0.15·H  # интегральный риск
```

Уровни риска: `low (<0.35) / medium (<0.60) / high (<0.80) / critical (≥0.80)`.
