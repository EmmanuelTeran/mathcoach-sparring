# Arquitectura Técnica del Sistema: DevCoach Sparring

Este documento describe la arquitectura modular, contratos de API, estrategia de persistencia y flujo de datos de DevCoach Sparring conforme avanza su grafo de desarrollo.

---

## 1. Topología del Monorepo

El repositorio está organizado como un monorepo NPM con separación estricta de responsabilidades:

```text
devcoach-sparring/
├── client/                     # Frontend SPA en Vite + React 18 + Tailwind CSS
│   ├── src/
│   │   ├── App.jsx             # Shell principal con monitoreo de API
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Estilos base y tokens Tailwind
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                     # Backend API en Node.js + Express + Mongoose
│   ├── src/
│   │   ├── app.js              # Configuración de Express, middlewares y rutas
│   │   ├── server.js           # Bootstrap del servidor HTTP y conexión DB
│   │   ├── db.js               # Conexión defensiva a MongoDB
│   │   └── routes/
│   │       └── health.js       # Endpoint de diagnóstico y salud
│   ├── tests/
│   │   └── health.test.js      # Pruebas de integración con Supertest & MongoMemoryServer
│   └── package.json
├── tests/
│   └── e2e/
│       └── smoke.spec.js       # Validación End-to-End con Playwright
├── docs/                       # Documentación técnica y guías
├── tickets/                    # Registro formal de historias de usuario y evidencias
├── playwright.config.js        # Orquestación de webServer y navegadores E2E
└── package.json                # Workspaces de NPM y scripts concurrentes
```

---

## 2. Contratos de API

### 2.1 `GET /api/health`

Comprueba el estado del servidor y la conectividad activa con MongoDB.

- **Método:** `GET`
- **Ruta:** `/api/health`
- **Headers:** `Accept: application/json`

#### Códigos de Respuesta

| Código HTTP | Escenario | Payload de Ejemplo |
| :--- | :--- | :--- |
| `200 OK` | Servidor en línea y MongoDB conectado | `{"status": "ok", "timestamp": "2026-10-01T02:50:00.000Z", "services": {"database": "connected"}}` |
| `503 Service Unavailable` | Servidor en línea pero MongoDB desconectado / inalcanzable | `{"status": "degraded", "timestamp": "2026-10-01T02:50:00.000Z", "services": {"database": "disconnected"}}` |

### 2.2 `GET /api/topics/due`

Obtiene la cola de temas vencidos para repetición espaciada (`nextReviewAt <= Date.now()`), priorizando los temas más críticos (menor promedio histórico de score) y con mayor atraso temporal.

- **Método:** `GET`
- **Ruta:** `/api/topics/due`
- **Headers:** `Accept: application/json`

#### Códigos de Respuesta

| Código HTTP | Escenario | Payload de Ejemplo |
| :--- | :--- | :--- |
| `200 OK` | Consulta exitosa (array de temas) | `[{"_id": "...", "title": "React Fiber", "category": "hard_skill", "type": "theory", "srsStage": 0, "nextReviewAt": "..."}]` |
| `500 Internal Server Error` | Fallo de base de datos | `{"error": "Internal Server Error"}` |

### 2.3 `POST /api/topics/review`

Registra el resultado de una sesión de Active Recall o defensa por voz, recomputa el estado SRS con SM-2 adaptado y persiste el intento en el historial.

- **Método:** `POST`
- **Ruta:** `/api/topics/review`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "topicId": "651f8...",
    "score": 4,
    "userInput": "Explicación de Fiber reconciler...",
    "aiFeedback": "Buena argumentación técnica."
  }
  ```

#### Códigos de Respuesta

| Código HTTP | Escenario | Payload de Ejemplo |
| :--- | :--- | :--- |
| `200 OK` | Revisión procesada exitosamente | `{"message": "Review recorded successfully", "topic": {"_id": "...", "title": "React Fiber", "srsStage": 1, "nextReviewAt": "..."}}` |
| `400 Bad Request` | Faltan campos requeridos o inválidos | `{"error": "topicId and a valid score between 1 and 5 are required"}` |
| `404 Not Found` | Topic no encontrado | `{"error": "Topic not found"}` |
| `500 Internal Server Error` | Fallo de base de datos | `{"error": "Internal Server Error"}` |

### 2.4 `POST /api/practice/hard-skill/generate`

Recibe un `topicId`, consulta el tema en MongoDB y formula un reto de Active Recall conceptual o práctico con `@google/genai` (`gemini-2.5-flash`).

- **Método:** `POST`
- **Ruta:** `/api/practice/hard-skill/generate`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "topicId": "674c11112222333344445555"
  }
  ```

#### Códigos de Respuesta

| Código HTTP | Escenario | Payload de Ejemplo |
| :--- | :--- | :--- |
| `200 OK` | Reto generado exitosamente | `{"topicId": "...", "title": "Node.js Event Loop", "type": "theory", "category": "hard_skill", "challenge": "¿Cómo previene Node.js el thread starvation en la fase poll...?"}` |
| `400 Bad Request` | Falta `topicId` | `{"error": "topicId is required"}` |
| `404 Not Found` | Topic inexistente | `{"error": "Topic not found"}` |
| `500 Internal Server Error` | Error al invocar IA o BD | `{"error": "Internal Server Error"}` |

### 2.5 `POST /api/practice/hard-skill/evaluate`

Recibe la solución técnica del usuario, la evalúa con un prompt estricto de Senior Evaluator usando Gemini (`gemini-2.5-flash`), actualiza el estado SRS del `Topic` y guarda un registro en `SessionLog`.

- **Método:** `POST`
- **Ruta:** `/api/practice/hard-skill/evaluate`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "topicId": "674c11112222333344445555",
    "challenge": "¿Cómo previene Node.js el thread starvation en la fase poll...?",
    "userSolution": "process.nextTick se drena al terminar la operación actual antes de la siguiente fase..."
  }
  ```

#### Códigos de Respuesta

| Código HTTP | Escenario | Payload de Ejemplo |
| :--- | :--- | :--- |
| `200 OK` | Evaluación procesada exitosamente | `{"score": 5, "feedback": "Excelente dominio...", "missingTradeoffs": ["..."], "strengths": ["..."], "nextReviewAt": "2026-10-02T...", "srsStage": 1, "intervalDays": 1, "sessionLogId": "..."}` |
| `400 Bad Request` | Faltan campos requeridos | `{"error": "topicId, challenge, and userSolution are required"}` |
| `404 Not Found` | Topic inexistente | `{"error": "Topic not found"}` |
| `500 Internal Server Error` | Error en evaluación o BD | `{"error": "Internal Server Error"}` |

### 2.6 `POST /api/practice/soft-skill/start`

Inicia el sparring de consultoría asignando un rol de stakeholder (`Tech Lead`, `PM orientado a costos`, `Cliente No Técnico`) y planteando un escenario conflictivo inicial.

- **Método:** `POST`
- **Ruta:** `/api/practice/soft-skill/start`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "topicId": "674c11112222333344445555"
  }
  ```

#### Códigos de Respuesta

| Código HTTP | Escenario | Payload de Ejemplo |
| :--- | :--- | :--- |
| `200 OK` | Escenario y rol inicial generados | `{"topicId": "...", "title": "Microservicios", "role": "Tech Lead Escéptico", "avatar": "🛡️", "scenario": "El cliente cuestiona...", "initialQuestion": "¿Por qué necesitamos...?"}` |
| `400 Bad Request` | Falta `topicId` | `{"error": "topicId is required"}` |
| `404 Not Found` | Topic inexistente | `{"error": "Topic not found"}` |
| `500 Internal Server Error` | Error al invocar IA | `{"error": "Internal Server Error"}` |

### 2.7 `POST /api/practice/soft-skill/reply`

Gestiona el flujo conversacional por turnos. Si es turno intermedio (1 o 2), replica con escepticismo. Si es turno final (3), genera el veredicto del Evaluador Asertivo, recalcula SRS y persiste en `SessionLog`.

- **Método:** `POST`
- **Ruta:** `/api/practice/soft-skill/reply`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "topicId": "674c11112222333344445555",
    "role": "Tech Lead Escéptico",
    "conversationHistory": [
      { "speaker": "ai", "text": "¿Por qué no usamos SQLite en vez de Postgres?" }
    ],
    "userAudioTranscript": "PostgreSQL nos brinda concurrencia MVCC y extensiones de indexación esenciales para escalar."
  }
  ```

#### Códigos de Respuesta

| Código HTTP | Escenario | Payload de Ejemplo |
| :--- | :--- | :--- |
| `200 OK (Turno Intermedio)` | Réplica del stakeholder | `{"isFinalTurn": false, "role": "Tech Lead Escéptico", "reply": "Entiendo, pero ¿cómo justificas el costo operacional?"}` |
| `200 OK (Turno Final)` | Veredicto con SRS y Mongo | `{"isFinalTurn": true, "score": 4, "feedback": "...", "businessClarity": "...", "tradeOffDefense": "...", "assertivenessScore": 4, "missingTradeoffs": [], "strengths": ["..."], "nextReviewAt": "...", "sessionLogId": "..."}` |
| `400 Bad Request` | Faltan campos requeridos | `{"error": "topicId and userAudioTranscript are required"}` |
| `404 Not Found` | Topic inexistente | `{"error": "Topic not found"}` |
### 2.8 `GET /api/dashboard/summary`

Consolida en un solo payload las métricas operativas del día, conteos de cola SRS, detección de temas con deficiencias y la recomendación inteligente acoplada.

- **Método:** `GET`
- **Ruta:** `/api/dashboard/summary`
- **Headers:** `Accept: application/json`

#### Códigos de Respuesta

| Código HTTP | Escenario | Payload de Ejemplo |
| :--- | :--- | :--- |
| `200 OK` | Métricas y recomendación calculadas exitosamente | `{"dueCount": 3, "dueHardSkills": 2, "dueSoftSkills": 1, "criticalTopics": [{"_id": "...", "title": "React Fiber", "lastScore": 1, "srsStage": 0, "nextReviewAt": "..."}], "recommendedNext": {"_id": "...", "title": "React Fiber", "category": "hard_skill", "type": "theory"}}` |
| `500 Internal Server Error` | Error al consultar la base de datos | `{"error": "Internal Server Error"}` |

---


## 3. Modelo de Datos (Mongoose Schemas)

### Modelo `Topic` (`server/src/models/Topic.js`)

```typescript
interface IReviewHistory {
  score: number;          // 1 a 5
  userInput: string;      // Respuesta o transcripción del usuario
  aiFeedback: string;     // Feedback emitido por Gemini
  reviewedAt: Date;       // Timestamp del repaso
}

interface ITopic {
  title: string;
  category: 'hard_skill' | 'soft_skill';
  type: 'theory' | 'practice';
  srsStage: number;       // Etapa SRS (0: nuevo/reseteado, 1, 2, ...)
  easeFactor: number;     // Multiplicador de dificultad (default: 2.5, min: 1.3)
  intervalDays: number;   // Días hasta el próximo repaso
  nextReviewAt: Date;     // Fecha programada para la siguiente revisión (Indexado)
  history: IReviewHistory[]; // Subdocumentos embebidos
  createdAt: Date;
  updatedAt: Date;
}
```

### Modelo `SessionLog` (`server/src/models/SessionLog.js`)

```typescript
interface ISessionLog {
  topicId: ObjectId;      // Referencia a Topic
  challenge: string;      // Enunciado generado por IA
  userSolution: string;   // Solución técnica del usuario
  score: number;          // Calificación asignada (1 a 5)
  feedback: string;       // Dictamen técnico del Senior Evaluator
  missingTradeoffs: string[]; // Puntos ciegos o trade-offs no considerados
  strengths: string[];    // Fortalezas técnicas identificadas
  reviewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 4. Diagramas de Flujo y Arquitectura

### 4.1 Flujo de Active Recall y Evaluación de Hard Skills (Gemini + SRS)

```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant UI as HardSkillTrainer (React)
    participant API as Express (practiceRouter)
    participant Gemini as Gemini SDK (gemini-2.5-flash)
    participant SRS as srsCalculator (SM-2)
    participant DB as MongoDB (Topic & SessionLog)

    Usuario->>UI: Selecciona tema prioritario
    UI->>API: POST /api/practice/hard-skill/generate { topicId }
    API->>DB: Topic.findById(topicId)
    DB-->>API: Datos del tema (título, categoría, tipo)
    API->>Gemini: generateHardSkillChallenge(topic)
    Gemini-->>API: Desafío técnico formulado
    API-->>UI: 200 OK { challenge, topicId, title }
    UI-->>Usuario: Muestra visor del reto y activa editor monoespaciado

    Usuario->>UI: Redacta solución técnica y presiona "Evaluar"
    UI->>API: POST /api/practice/hard-skill/evaluate { topicId, challenge, userSolution }
    API->>DB: Topic.findById(topicId)
    API->>Gemini: evaluateHardSkillSolution (Senior Evaluator prompt)
    Gemini-->>API: JSON { score, feedback, missingTradeoffs, strengths }
    API->>SRS: calculateNextReview(currentStage, easeFactor, score, intervalDays)
    SRS-->>API: { srsStage, easeFactor, intervalDays, nextReviewAt }
    API->>DB: topic.save() (actualiza SRS + history)
    API->>DB: SessionLog.create()
    API-->>UI: 200 OK { score, feedback, missingTradeoffs, strengths, nextReviewAt }
    UI-->>Usuario: Despliega badge de score, feedback directo, puntos ciegos y fecha de próximo repaso
```


### 4.2 Máquina de Estados del Motor Algorítmico SRS (SM-2 Adaptado)

```mermaid
stateDiagram-v2
    [*] --> Stage0: Tema Creado (Stage 0, EF 2.5, Interval 0d)

    state Stage0 {
        [*] --> PendingDue: nextReviewAt <= now
    }

    PendingDue --> Stage0: Score 1 o 2 (Fallo / Duda severa)\n[Stage=0, Interval=1d, EF disminuye (min 1.3)]
    PendingDue --> Stage1: Score 3 (Aprobado raspado)\n[Stage=1, Interval=3d, EF ajustado]
    PendingDue --> Stage1: Score 4 o 5 (Buen rendimiento / Dominio)\n[Stage=1, Interval=1d, EF ajustado]

    state Stage1 {
        [*] --> InReviewStage1
    }

    InReviewStage1 --> Stage0: Score 1 o 2 (Fallo)\n[Reset a Stage=0, Interval=1d]
    InReviewStage1 --> Stage1: Score 3\n[Stage=1, Interval=3d]
    InReviewStage1 --> Stage2: Score 4 o 5\n[Stage=2, Interval=6d]

    state Stage2_Plus {
        [*] --> InReviewAdvanced
    }

    Stage2 --> Stage2_Plus
    InReviewAdvanced --> Stage0: Score 1 o 2 (Fallo)\n[Reset a Stage=0, Interval=1d]
    InReviewAdvanced --> Stage2_Plus: Score 3\n[Stage actual, Interval=3d]
    InReviewAdvanced --> Stage2_Plus: Score 4 o 5\n[Stage=Stage+1, Interval = round(Interval * EF)]
```

### 4.3 Flujo de Arranque y Healthcheck

```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant Client as React SPA (Port 5173)
    participant Server as Express API (Port 5000)
    participant Mongo as MongoDB Instance

    Usuario->>Client: Carga en navegador (http://localhost:5173)
    Client->>Server: GET /api/health
    Server->>Mongo: Inspecciona mongoose.connection.readyState
    alt Conexión establecida (readyState == 1)
        Mongo-->>Server: Connected
        Server-->>Client: 200 OK { status: "ok", services: { database: "connected" } }
        Client-->>Usuario: Muestra indicador verde "API: ok"
    else Sin conexión (readyState != 1)
        Mongo-->>Server: Disconnected
        Server-->>Client: 503 Service Unavailable { status: "degraded", services: { database: "disconnected" } }
        Client-->>Usuario: Muestra indicador ámbar "API: degraded"
    end
```

### 4.4 Harness de Testing y E2E Playwright

```mermaid
graph TD
    A[npm test / npm run test:e2e] --> B[Vitest + Supertest]
    A --> C[Playwright Test Runner]

    subgraph "Backend Harness"
        B --> D[MongoMemoryServer (In-Memory Mongo)]
        B --> E[Express App (Supertest)]
    end

    subgraph "E2E Harness (Playwright)"
        C --> F[Orquesta webServer: server (port 5000)]
        C --> G[Orquesta webServer: client (port 5173)]
        C --> H[Chromium Browser Context]
        H --> G
        G --> F
    end
```

### 4.5 Flujo de Sparring por Voz (Web Speech API + Gemini + SRS)

```mermaid
sequenceDiagram
    autonumber
    actor Ingeniero
    participant Browser as Web Speech API (Mic / TTS)
    participant UI as SoftSkillTrainer (React)
    participant API as Express (softSkillPracticeRouter)
    participant Gemini as Gemini SDK (gemini-2.5-flash)
    participant SRS as srsCalculator (SM-2)
    participant DB as MongoDB (Topic & SessionLog)

    Ingeniero->>UI: Clic en "Iniciar Sparring"
    UI->>API: POST /api/practice/soft-skill/start { topicId }
    API->>DB: Topic.findById(topicId)
    API->>Gemini: startSoftSkillSparring(topic)
    Gemini-->>API: JSON { scenario, initialQuestion, role, avatar }
    API-->>UI: 200 OK { role, avatar, scenario, initialQuestion }
    UI->>Browser: speakText(initialQuestion) vía SpeechSynthesis
    Browser-->>Ingeniero: Audio sintetizado de la objeción del stakeholder

    loop Turnos Intermedios (1 y 2)
        Ingeniero->>Browser: Habla por micrófono (o escribe en input)
        Browser->>UI: Transcripción de voz (SpeechRecognition)
        Ingeniero->>UI: Envía réplica
        UI->>API: POST /api/practice/soft-skill/reply { topicId, conversationHistory, userAudioTranscript, role }
        API->>Gemini: replySoftSkillSparring (Rol de stakeholder escéptico)
        Gemini-->>API: { isFinalTurn: false, reply }
        API-->>UI: 200 OK { isFinalTurn: false, reply }
        UI->>Browser: speakText(reply)
        Browser-->>Ingeniero: Réplica hablada del stakeholder
    end

    Note over Ingeniero,DB: Turno 3 (Final): Evaluación y Cierre
    Ingeniero->>UI: Envía tercera y última argumentación técnica
    UI->>API: POST /api/practice/soft-skill/reply { topicId, conversationHistory, userAudioTranscript }
    API->>Gemini: replySoftSkillSparring (Evaluador Asertivo de Consultoría)
    Gemini-->>API: JSON { score, feedback, businessClarity, tradeOffDefense, assertivenessScore, missingTradeoffs, strengths }
    API->>SRS: calculateNextReview(stage, easeFactor, score, intervalDays)
    SRS-->>API: { srsStage, easeFactor, intervalDays, nextReviewAt }
    API->>DB: topic.save() (actualiza SRS + history)
    API->>DB: SessionLog.create() (persiste diálogo y dimensiones)
    API-->>UI: 200 OK { isFinalTurn: true, score, feedback, businessClarity, tradeOffDefense, assertivenessScore, nextReviewAt }
    UI-->>Ingeniero: Muestra panel de veredicto con las 3 dimensiones de consultoría y próxima fecha
```

### 4.6 Lógica de Recomendación Acoplada (Hard Skills + Soft Skills)

El backend en `GET /api/dashboard/summary` implementa la heurística pedagógica de acoplamiento: si el tema con fecha más vencida es una defensa por voz (Soft Skill), pero su contraparte técnica (misma subcategoría) tiene calificación deficiente (`score < 3`), se antepone el reto técnico:

```mermaid
flowchart TD
    Start([Petición GET /api/dashboard/summary]) --> FetchDue[Consultar temas con nextReviewAt <= ahora]
    FetchDue --> CheckDue{¿Existen temas pendientes en la cola?}
    
    CheckDue -- No --> CheckCritOnly{¿Hay áreas críticas registradas?}
    CheckCritOnly -- Sí --> SuggestCritical[recommendedNext = Tema más deficiente score < 3]
    CheckCritOnly -- No --> ReturnEmpty[recommendedNext = null]
    
    CheckDue -- Sí --> PickEarliest[Ordenar por menor score histórico y fecha más antigua]
    PickEarliest --> TopCandidate[Candidato más urgente]
    
    TopCandidate --> IsSoftSkill{¿El candidato es Soft Skill?}
    IsSoftSkill -- No --> RecommendCandidate[recommendedNext = Candidato Hard Skill]
    
    IsSoftSkill -- Sí --> CheckHardDeficiency{¿Su contraparte técnica o misma área tiene último score < 3?}
    CheckHardDeficiency -- Sí --> RecommendHardBase[Priorizar reto de Hard Skill para asegurar bases teóricas]
    CheckHardDeficiency -- No --> RecommendSoft[recommendedNext = Candidato Soft Skill listo para defensa]
    
    RecommendHardBase --> BuildResponse[Construir payload: dueCount, dueHard, dueSoft, criticalTopics, recommendedNext]
    RecommendCandidate --> BuildResponse
    RecommendSoft --> BuildResponse
    SuggestCritical --> BuildResponse
    ReturnEmpty --> BuildResponse
    BuildResponse --> End([200 OK con métricas consolidadas])
```

### 4.7 Diagrama General del Ecosistema DevCoach Sparring

```mermaid
graph TB
    subgraph Cliente ["Frontend SPA (React 18 + Vite + Tailwind CSS)"]
        UI_Dash["Dashboard Component<br/>(Métricas, Recomendación, Áreas Críticas)"]
        UI_Hard["HardSkillTrainer Component<br/>(Active Recall + Code Editor)"]
        UI_Soft["SoftSkillTrainer Component<br/>(Voice Sparring + Web Speech API)"]
        Audio_API["Web Speech API<br/>(SpeechRecognition & SpeechSynthesis)"]
        UI_Soft <--> Audio_API
    end

    subgraph Servidor ["Backend API (Node.js + Express)"]
        Router_Dash["/api/dashboard<br/>(dashboardController)"]
        Router_Topics["/api/topics<br/>(due & review endpoints)"]
        Router_Practice["/api/practice/hard-skill<br/>(generate & evaluate)"]
        Router_Soft["/api/practice/soft-skill<br/>(start & reply sparrings)"]
        Engine_SRS["SRS Engine<br/>(SuperMemo 2 Adaptado)"]
        Seed_Script["Seeding Idempotente<br/>(30 Temas Mid-to-Senior)"]
    end

    subgraph Inteligencia ["Servicios Cognitivos & IA"]
        Gemini_AI["Google Gemini 2.5 Flash<br/>(@google/genai SDK)"]
        Mock_AI["Fallback Heurístico<br/>(Offline / Sin API Key)"]
    end

    subgraph Persistencia ["Almacenamiento de Datos (MongoDB Mongoose)"]
        Collection_Topics[("Topics Collection<br/>(SRS Stages, EaseFactor, History)")]
        Collection_Logs[("SessionLogs Collection<br/>(Puntajes, Missing Trade-offs, Transcripciones)")]
    end

    UI_Dash --> Router_Dash
    UI_Hard --> Router_Topics
    UI_Hard --> Router_Practice
    UI_Soft --> Router_Soft

    Router_Dash --> Collection_Topics
    Router_Dash --> Collection_Logs
    Router_Topics --> Engine_SRS
    Router_Topics --> Collection_Topics
    Router_Practice --> Gemini_AI
    Router_Practice --> Mock_AI
    Router_Practice --> Engine_SRS
    Router_Practice --> Collection_Topics
    Router_Practice --> Collection_Logs
    Router_Soft --> Gemini_AI
    Router_Soft --> Mock_AI
    Router_Soft --> Engine_SRS
    Router_Soft --> Collection_Topics
    Router_Soft --> Collection_Logs
    Seed_Script --> Collection_Topics
```

---

## 5. Evolución del Sistema y Cierre de Historias

- [x] **US-01:** Scaffolding, Base Monorepo y Harness de Tests (Vitest + Playwright).
- [x] **US-02:** Schemas Mongoose y Motor Algorítmico SRS (SM-2 Adaptado).
- [x] **US-03:** Módulo Hard Skills: Active Recall Teórico y Práctico con IA.
- [x] **US-04:** Módulo Soft Skills: Sparring por Voz (Web Speech API + Gemini).
- [x] **US-05:** Dashboard Operativo y Acoplamiento de Habilidades (Cola de Repaso Unificada y visualización integrada).
- [x] **US-06:** Seed Senior del Roadmap (30 temas Mid-to-Senior) y Validación E2E Total.
- [x] **US-07:** Niveles de Progresión y Andamiaje Pedagógico (Scaffolding con Pistas Gemini `/hint`).
- [x] **US-08:** Catálogo Completo Multinivel (Junior/Mid/Senior) de 62 Temas y Sincronización UI Reactiva.

---

## 6. Arquitectura Multinivel y Sincronización UI (US-08)

### 6.1 Modelo de Datos: Campo `level` en `Topic`

El modelo `Topic` (`server/src/models/Topic.js`) categoriza cada tópico en una jerarquía de progresión pedagógica estricta:

```javascript
level: {
  type: String,
  enum: ['junior', 'mid', 'senior'],
  default: 'junior',
  index: true,
}
```

### 6.2 Flujo de Datos y Sincronización de Nivel en la UI

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Desarrollador
    participant UI as React UI (Dashboard / Trainers)
    participant API as Express API (/summary & /topics/due)
    participant DB as MongoDB (Topic Collection)

    Usuario->>UI: Clic en Nivel (ej. "Junior")
    UI->>API: GET /api/dashboard/summary?level=junior
    API->>DB: Topic.find({ level: "junior", nextReviewAt: { $lte: now } })
    DB-->>API: 20 temas junior vencidos (10 Hard, 10 Soft)
    API-->>UI: { dueCount: 20, dueHardSkills: 10, dueSoftSkills: 10, ... }
    UI-->>Usuario: Actualiza contadores y badges visuales

    Usuario->>UI: Navega a Soft Skills (Nivel Junior)
    UI->>API: GET /api/topics/due?level=junior
    API->>DB: Topic.find({ level: "junior" })
    DB-->>API: Array de temas de nivel junior
    API-->>UI: 10 Soft Skills (Daily Standup, Demo PM, Code Review...)
    UI-->>Usuario: Selector poblado exclusivamente con escenarios Junior
```

### 6.3 Estrategia de Seeding con `Topic.bulkWrite`

Para garantizar idempotencia y migración transparente de bases de datos preexistentes, `server/src/scripts/seed.js` orquesta un batch `bulkWrite`:

```javascript
const operations = topics.map((t) => ({
  updateOne: {
    filter: { title: t.title },
    update: {
      $set: {
        level: t.level || 'junior',
        category: t.category,
        type: t.type,
      },
      $setOnInsert: {
        srsStage: t.srsStage ?? 0,
        easeFactor: t.easeFactor ?? 2.5,
        intervalDays: t.intervalDays ?? 0,
        nextReviewAt: t.nextReviewAt || new Date(),
        history: t.history || [],
      },
    },
    upsert: true,
  },
}));
```

Esta estrategia asegura que:
1. Nuevos temas se insertan (`upsert: true`).
2. Temas existentes actualizan forzosamente su campo `level` sin sobreescribir el historial de revisiones ni la etapa SRS alcanzada por el usuario.

---

## 7. Arquitectura de Prompts Estratificados y UI Dinámica (US-09)

Para garantizar un andamiaje pedagógico coherente, la generación de contenido por IA y los criterios de evaluación se estratifican en backend según `topic.level` (`'junior' | 'mid' | 'senior'`), evitando exigir liderazgo senior o análisis de bajo nivel en perfiles formativos.

### 7.1 Catálogo de Roles Estratificados (`SPARRING_ROLES_BY_LEVEL`)

```javascript
export const SPARRING_ROLES_BY_LEVEL = {
  junior: [
    {
      roleId: 'senior_peer_mentor',
      roleName: 'Compañero Senior de Equipo',
      roleDescription: 'Tu compañero Senior en una sesión de 1:1 o revisión de código',
      avatar: '🧑‍💻',
      attitude: 'Accesible, pedagógico y constructivo; exige orden y que demuestres análisis previo.',
    },
    {
      roleId: 'accessible_scrum_pm',
      roleName: 'Scrum Master / PM de Equipo',
      roleDescription: 'Scrum Master / PM en el Daily Standup matutino',
      avatar: '📋',
      attitude: 'Empático y pragmático; requiere actualización concisa (qué hice, qué haré, bloqueos).',
    },
    {
      roleId: 'code_reviewer_peer',
      roleName: 'Revisor de Pull Request',
      roleDescription: 'Compañero revisando tu Pull Request en GitHub',
      avatar: '🔍',
      attitude: 'Pregunta con amabilidad el por qué de la solución y sugiere mejoras de legibilidad.',
    },
  ],
  mid: [
    {
      roleId: 'pragmatic_tech_lead',
      roleName: 'Tech Lead Pragmático',
      roleDescription: 'Tech Lead priorizando deuda técnica y entregables del sprint',
      avatar: '🛡️',
      attitude: 'Equilibrio entre clean code y velocidad de entrega.',
    },
    {
      roleId: 'tight_deadlines_pm',
      roleName: 'Product Manager con Fechas Ajustadas',
      roleDescription: 'Product Manager negociando alcance para cumplir la fecha de release',
      avatar: '💼',
      attitude: 'Preocupado por fechas de lanzamiento y recorte de alcance negociable.',
    },
    {
      roleId: 'qa_lead',
      roleName: 'Líder de QA / Calidad',
      roleDescription: 'Líder de QA revisando cobertura de pruebas y edge cases',
      avatar: '🧪',
      attitude: 'Exige saber cómo probar edge cases y prevenir regresiones en staging.',
    },
  ],
  senior: [
    {
      roleId: 'skeptical_cto',
      roleName: 'CTO Escéptico',
      roleDescription: 'CTO de la empresa en revisión de arquitectura y costos',
      avatar: '👔',
      attitude: 'Exige justificaciones profundas de arquitectura, resiliencia y costos cloud.',
    },
    {
      roleId: 'demanding_enterprise_client',
      roleName: 'Director de Negocio / Cliente Corporativo',
      roleDescription: 'Director Corporativo evaluando ROI y plazos de entrega',
      avatar: '🏢',
      attitude: 'Enfocado en ventas y métricas financieras; cuestiona gasto técnico y exige SLA.',
    },
    {
      roleId: 'security_auditor',
      roleName: 'Auditor de Seguridad y Cumplimiento',
      roleDescription: 'Auditor de Seguridad evaluando riesgos críticos y gobernanza',
      avatar: '🔒',
      attitude: 'Desconfía de dependencias externas, exige cifrado y planes de contingencia.',
    },
  ],
};
```

### 7.2 Diagrama de Flujo de Estratificación de Prompts

```mermaid
flowchart TD
    Req([Petición con topicId]) --> GetTopic[Consultar Topic en Mongo]
    GetTopic --> LevelCheck{Evaluar topic.level}

    subgraph Hard Skills (geminiService.js)
        LevelCheck -->|junior| JrHard[Prompt Junior: Sintaxis cotidiana, inmutabilidad y bases funcionales]
        LevelCheck -->|mid| MidHard[Prompt Mid: Patrones, modularización, clean code y asincronía]
        LevelCheck -->|senior| SrHard[Prompt Senior: Arquitectura interna, fases libuv, trade-offs y resiliencia]
    end

    subgraph Soft Skills (softSkillSparringService.js)
        LevelCheck -->|junior| JrSoft[Rol Cercano: Peer Senior / Scrum PM / PR Reviewer<br/>Tono constructivo, sin exigencia de ROI]
        LevelCheck -->|mid| MidSoft[Rol Técnico de Sprint: Tech Lead Pragmático / PM Ajustado<br/>Negociación de alcance y deuda técnica]
        LevelCheck -->|senior| SrSoft[Rol Ejecutivo: CTO / Cliente Corporativo / Auditor<br/>Exigencia de SLA, costos cloud y tolerancia a fallos]
    end
```

### 7.3 Badges Dinámicos en Frontend

Los componentes `HardSkillTrainer.jsx` y `SoftSkillTrainer.jsx` sincronizan dinámicamente sus estados para reflejar el nivel activo:
- `#dynamic-level-badge-hard-skills` y `#dynamic-level-badge-soft-skills` exhiben `NIVEL JUNIOR`, `NIVEL MID` o `NIVEL SENIOR`.
- En Soft Skills, la tarjeta de interlocutor activo (`#client-role-banner`) proyecta el avatar contextual, el badge del nivel (`#client-role-level-badge`) y la descripción explícita del rol (`#client-role-description`).
- Los badges de calificación en ambas interfaces adaptan el texto (`Score 5/5 - Nivel Junior Sólido`) evitando asignar títulos de Staff/Senior a respuestas correctas de nivel Junior.

---

## 8. Cobertura y Resumen de Validación

| Componente / Suite | Herramienta | Conteo de Tests | Estado |
| :--- | :--- | :--- | :--- |
| **Backend Unit & Integration** | Vitest + Supertest + MongoMemoryServer | 59 tests (8 suites) | **100% PASS** |
| **Frontend & End-to-End** | Playwright (Chromium Headless) | 16 tests E2E completos (6 suites) | **100% PASS** |
| **Estratificación Hard Skills** | Vitest / Supertest (`practice.test.js`) | 9 tests de generación y evaluación estratificada | **100% PASS** |
| **Estratificación Soft Skills** | Vitest / Supertest (`softSkillPractice.test.js`) | 8 tests de roles, réplicas y veredicto adaptado | **100% PASS** |
| **UI Badges y Roles Dinámicos** | Playwright E2E (`stratified-prompts.spec.js`) | 2 tests E2E verificando badges y rol description | **100% PASS** |
| **Catálogo Multinivel & Seeding** | Supertest / MongoMemoryServer (`seed.test.js`) | 5 tests de verificación de 62 temas y niveles | **100% PASS** |
| **Calidad de Código y Tipos** | AST Analysis / Graphify / ESLint | 0 regresiones | **Aprobado** |




