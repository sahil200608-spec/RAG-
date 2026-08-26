import React, { useState, useRef, useEffect, useCallback } from "react";



const API_BASE_URL =
   import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// Flip this to false once a live FastAPI service is reachable at API_BASE_URL.
// Every function below already has the real fetch() call written and ready.
const MOCK_MODE = false;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);



function buildFallbackAnswer(query, docs) {
  const primary = docs[0];
  const name = primary ? primary.name : "the selected document";
  const meta = primary && primary.meta ? primary.meta : "";
  return {
    answer: `${name} addresses this in the context of ${meta || "its subject matter"}.{{1}} A more specific question about a particular claim, figure, or section will usually surface a more precise passage.`,
    sources: [{ pages: [1, 2] }],
  };
}

const api = {
  // GET /documents — in mock mode the document list simply lives in Home's state,
  // so this is a no-op kept here to show where the real call belongs.
  async listDocuments() {
    if (MOCK_MODE) {
      await wait(200);
      return null;
    }
    const res = await fetch(`${API_BASE_URL}/document`);
    if (!res.ok) throw new Error("Unable to connect to the document service.");
    return res.json();
  },

  // POST /documents/upload — multipart/form-data. onStage reports the four
  // processing-stage strings the UI shows while ingestion runs.
  async uploadDocument(file, onStage) {
    if (MOCK_MODE) {
      onStage("Processing document…");
      await wait(700);
      onStage("Extracting text…");
      await wait(700);
      onStage("Creating searchable sections…");
      await wait(700);
      onStage("Document ready.");
      await wait(250);
      return {
        name: file.name,
        meta: `PDF · ${Math.floor(Math.random() * 18) + 6} pages`,
        pages: Math.floor(Math.random() * 18) + 6,
      };
    }
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE_URL}/document/upload`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error("Unable to process this document. Please try again.");
    const data = await res.json();

    onStage("Document ready.");

    return {
      name: data.filename,
      meta: `PDF · ${data.pages} pages`,
      pages: data.pages,
      chunks: data.chunks,

    };
  },

  // POST /ask — strips distance / rerank_score before returning to the UI;
  // those values are for backend debugging only.
  async ask(query, documentIds, docsForMock) {
    if (MOCK_MODE) {
      await wait(600);
      const key = query.trim().toLowerCase();
      const canned = CANNED_ANSWERS[key];
      const result = canned || buildFallbackAnswer(query, docsForMock);
      const primaryName = (docsForMock[0] && docsForMock[0].name) || "Document.pdf";
      return {
        answer: result.answer,
        sources: result.sources.map((s) => ({ document: primaryName, pages: s.pages })),
      };
    }
    const res = await fetch(`${API_BASE_URL}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query}),
    });
    if (!res.ok) throw new Error("Something went wrong while generating the answer.");
    const data = await res.json();
    return {
      answer: data.answer,
      sources: (data.sources || []).map((s) => ({
        document: s.document || "Document",
        pages: s.pages,
      })),
    };
  },
};

/* ----------------------------------------------------------------------------------
   components/Navbar
   ------------------------------------------------------------------------------- */

function Navbar() {
  return (
    <header className="rd-nav">
      <div className="rd-nav__inner">
        <span className="rd-wordmark">READER</span>
        <nav className="rd-nav__links">
          <button className="rd-nav__link" type="button">
            Documents
          </button>
          <button className="rd-nav__link" type="button">
            About
          </button>
        </nav>
      </div>
    </header>
  );
}

/* ----------------------------------------------------------------------------------
   components/DocumentUpload
   ------------------------------------------------------------------------------- */

function DocumentUpload({ onFile, error, onDismissError }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div
      className={`rd-upload ${dragOver ? "is-drag" : ""} ${error ? "is-error" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {error ? (
        <>
          <p className="rd-upload__title">Unable to process this document. Please try again.</p>
          <button
            type="button"
            className="rd-upload__link"
            onClick={() => {
              onDismissError();
              inputRef.current && inputRef.current.click();
            }}
          >
            Choose a file
          </button>
        </>
      ) : (
        <>
          <p className="rd-upload__title">Add a document</p>
          <p className="rd-upload__hint">
            Drop a PDF here, or{" "}
            <button type="button" className="rd-upload__link" onClick={() => inputRef.current && inputRef.current.click()}>
              choose a file
            </button>
          </p>
          <p className="rd-upload__format">PDF</p>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        hidden
        onChange={(e) => {
          const file = e.target.files && e.target.files[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ----------------------------------------------------------------------------------
   components/DocumentList
   ------------------------------------------------------------------------------- */

function DocumentList({ documents, selected, onToggle, onSelectAll }) {
  if (documents.length === 0) return null;

  const allSelected = selected === "all";

  return (
    <section className="rd-library">
      <div className="rd-library__head">
        <h2 className="rd-library__title">Documents</h2>
        <button
          type="button"
          className={`rd-scope__pill ${allSelected ? "is-active" : ""}`}
          onClick={onSelectAll}
        >
          All documents
        </button>
      </div>
      <ul className="rd-doclist">
        {documents.map((doc) => {
          const isReady = doc.status === "ready";
          const isChosen = allSelected || (selected instanceof Set && selected.has(doc.id));
          return (
            <li key={doc.id} className={`rd-doclist__row status-${doc.status}`}>
              <button
                type="button"
                className={`rd-doclist__select ${isChosen ? "is-active" : ""}`}
                onClick={() => isReady && onToggle(doc.id)}
                disabled={!isReady}
              >
                <span className="rd-doclist__mark" aria-hidden="true" />
                <span className="rd-doclist__body">
                  <span className="rd-doclist__name">{doc.name}</span>
                  <span className="rd-doclist__meta">{doc.meta}</span>
                </span>
                <span className="rd-doclist__status">
                  {doc.status === "ready" ? "Ready" : doc.status === "error" ? "Failed" : doc.stage || "Processing…"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ----------------------------------------------------------------------------------
   components/QuestionInput
   ------------------------------------------------------------------------------- */

const EXAMPLE_QUESTIONS = [
  "What is deliberate practice?",
  "What constraints affect deliberate practice?",
  "How does deliberate practice contribute to expertise?",
];

function QuestionInput({ disabled, onAsk }) {
  const [value, setValue] = useState("");

  const submit = (q) => {
    const text = (q !== undefined ? q : value).trim();
    if (!text || disabled) return;
    onAsk(text);
    setValue("");
  };

  return (
    <div className="rd-ask">
      <div className="rd-ask__field">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Ask something about your documents…"
          disabled={disabled}
          aria-label="Ask a question about your documents"
        />
        <button
          type="button"
          className="rd-ask__submit"
          onClick={() => submit()}
          disabled={disabled || !value.trim()}
          aria-label="Ask"
        >
          ↑
        </button>
      </div>
      <div className="rd-ask__examples">
        {EXAMPLE_QUESTIONS.map((q) => (
          <button key={q} type="button" className="rd-ask__example" onClick={() => submit(q)} disabled={disabled}>
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------------
   components/Answer + components/Sources, combined as a single "Exchange"
   ------------------------------------------------------------------------------- */

// Splits a run of text on **bold**, {{n}} citation markers, and the
// "(Source 1, Source 2)" style citation groups some models produce, turning
// each into the right inline element. Falls back to plain text for everything else.
function renderInline(text, exchangeId, keyPrefix) {
  const tokenRegex = /(\*\*.+?\*\*|\{\{\d+\}\}|\(\s*Source\s+\d+(?:\s*,\s*Source\s+\d+)*\s*\))/g;
  const parts = text.split(tokenRegex).filter((part) => part !== undefined && part !== "");

  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;

    const bold = part.match(/^\*\*(.+)\*\*$/);
    if (bold) {
      return <strong key={key}>{bold[1]}</strong>;
    }

    const singleCite = part.match(/^\{\{(\d+)\}\}$/);
    if (singleCite) {
      return (
        <a key={key} className="rd-cite" href={`#src-${exchangeId}-${singleCite[1]}`}>
          {singleCite[1]}
        </a>
      );
    }

    const groupCite = /^\(\s*Source\s+\d+/.test(part);
    if (groupCite) {
      const nums = part.match(/\d+/g) || [];
      return (
        <span key={key} className="rd-cite-group">
          {nums.map((n, ni) => (
            <a key={`${key}-${ni}`} className="rd-cite" href={`#src-${exchangeId}-${n}`}>
              {n}
            </a>
          ))}
        </span>
      );
    }

    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

// Turns raw answer text into paragraphs and bullet lists. Handles both
// properly newline-separated markdown lists and the flattened
// "* **Label:** text * **Label:** text" form some responses come back as.
function renderAnswer(text, exchangeId) {
  const blocks = text.trim().split(/\n\s*\n/);
  const bulletLine = /^[*-]\s+(?!\*)(.*)$/;

  return blocks.map((block, bIdx) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const isNewlineList = lines.length > 0 && lines.every((l) => bulletLine.test(l));

    if (isNewlineList) {
      return (
        <ul key={bIdx} className="rd-answer__list">
          {lines.map((line, lIdx) => (
            <li key={lIdx} className="rd-answer__li">
              {renderInline(line.match(bulletLine)[1], exchangeId, `${bIdx}-${lIdx}`)}
            </li>
          ))}
        </ul>
      );
    }

    // Same-line bullets: " * **Label:** text * **Label:** text …"
    const inlineItems = block.split(/\s\*\s(?=\*\*)/).map((s) => s.replace(/^\*\s+/, "").trim());
    if (inlineItems.length > 1) {
      return (
        <ul key={bIdx} className="rd-answer__list">
          {inlineItems.map((item, lIdx) => (
            <li key={lIdx} className="rd-answer__li">
              {renderInline(item, exchangeId, `${bIdx}-${lIdx}`)}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p key={bIdx} className="rd-answer__p">
        {renderInline(block, exchangeId, `${bIdx}`)}
      </p>
    );
  });
}

function Exchange({ item }) {
  return (
    <div className="rd-exchange">
      <p className="rd-exchange__q">{item.question}</p>

      {item.status === "loading" && <p className="rd-status">{item.loadingLabel}</p>}

      {item.status === "error" && <p className="rd-status rd-status--error">{item.error}</p>}

      {item.status === "done" && (
        <>
          <h3 className="rd-exchange__label">Answer</h3>
          <div className="rd-answer">{renderAnswer(item.answer, item.id)}</div>

          {item.sources && item.sources.length > 0 && (
            <div className="rd-sources">
              <h4 className="rd-sources__label">Sources</h4>
              <ol className="rd-sources__list">
                {item.sources.map((s, i) => (
                  <li key={i} id={`src-${item.id}-${i + 1}`} className="rd-sources__row">
                    <span className="rd-sources__num">{i + 1}</span>
                    <span className="rd-sources__doc">{s.document}</span>
                    <span className="rd-sources__pages">
                      pp. {s.pages[0]}
                      {s.pages.length > 1 ? `–${s.pages[s.pages.length - 1]}` : ""}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------------------
   pages/Home
   ------------------------------------------------------------------------------- */

const LOADING_STAGES = ["Searching documents…", "Finding relevant passages…", "Generating answer…"];

function Home() {
  const [documents, setDocuments] = useState([
    {
      id: "seed-deliberate-practice",
      name: "DeliberatePractice.pdf",
      meta: "Psychological Review · 1993",
      status: "ready",
    },
  ]);
  const [selected, setSelected] = useState("all");
  const [uploadError, setUploadError] = useState(false);
  const [exchanges, setExchanges] = useState([]);
  const endRef = useRef(null);

  const readyDocs = documents.filter((d) => d.status === "ready");

  const handleFile = useCallback(async (file) => {
    if (file.type !== "application/pdf") {
      setUploadError(true);
      return;
    }
    setUploadError(false);
    const id = uid();
    setDocuments((prev) => [
      ...prev,
      { id, name: file.name, meta: "PDF", status: "processing", stage: "Processing document…" },
    ]);
    try {
      const result = await api.uploadDocument(file, (stage) => {
        setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, stage } : d)));
      });
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...result, status: "ready" } : d))
      );
    } catch (e) {
      setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, status: "error" } : d)));
    }
  }, []);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      if (prev === "all") return new Set([id]);
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next.size === 0 ? "all" : next;
    });
  };

  const handleAsk = async (question) => {
    const id = uid();
    setExchanges((prev) => [
      ...prev,
      { id, question, status: "loading", loadingLabel: LOADING_STAGES[0] },
    ]);

    let stageIdx = 0;
    const interval = setInterval(() => {
      stageIdx += 1;
      if (stageIdx < LOADING_STAGES.length) {
        setExchanges((prev) =>
          prev.map((e) => (e.id === id ? { ...e, loadingLabel: LOADING_STAGES[stageIdx] } : e))
        );
      }
    }, 550);

    const scopeDocs =
      selected === "all" ? readyDocs : readyDocs.filter((d) => selected.has(d.id));

    try {
      const { answer, sources } = await api.ask(
        question,
        scopeDocs.map((d) => d.id),
        scopeDocs.length ? scopeDocs : readyDocs
      );
      clearInterval(interval);
      setExchanges((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: "done", answer, sources } : e))
      );
    } catch (err) {
      clearInterval(interval);
      setExchanges((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, status: "error", error: err.message || "Something went wrong while generating the answer." }
            : e
        )
      );
    }
  };

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [exchanges.length]);

  return (
    <main className="rd-main">
      <div className="rd-workspace">
        <div className="rd-intro">
          <h1>Ask your documents.</h1>
          <p>Search your documents and get answers grounded in their content.</p>
        </div>

        <DocumentUpload onFile={handleFile} error={uploadError} onDismissError={() => setUploadError(false)} />

        {documents.length === 0 ? (
          <div className="rd-empty">
            <p className="rd-empty__title">No documents yet.</p>
            <p className="rd-empty__hint">Upload a PDF to start asking questions.</p>
          </div>
        ) : (
          <DocumentList
            documents={documents}
            selected={selected}
            onToggle={toggleSelect}
            onSelectAll={() => setSelected("all")}
          />
        )}

        {readyDocs.length > 0 && (
          <>
            <div className="rd-divider" />
            <QuestionInput disabled={false} onAsk={handleAsk} />

            {exchanges.length > 0 && (
              <div className="rd-exchanges">
                {exchanges.map((item) => (
                  <Exchange key={item.id} item={item} />
                ))}
                <div ref={endRef} />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

/* ----------------------------------------------------------------------------------
   Global styles
   ------------------------------------------------------------------------------- */

function GlobalStyles() {
  return (
    <style>{`
      html,
      body,
      #root {
        margin: 0;
        width: 100%;
        min-height: 100%;
      }

      body {
        background: #F4EFE4;
      }

      @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

      .rd-root {
        --paper: #F4EFE4;
        --paper-deep: #ECE4D2;
        --line: #DBD1BA;
        --ink: #24211B;
        --ink-soft: #6C6455;
        --ink-faint: #9A9382;
        --accent: #3F4D3B;
        --accent-soft: #7C8A72;
        --error: #8C3B2E;

        background-color: var(--paper);
        background-image:
          radial-gradient(circle at 1px 1px, rgba(36,33,27,0.035) 1px, transparent 0);
        background-size: 22px 22px;
        color: var(--ink);
        font-family: 'Inter', -apple-system, sans-serif;
        min-height: 100vh;
        -webkit-font-smoothing: antialiased;
      }

      .rd-root * { box-sizing: border-box; }
      .rd-root button { font-family: inherit; }
      .rd-root :focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }

      /* ---- Nav ---- */
      .rd-nav {
        border-bottom: 1px solid var(--line);
      }
      .rd-nav__inner {
        max-width: 760px;
        margin: 0 auto;
        padding: 22px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .rd-wordmark {
        font-family: 'Lora', serif;
        font-size: 15px;
        letter-spacing: 0.16em;
        font-weight: 500;
      }
      .rd-nav__links { display: flex; gap: 22px; }
      .rd-nav__link {
        background: none;
        border: none;
        color: var(--ink-soft);
        font-size: 13px;
        cursor: pointer;
        padding: 4px 2px;
        transition: color 0.15s ease;
      }
      .rd-nav__link:hover { color: var(--ink); }

      /* ---- Main workspace ---- */
      .rd-main { padding: 56px 24px 96px; }
      .rd-workspace { max-width: 620px; margin: 0 auto; }

      .rd-intro { margin-bottom: 40px; }
      .rd-intro h1 {
        font-family: 'Lora', serif;
        font-weight: 500;
        font-size: 26px;
        margin: 0 0 8px;
        letter-spacing: -0.01em;
      }
      .rd-intro p {
        color: var(--ink-soft);
        font-size: 14.5px;
        margin: 0;
        line-height: 1.5;
      }

      /* ---- Upload ---- */
      .rd-upload {
        border: 1px dashed var(--line);
        border-radius: 3px;
        padding: 26px 24px;
        text-align: center;
        margin-bottom: 36px;
        transition: border-color 0.15s ease, background-color 0.15s ease;
      }
      .rd-upload.is-drag {
        border-color: var(--accent);
        background-color: var(--paper-deep);
      }
      .rd-upload.is-error {
        border-color: var(--error);
        border-style: solid;
      }
      .rd-upload__title {
        font-size: 14.5px;
        font-weight: 500;
        margin: 0 0 4px;
      }
      .rd-upload.is-error .rd-upload__title { color: var(--error); }
      .rd-upload__hint {
        color: var(--ink-soft);
        font-size: 13px;
        margin: 0 0 10px;
      }
      .rd-upload__link {
        background: none;
        border: none;
        color: var(--accent);
        text-decoration: underline;
        text-underline-offset: 2px;
        cursor: pointer;
        font-size: inherit;
        padding: 0;
      }
      .rd-upload__format {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 10.5px;
        letter-spacing: 0.1em;
        color: var(--ink-faint);
        margin: 0;
      }

      /* ---- Empty state ---- */
      .rd-empty { text-align: center; padding: 20px 0 8px; margin-bottom: 8px; }
      .rd-empty__title { font-family: 'Lora', serif; font-size: 15px; margin: 0 0 4px; }
      .rd-empty__hint { color: var(--ink-soft); font-size: 13px; margin: 0; }

      /* ---- Document library ---- */
      .rd-library { margin-bottom: 36px; }
      .rd-library__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      .rd-library__title {
        font-family: 'Lora', serif;
        font-size: 15px;
        font-weight: 500;
        margin: 0;
      }
      .rd-scope__pill {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 11px;
        letter-spacing: 0.02em;
        color: var(--ink-faint);
        background: none;
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 4px 11px;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .rd-scope__pill.is-active {
        color: var(--accent);
        border-color: var(--accent-soft);
        background-color: rgba(63,77,59,0.06);
      }

      .rd-doclist { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--line); }
      .rd-doclist__row { border-bottom: 1px solid var(--line); }
      .rd-doclist__select {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 12px;
        background: none;
        border: none;
        text-align: left;
        padding: 13px 6px;
        cursor: pointer;
        border-left: 2px solid transparent;
        transition: border-color 0.15s ease, background-color 0.15s ease;
      }
      .rd-doclist__select:hover:not(:disabled) { background-color: rgba(36,33,27,0.02); }
      .rd-doclist__select:disabled { cursor: default; }
      .rd-doclist__select.is-active { border-left-color: var(--accent); }
      .rd-doclist__mark {
        width: 6px; height: 6px; border-radius: 50%;
        background: var(--ink-faint);
        flex-shrink: 0;
      }
      .status-ready .rd-doclist__mark { background: var(--accent); }
      .status-error .rd-doclist__mark { background: var(--error); }
      .status-processing .rd-doclist__mark {
        background: var(--ink-faint);
        animation: rd-pulse 1.4s ease-in-out infinite;
      }
      @keyframes rd-pulse { 0%,100% { opacity: 0.35; } 50% { opacity: 1; } }

      .rd-doclist__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
      .rd-doclist__name {
        font-family: 'Lora', serif;
        font-size: 14px;
        color: var(--ink);
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .rd-doclist__meta {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 10.5px;
        color: var(--ink-faint);
      }
      .rd-doclist__status {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 10.5px;
        color: var(--ink-soft);
        flex-shrink: 0;
        white-space: nowrap;
      }
      .status-ready .rd-doclist__status { color: var(--accent); }
      .status-error .rd-doclist__status { color: var(--error); }

      .rd-divider { height: 1px; background: var(--line); margin: 8px 0 32px; }

      /* ---- Ask ---- */
      .rd-ask { margin-bottom: 20px; }
      .rd-ask__field {
        display: flex;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 3px;
        background: #fff;
        padding: 4px 4px 4px 16px;
        transition: border-color 0.15s ease;
      }
      .rd-ask__field:focus-within { border-color: var(--accent); }
      .rd-ask__field input {
        flex: 1;
        border: none;
        outline: none;
        background: none;
        font-family: 'Inter', sans-serif;
        font-size: 14.5px;
        padding: 11px 0;
        color: var(--ink);
      }
      .rd-ask__field input::placeholder { color: var(--ink-faint); }
      .rd-ask__submit {
        width: 32px; height: 32px;
        border-radius: 50%;
        border: 1px solid var(--line);
        background: var(--paper);
        color: var(--ink-soft);
        cursor: pointer;
        font-size: 14px;
        line-height: 1;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.15s ease;
        flex-shrink: 0;
      }
      .rd-ask__submit:hover:not(:disabled) { background: var(--accent); color: #fff; border-color: var(--accent); }
      .rd-ask__submit:disabled { opacity: 0.4; cursor: default; }

      .rd-ask__examples {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 12px;
      }
      .rd-ask__example {
        align-self: flex-start;
        background: none;
        border: none;
        color: var(--ink-soft);
        font-size: 13px;
        text-align: left;
        cursor: pointer;
        padding: 2px 0;
        text-decoration: underline;
        text-decoration-color: var(--line);
        text-underline-offset: 3px;
        transition: color 0.15s ease, text-decoration-color 0.15s ease;
      }
      .rd-ask__example:hover:not(:disabled) { color: var(--accent); text-decoration-color: var(--accent-soft); }
      .rd-ask__example:disabled { opacity: 0.5; cursor: default; }

      /* ---- Exchange ---- */
      .rd-exchanges { margin-top: 40px; display: flex; flex-direction: column; gap: 36px; }
      .rd-exchange { border-top: 1px solid var(--line); padding-top: 22px; }
      .rd-exchange__q {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 12px;
        color: var(--ink-soft);
        margin: 0 0 16px;
      }
      .rd-exchange__q::before { content: "— "; color: var(--ink-faint); }

      .rd-status {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 12.5px;
        color: var(--ink-faint);
        animation: rd-fade 1.6s ease-in-out infinite;
      }
      .rd-status--error { color: var(--error); animation: none; }
      @keyframes rd-fade { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }

      .rd-exchange__label {
        font-family: 'Lora', serif;
        font-size: 13.5px;
        font-weight: 500;
        color: var(--ink-soft);
        margin: 0 0 10px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .rd-answer__p {
        font-size: 15.5px;
        line-height: 1.75;
        color: var(--ink);
        margin: 0 0 14px;
      }
      .rd-answer__p:last-child { margin-bottom: 0; }
      .rd-answer > *:last-child { margin-bottom: 0; }

      .rd-answer__list {
        margin: 0 0 14px;
        padding-left: 19px;
      }
      .rd-answer__li {
        font-size: 15.5px;
        line-height: 1.7;
        color: var(--ink);
        margin-bottom: 8px;
      }
      .rd-answer__li::marker {
        color: var(--accent-soft);
      }
      .rd-answer__li:last-child { margin-bottom: 0; }
      .rd-answer strong { font-weight: 600; }

      .rd-cite-group {
        display: inline-flex;
        gap: 2px;
        margin-left: 1px;
      }

      .rd-cite {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 10px;
        color: var(--accent);
        text-decoration: none;
        border: 1px solid var(--accent-soft);
        border-radius: 8px;
        padding: 0 5px;
        margin-left: 2px;
        vertical-align: super;
      }
      .rd-cite:hover { background: rgba(63,77,59,0.08); }

      .rd-sources { margin-top: 20px; }
      .rd-sources__label {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--ink-faint);
        margin: 0 0 6px;
      }
      .rd-sources__list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        row-gap: 4px;
        column-gap: 16px;
      }
      .rd-sources__row {
        display: flex;
        align-items: baseline;
        gap: 5px;
      }
      .rd-sources__num {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 10px;
        color: var(--accent);
      }
      .rd-sources__doc {
        font-family: 'Lora', serif;
        font-size: 12.5px;
        color: var(--ink);
      }
      .rd-sources__pages {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 10.5px;
        color: var(--ink-faint);
      }

      /* ---- Responsive ---- */
      @media (max-width: 640px) {
        .rd-nav__inner { padding: 18px 18px; }
        .rd-main { padding: 36px 18px 72px; }
        .rd-intro h1 { font-size: 22px; }
        .rd-upload { padding: 20px 16px; }
        .rd-ask__field input { font-size: 15px; }
        .rd-sources__list { column-gap: 12px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .rd-status, .status-processing .rd-doclist__mark { animation: none; }
      }
    `}</style>
  );
}

/* ----------------------------------------------------------------------------------
   App
   ------------------------------------------------------------------------------- */

export default function App() {
  return (
    <div className="rd-root">
      <GlobalStyles />
      <Navbar />
      <Home />
    </div>
  );
}
